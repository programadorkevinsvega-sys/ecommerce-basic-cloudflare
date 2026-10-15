import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

const ConfigInput = z.object({
  enabled: z.boolean(),
  originDaneCode: z.string().regex(/^\d{8}$/),
  packageWidthCm: z.number().int().min(1).max(1000),
  packageLengthCm: z.number().int().min(1).max(1000),
  packageHeightCm: z.number().int().min(1).max(1000),
  packageWeightKg: z.number().int().min(1).max(1000),
  declaredValueMode: z.enum(['cost', 'sale_value']),
  cashOnDeliveryPaymentType: z.union([z.literal(101), z.literal(102)]),
  requestPickup: z.boolean(),
  selectionCriterion: z.enum(['price', 'time', 'score']),
}).strict();

export class MiPaqueteConfigController {
  public static createRoutes(shipping: ShippingGateway, identity: IdentityGateway): Hono<{ Bindings: Env }> {
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
        try {
          const config = await shipping.updateCarrierConfig({ ...parsed.data, updatedAt: new Date().toISOString() });
          return c.json({ success: true, config });
        } catch {
          return c.json({ error: 'No fue posible guardar la configuración logística' }, 400);
        }
      });
    return app;
  }
}
