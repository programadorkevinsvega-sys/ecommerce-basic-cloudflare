import { Hono } from 'hono';
import { z } from 'zod';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';

const updateSettingsSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  currency: z.string().length(3).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().max(20).optional(),
  requireCodVerification: z.boolean().optional(),
}).strict();

export class SettingsController {
  public static createRoutes(gateway: SettingsGateway): Hono {
    const router = new Hono();

    router.get('/', async (c) => {
      try {
        const settings = await gateway.getSettings();
        return c.json({ data: settings });
      } catch (error) {
        return c.json({ error: 'Error al consultar la configuración' }, 500);
      }
    });

    router.patch('/', async (c) => {
      try {
        const body = await c.req.json();
        const parsed = updateSettingsSchema.safeParse(body);

        if (!parsed.success) {
          return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
        }

        const updated = await gateway.updateSettings(parsed.data);
        return c.json({ data: updated });
      } catch (error) {
        return c.json({ error: 'Error al actualizar la configuración' }, 500);
      }
    });

    return router;
  }
}
