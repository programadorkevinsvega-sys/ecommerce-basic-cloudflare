import { Hono } from 'hono';
import { z } from 'zod';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';

export class InvoicingController {
  public static createRoutes(
    invoicingGateway: InvoicingGateway,
    identityGateway: IdentityGateway,
    auditGateway: AuditGateway
  ): Hono {
    const app = new Hono();

    app.get('/api/v1/admin/factus/numbering-ranges', async (c) => {
      const token = getSessionToken(c.req.header('authorization'), c.req.header('cookie'), true);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const admin = await identityGateway.validateSession(token);
      if (admin?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (!hasPermission(admin.permissions, 'settings:read') && !hasPermission(admin.permissions, 'settings:edit')) {
        return c.json({ error: 'Permiso insuficiente' }, 403);
      }
      try {
        const ranges = await invoicingGateway.listElectronicNumberingRanges();
        return c.json({ success: true, ranges }, 200, { 'Cache-Control': 'no-store' });
      } catch (error) {
        const code = error instanceof Error ? error.message : '';
        const status = code === 'FACTUS_NOT_CONFIGURED' ? 503 : 502;
        return c.json({ error: status === 503 ? 'Configura y guarda el entorno y las credenciales de Factus antes de consultar rangos.' : 'Factus no pudo entregar los rangos. Verifica el entorno y vuelve a intentar.' }, status);
      }
    });

    // GET /api/v1/invoices/:id/document — Descarga autenticada del PDF de la factura
    app.get('/api/v1/invoices/:id/document', async (c) => {
      const id = c.req.param('id');
      const invoice = await invoicingGateway.getInvoice({ id });
      if (!invoice) return c.json({ error: 'Factura no encontrada' }, 404);
      const token = getSessionToken(c.req.header('authorization'), c.req.header('cookie'));
      if (!token) return c.json({ error: 'Factura no encontrada' }, 404);
      try {
        const session = await identityGateway.validateSession(token);
        const allowed = session.actorType === 'admin'
          ? hasPermission(session.permissions, 'invoices:read')
          : session.actorType === 'customer' && invoice.customerId === session.actorId;
        if (!allowed) return c.json({ error: 'Factura no encontrada' }, 404);
      } catch { return c.json({ error: 'Factura no encontrada' }, 404); }

      if (!invoice.pdfR2Key) return c.json({ error: 'Documento no disponible' }, 404);
      const object = await invoicingGateway.getInvoiceDocument(invoice.id);
      if (!object) return c.json({ error: 'Archivo en almacenamiento no encontrado' }, 404);
      const safeInvoiceNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `factura-${safeInvoiceNumber}.pdf`;
      return new Response(object.stream, { headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(object.sizeBytes),
        'Content-Disposition': `${c.req.query('view') === '1' ? 'inline' : 'attachment'}; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        etag: object.etag,
      } });
    });

    // GET /api/v1/admin/invoices — Lista de facturas para el panel de administración
    app.get('/api/v1/admin/invoices', async (c) => {
      const token = getSessionToken(c.req.header('authorization'), c.req.header('cookie'), true);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (!hasPermission(adminRes.permissions, 'invoices:read')) return c.json({ error: 'Permiso insuficiente' }, 403);
      const parsed = invoicePageQuery.safeParse({ page: c.req.query('page') || '1', pageSize: c.req.query('pageSize') || '25', query: c.req.query('q') || undefined, electronicOnly: c.req.query('electronicOnly') === '1', electronicStatus: c.req.query('electronicStatus') || undefined });
      if (!parsed.success) return c.json({ error: 'Búsqueda o paginación inválida' }, 400);
      const filters = { query: parsed.data.query?.trim() || undefined, electronicOnly: parsed.data.electronicOnly, electronicStatus: parsed.data.electronicStatus };
      const [invoices, total] = await Promise.all([
        invoicingGateway.listInvoices({ ...filters, limit: parsed.data.pageSize, offset: (parsed.data.page - 1) * parsed.data.pageSize }),
        invoicingGateway.countInvoices(filters),
      ]);
      return c.json({ success: true, invoices: invoices.map((inv) => inv.toJSON()), total, page: parsed.data.page,
        pageSize: parsed.data.pageSize, hasMore: parsed.data.page * parsed.data.pageSize < total });
    });

    // POST /api/v1/admin/invoices/:id/credit-notes — Emitir nota crédito
    app.post('/api/v1/admin/invoices/:id/credit-notes', async (c) => {
      const token = getSessionToken(c.req.header('authorization'), c.req.header('cookie'), true);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (!hasPermission(adminRes.permissions, 'invoices:credit_note')) return c.json({ error: 'Permiso insuficiente' }, 403);

      const invoiceId = c.req.param('id');
      const body = await c.req.json();
      if (typeof body.reason !== 'string' || body.reason.trim().length === 0 || body.reason.length > 500 ||
        !Number.isSafeInteger(body.amountInCents) || body.amountInCents <= 0 ||
        !['1', '2', '3', '4', '5', '6'].includes(body.correctionConceptCode)) {
        return c.json({ error: 'Motivo, concepto DIAN y monto válido son requeridos' }, 400);
      }

      try {
        const creditNote = await invoicingGateway.createCreditNote({
          invoiceId,
          reason: body.reason.trim(),
          amountInCents: body.amountInCents,
          issuedBy: adminRes.actorId,
          correctionConceptCode: body.correctionConceptCode,
          traceId: (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown',
        });

        await auditGateway.record({
          actorId: adminRes.actorId,
          actorType: 'admin',
          action: 'invoicing.credit_note_issued',
          entityType: 'credit_note',
          entityId: creditNote.id,
          changes: { invoiceId, amountInCents: body.amountInCents, reasonProvided: true, reasonLength: body.reason.trim().length },
        });

        return c.json({ success: true, creditNote: creditNote.toJSON() });
      } catch (err: unknown) {
        return c.json({ error: 'No se pudo emitir la nota crédito' }, 400);
      }
    });

    return app;
  }
}

const invoicePageQuery = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000),
  pageSize: z.coerce.number().int().min(1).max(50),
  query: z.string().max(120).optional(),
  electronicOnly: z.boolean().default(false),
  electronicStatus: z.enum(['pending', 'accepted', 'rejected', 'not_configured']).optional(),
}).strict();

function getSessionToken(authorization?: string, cookieHeader?: string, adminOnly = false): string | null {
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();
  const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) =>
    part.startsWith('__Host-admin-session=') || !adminOnly && part.startsWith('__Host-session='));
  return cookie?.slice(cookie.indexOf('=') + 1) || null;
}

function hasPermission(permissions: string[], required: string): boolean {
  return permissions.some((permission) => permission === '*' || permission === required || permission.endsWith(':*') && required.startsWith(permission.slice(0, -1)));
}
