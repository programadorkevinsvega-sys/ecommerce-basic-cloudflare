import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';
import { isAdminMfaPending } from '../../middleware/AuthMiddleware.js';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export class ElectronicInvoiceDocumentController {
  public static createRoutes(invoicing: InvoicingGateway, identity: IdentityGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    app.get('/api/v1/admin/invoices/:id/electronic-document', async (c) => {
      const token = extractSessionToken(c.req.raw, '__Host-admin-session', c.env?.ENVIRONMENT);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const admin = await identity.validateSession(token);
      if (admin.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (isAdminMfaPending(admin)) return c.json({ error: 'MFA obligatorio: completa el enrolamiento antes de usar el panel' }, 403);
      if (!hasPermission(admin.permissions, 'invoices:read')) return c.json({ error: 'Permiso insuficiente' }, 403);

      const invoice = await invoicing.getInvoice({ id: c.req.param('id') });
      if (!invoice) return c.json({ error: 'Factura no encontrada' }, 404);
      if (invoice.electronicStatus !== 'accepted' || !invoice.electronicNumber) {
        return c.json({ error: 'El PDF electrónico solo está disponible cuando Factus acepta la factura.' }, 409);
      }

      try {
        const document = await invoicing.downloadElectronicInvoicePdf(invoice.electronicNumber);
        const bytes = decodePdf(document.pdfBase64);
        const fileNumber = invoice.electronicNumber.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) ||
          invoice.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
        return new Response(bytes, { headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${c.req.query('view') === '1' ? 'inline' : 'attachment'}; filename="factura-electronica-${fileNumber}.pdf"`,
          'Content-Length': String(bytes.byteLength),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store',
        } });
      } catch {
        return c.json({ error: 'Factus no pudo entregar el PDF electrónico. Inténtalo de nuevo más tarde.' }, 502);
      }
    });
    return app;
  }
}

function decodePdf(base64: string): Uint8Array {
  const binary = atob(base64);
  if (binary.length < 5 || binary.length > MAX_PDF_BYTES || binary.slice(0, 5) !== '%PDF-') {
    throw new Error('FACTUS_INVOICE_PDF_INVALID_CONTENT');
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function hasPermission(permissions: string[], required: string): boolean {
  return permissions.some((permission) => permission === '*' || permission === required ||
    (permission.endsWith(':*') && required.startsWith(permission.slice(0, -1))));
}
