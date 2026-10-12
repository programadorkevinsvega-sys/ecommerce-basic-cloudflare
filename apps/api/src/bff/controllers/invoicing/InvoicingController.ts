import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';

export class InvoicingController {
  public static createRoutes(
    invoicingGateway: InvoicingGateway,
    identityGateway: IdentityGateway,
    auditGateway: AuditGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    const getAdminToken = (c: any): string | null => {
      const auth = c.req.header('Authorization');
      if (auth?.startsWith('Bearer ')) return auth.slice(7);
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
      return match ? match[1] : null;
    };

    // GET /api/v1/invoices/:id/document — Descarga o visualización directa del HTML/PDF de la factura
    app.get('/api/v1/invoices/:id/document', async (c) => {
      const id = c.req.param('id');
      const invoice = await invoicingGateway.getInvoice({ id });
      if (!invoice) return c.json({ error: 'Factura no encontrada' }, 404);

      if (!invoice.pdfR2Key) return c.json({ error: 'Documento no disponible' }, 404);

      const object = await c.env.MEDIA_BUCKET.get(invoice.pdfR2Key);
      if (!object) return c.json({ error: 'Archivo en almacenamiento no encontrado' }, 404);

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Content-Type', 'text/html; charset=utf-8');

      return new Response(object.body, { headers });
    });

    // GET /api/v1/admin/invoices — Lista de facturas para el panel de administración
    app.get('/api/v1/admin/invoices', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

      const invoices = await invoicingGateway.listInvoices({ limit: 100 });
      return c.json({ success: true, invoices: invoices.map((inv) => inv.toJSON()) });
    });

    // POST /api/v1/admin/invoices/:id/credit-notes — Emitir nota crédito
    app.post('/api/v1/admin/invoices/:id/credit-notes', async (c) => {
      const token = getAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const adminRes = await identityGateway.validateSession(token);
      if (adminRes?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

      const invoiceId = c.req.param('id');
      const body = await c.req.json();
      if (!body.reason || !body.amountInCents) {
        return c.json({ error: 'reason y amountInCents son requeridos' }, 400);
      }

      try {
        const creditNote = await invoicingGateway.createCreditNote({
          invoiceId,
          reason: body.reason,
          amountInCents: Number(body.amountInCents),
          issuedBy: adminRes.actorId,
        });

        await auditGateway.record({
          actorId: adminRes.actorId,
          actorType: 'admin',
          action: 'invoicing.credit_note_issued',
          entityType: 'credit_note',
          entityId: creditNote.id,
          changes: { invoiceId, amountInCents: body.amountInCents, reason: body.reason },
        });

        return c.json({ success: true, creditNote: creditNote.toJSON() });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return c.json({ error: msg }, 400);
      }
    });

    return app;
  }
}
