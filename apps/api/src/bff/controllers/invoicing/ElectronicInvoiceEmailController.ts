import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { isAdminMfaPending } from '../../middleware/AuthMiddleware.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';

const retrySchema = z.object({ confirmedNotSent: z.literal(true) }).strict();

export class ElectronicInvoiceEmailController {
  public static createRoutes(invoicing: InvoicingGateway, identity: IdentityGateway, audit: AuditGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    app.post('/api/v1/admin/invoices/:id/electronic-email', async (c) => {
      const token = extractSessionToken(c.req.raw, '__Host-admin-session', c.env?.ENVIRONMENT);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const admin = await identity.validateSession(token);
      if (admin.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
      if (isAdminMfaPending(admin)) return c.json({ error: 'MFA obligatorio: completa el enrolamiento antes de usar el panel' }, 403);
      if (!hasPermission(admin.permissions, 'invoices:email')) return c.json({ error: 'Permiso insuficiente' }, 403);
      const input = retrySchema.safeParse(await c.req.json().catch(() => null));
      if (!input.success) return c.json({ error: 'Confirma que verificaste en Factus que la factura no fue enviada.' }, 400);
      const invoiceId = c.req.param('id');
      const invoice = await invoicing.getInvoice({ id: invoiceId });
      if (!invoice) return c.json({ error: 'Factura no encontrada' }, 404);
      if (invoice.electronicStatus !== 'accepted' || !invoice.electronicNumber) {
        return c.json({ error: 'Solo se puede enviar una factura electrónica aceptada por DIAN.' }, 409);
      }
      if (invoice.electronicEmailSent) return c.json({ error: 'La factura ya figura como enviada.' }, 409);
      await audit.record({
        actorId: admin.actorId, actorType: 'admin', action: 'invoicing.electronic_email_retry_started',
        entityType: 'invoice', entityId: invoiceId, changes: { confirmedNotSent: input.data.confirmedNotSent },
      });
      const result = await invoicing.sendElectronicInvoiceEmail(invoiceId);
      await audit.record({
        actorId: admin.actorId, actorType: 'admin', action: 'invoicing.electronic_email_retry_finished',
        entityType: 'invoice', entityId: invoiceId, changes: { result },
      });
      if (result === 'sent') return c.json({ success: true, message: 'Factus aceptó la solicitud de envío.' });
      if (result === 'uncertain') return c.json({ error: 'Factus no confirmó el envío. Verifica Factus antes de volver a intentarlo.' }, 502);
      return c.json({ error: result === 'already_sent' ? 'La factura ya figura como enviada.' : 'Ya hay un envío en curso.' }, 409);
    });
    return app;
  }
}

function hasPermission(permissions: string[], required: string): boolean {
  return permissions.some((permission) => permission === '*' || permission === required ||
    (permission.endsWith(':*') && required.startsWith(permission.slice(0, -1))));
}
