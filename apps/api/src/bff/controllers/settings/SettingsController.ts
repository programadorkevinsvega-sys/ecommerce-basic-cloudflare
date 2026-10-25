import { Hono } from 'hono';
import { z } from 'zod';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';

const updateSettingsSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  footerCopyrightText: z.string().max(160).optional(),
  currency: z.string().length(3).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().max(20).optional(),
  companyNit: z.string().max(50).optional(),
  companyLegalName: z.string().max(100).optional(),
  companyAddress: z.string().max(200).optional(),
  companyCity: z.string().max(100).optional(),
  companyCountry: z.string().max(100).optional(),
  factusMode: z.enum(['disabled', 'sandbox', 'production']).optional(),
  factusNumberingRangeId: z.string().max(40).optional(),
  factusCreditNoteNumberingRangeId: z.string().max(40).optional(),
  socialInstagramUrl: socialUrlSchema('instagram.com'),
  socialTiktokUrl: socialUrlSchema('tiktok.com'),
  socialFacebookUrl: socialUrlSchema('facebook.com'),
  requireCodVerification: z.boolean().optional(),
}).strict();

export class SettingsController {
  public static createRoutes(gateway: SettingsGateway, identityGateway: IdentityGateway, auditGateway?: AuditGateway): Hono {
    const router = new Hono();

    router.get('/', createAuthMiddleware(identityGateway, 'admin', 'settings:read'), async (c) => {
      try {
        const settings = await gateway.getSettings();
        return c.json({ data: settings });
      } catch (error) {
        return c.json({ error: 'Error al consultar la configuración' }, 500);
      }
    });

    router.patch('/', createAuthMiddleware(identityGateway, 'admin', 'settings:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const parsed = updateSettingsSchema.safeParse(body);

        if (!parsed.success) {
          return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
        }

        const updated = await gateway.updateSettings(parsed.data);
        const factusChanges = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => key.startsWith('factus')));
        if (Object.keys(factusChanges).length && auditGateway) await auditGateway.record({
          actorId: c.get('actorId'), actorType: 'admin', action: 'settings.factus_configuration.updated',
          entityType: 'settings_store', entityId: 'default', changes: factusChanges,
          traceId: (c.get('traceContext') as { traceId?: string } | undefined)?.traceId,
        });
        return c.json({ data: updated });
      } catch (error) {
        return c.json({ error: 'Error al actualizar la configuración' }, 500);
      }
    });

    return router;
  }
}

function socialUrlSchema(domain: string) {
  return z.string().max(200).refine((value) => {
    if (!value.trim()) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
        && !url.username && !url.password && !url.port;
    } catch { return false; }
  }, `Usa una URL HTTPS de ${domain}`).optional();
}
