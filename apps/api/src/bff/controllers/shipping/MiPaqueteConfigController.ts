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
    isActive: z.boolean(), createdAt: z.string().optional() }).strict()).max(20).optional(),
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
const ProfileInput = z.object({ name: z.string().trim().min(1).max(100), innerWidthCm: z.number().int().min(1).max(300),
  innerLengthCm: z.number().int().min(1).max(300), innerHeightCm: z.number().int().min(1).max(300),
  outerWidthCm: z.number().int().min(1).max(300), outerLengthCm: z.number().int().min(1).max(300),
  outerHeightCm: z.number().int().min(1).max(300), tareWeightGrams: z.number().int().min(0).max(100000),
  maxWeightGrams: z.number().int().min(1).max(1000000), isActive: z.boolean().optional() }).strict();
    app.put('/api/v1/admin/shipping/mipaquete/config',
      createAuthMiddleware(identity, 'admin', 'shipping:update'), async (c) => {
        const parsed = ConfigInput.safeParse(await c.req.json().catch(() => null));
        if (!parsed.success) return c.json({ error: 'Revisa los datos logísticos de MiPaquete' }, 400);
        if (parsed.data.enabled && !shipping.isCarrierApiConfigured()) {
          return c.json({ error: 'Configura el secret y un host HTTPS productivo válido en Cloudflare antes de activar.' }, 409);
        }
        try {
          const current = await shipping.getCarrierConfig();
          const config = await shipping.updateCarrierConfig({ ...parsed.data, packageProfiles: current.packageProfiles,
            packageWidthCm: parsed.data.packageWidthCm ?? null, packageLengthCm: parsed.data.packageLengthCm ?? null,
            packageHeightCm: parsed.data.packageHeightCm ?? null, packageWeightKg: parsed.data.packageWeightKg ?? null,
            updatedAt: new Date().toISOString() });
          await audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin',
            action: 'shipping.mipaquete.configuration.updated', entityType: 'shipping_carrier_config',
            entityId: 'default', changes: { ...config } });
          return c.json({ success: true, config });
        } catch {
          return c.json({ error: 'No fue posible guardar la configuración logística' }, 400);
        }
      });
    const authRead = createAuthMiddleware(identity, 'admin', 'shipping:read');
    const authWrite = createAuthMiddleware(identity, 'admin', 'shipping:update');
    app.get('/api/v1/admin/shipping/mipaquete/packages', authRead, async (c) =>
      c.json({ success: true, data: await shipping.listCarrierPackageProfiles() }));
    app.get('/api/v1/admin/shipping/mipaquete/packages/:id', authRead, async (c) => {
      try { return c.json({ success: true, data: await shipping.getCarrierPackageProfile(c.req.param('id')) }); }
      catch { return c.json({ error: 'Tipo de empaque no encontrado' }, 404); }
    });
    app.post('/api/v1/admin/shipping/mipaquete/packages', authWrite, async (c) => {
      const parsed = ProfileInput.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Revisa los datos y pesos del empaque' }, 400);
      try {
        const data = await shipping.createCarrierPackageProfile(parsed.data);
        await audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin', action: 'shipping.package_profile.created', entityType: 'shipping_carrier_package_profile', entityId: data.id, changes: data });
        return c.json({ success: true, data }, 201);
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible crear el empaque' }, 400); }
    });
    app.put('/api/v1/admin/shipping/mipaquete/packages/:id', authWrite, async (c) => {
      const parsed = ProfileInput.omit({ isActive: true }).safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Revisa los datos y pesos del empaque' }, 400);
      try {
        const data = await shipping.updateCarrierPackageProfile(c.req.param('id'), parsed.data);
        await audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin', action: 'shipping.package_profile.updated', entityType: 'shipping_carrier_package_profile', entityId: data.id, changes: data });
        return c.json({ success: true, data });
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible editar el empaque' }, 400); }
    });
    app.patch('/api/v1/admin/shipping/mipaquete/packages/:id/status', authWrite, async (c) => {
      const parsed = z.object({ active: z.boolean() }).strict().safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Estado inválido' }, 400);
      try {
        const data = await shipping.setCarrierPackageProfileActive(c.req.param('id'), parsed.data.active);
        await audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin', action: 'shipping.package_profile.status_changed', entityType: 'shipping_carrier_package_profile', entityId: data.id, changes: { isActive: data.isActive } });
        return c.json({ success: true, data });
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible cambiar el estado' }, 400); }
    });
    app.delete('/api/v1/admin/shipping/mipaquete/packages/:id', authWrite, async (c) => {
      try {
        await shipping.deleteCarrierPackageProfile(c.req.param('id'));
        await audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin', action: 'shipping.package_profile.deleted', entityType: 'shipping_carrier_package_profile', entityId: c.req.param('id'), changes: {} });
        return c.json({ success: true });
      } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No fue posible eliminar el empaque' }, 400); }
    });
    return app;
  }
}
