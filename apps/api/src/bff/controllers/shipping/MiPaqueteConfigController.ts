import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';

const ConfigInput = z.object({
  enabled: z.boolean(),
  originDaneCode: z.string().regex(/^\d{8}$/),
  packageWidthCm: z.number().int().min(1).max(1000).nullable().optional(),
  packageLengthCm: z.number().int().min(1).max(1000).nullable().optional(),
  packageHeightCm: z.number().int().min(1).max(1000).nullable().optional(),
  packageWeightKg: z.number().int().min(1).max(1000).nullable().optional(),
  packageProfiles: z.array(z.object({ id: z.string().min(1).max(80), name: z.string().min(1).max(100),
    innerWidthCm: z.number().int().min(1).max(300), innerLengthCm: z.number().int().min(1).max(300), innerHeightCm: z.number().int().min(1).max(300),
    outerWidthCm: z.number().int().min(1).max(300), outerLengthCm: z.number().int().min(1).max(300), outerHeightCm: z.number().int().min(1).max(300),
    tareWeightGrams: z.number().int().min(0).max(100000), maxWeightGrams: z.number().int().min(1).max(1000000),
    isActive: z.boolean(), createdAt: z.string().optional() }).strict()).max(20),
  declaredValueMode: z.enum(['cost', 'sale_value']),
  cashOnDeliveryPaymentType: z.union([z.literal(101), z.literal(102)]),
  requestPickup: z.boolean(),
  selectionCriterion: z.enum(['price', 'time', 'score']),
}).strict();

export class MiPaqueteConfigController {
  public static createRoutes(shipping: ShippingGateway, identity: IdentityGateway, audit: AuditGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    app.get('/api/v1/admin/shipping/mipaquete/config',
      createAuthMiddleware(identity, 'admin', 'shipping:read'), async (c) => {
        c.header('Cache-Control', 'private, no-store');
        const credentialsReady = Boolean(c.env.MI_PAQUETE_TRANSPORTADORA?.trim());
        const endpointReady = shipping.isCarrierApiConfigured();
        return c.json({ success: true, config: await shipping.getCarrierConfig(), credentialsReady, endpointReady });
      });
    app.put('/api/v1/admin/shipping/mipaquete/config',
      createAuthMiddleware(identity, 'admin', 'shipping:update'), async (c) => {
        const parsed = ConfigInput.safeParse(await c.req.json().catch(() => null));
        if (!parsed.success) return c.json({ error: 'Revisa los datos logísticos de MiPaquete' }, 400);
        if (parsed.data.enabled && !shipping.isCarrierApiConfigured()) {
          return c.json({ error: 'Configura el secret y un host HTTPS productivo válido en Cloudflare antes de activar.' }, 409);
        }
        try {
          const updatedAt = new Date().toISOString();
          const config = await shipping.updateCarrierConfig({ ...parsed.data,
            packageWidthCm: parsed.data.packageWidthCm ?? null, packageLengthCm: parsed.data.packageLengthCm ?? null,
            packageHeightCm: parsed.data.packageHeightCm ?? null, packageWeightKg: parsed.data.packageWeightKg ?? null,
            packageProfiles: parsed.data.packageProfiles.map((profile) => ({ ...profile, createdAt: profile.createdAt || updatedAt, updatedAt })), updatedAt });
          await audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin',
            action: 'shipping.mipaquete.configuration.updated', entityType: 'shipping_carrier_config',
            entityId: 'default', changes: { ...config } });
          return c.json({ success: true, config });
        } catch {
          return c.json({ error: 'No fue posible guardar la configuración logística' }, 400);
        }
      });
    return app;
  }
}
