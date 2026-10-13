import { Hono } from 'hono';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class ShippingController {
  public static createRoutes(shippingGateway: ShippingGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Buscar municipios / departamentos (Público)
    router.get('/api/v1/shipping/locations', async (c) => {
      const q = c.req.query('q') || '';
      const limit = Number(c.req.query('limit')) || 25;
      const locations = await shippingGateway.searchLocations(q, limit);
      return c.json({ data: locations });
    });

    // Evaluar cobertura, tarifa y contra entrega (Público / Storefront / Checkout)
    router.get('/api/v1/shipping/coverage', async (c) => {
      const daneCode = c.req.query('daneCode');
      if (!daneCode) {
        return c.json({ error: 'daneCode es requerido' }, 400);
      }

      const shippingScope = c.req.query('shippingScope') as 'national' | 'local' | undefined;
      const allowedZoneIdsStr = c.req.query('allowedZoneIds');
      const allowedZoneIds = allowedZoneIdsStr ? allowedZoneIdsStr.split(',').map((s) => s.trim()) : undefined;

      const coverage = await shippingGateway.checkCoverage(daneCode, shippingScope, allowedZoneIds);
      return c.json({ data: coverage });
    });

    // ADMIN: Listar zonas de envío
    router.get(
      '/api/v1/admin/shipping/zones',
      createAuthMiddleware(identityGateway, 'admin', 'shipping:read'),
      async (c) => {
        const zones = await shippingGateway.listZones();
        return c.json({ data: zones });
      }
    );

    // ADMIN: Crear zona de envío
    router.post(
      '/api/v1/admin/shipping/zones',
      createAuthMiddleware(identityGateway, 'admin', 'shipping:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const zone = await shippingGateway.createZone(body);
          return c.json({ data: zone }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear la zona' }, 400);
        }
      }
    );

    // ADMIN: Actualizar zona de envío
    router.put(
      '/api/v1/admin/shipping/zones/:id',
      createAuthMiddleware(identityGateway, 'admin', 'shipping:update'),
      async (c) => {
        try {
          const id = c.req.param('id');
          const body = await c.req.json();
          const zone = await shippingGateway.updateZone({ ...body, id });
          return c.json({ data: zone });
        } catch {
          return c.json({ error: 'No fue posible actualizar la zona' }, 400);
        }
      }
    );

    // ADMIN: Activar / Desactivar zona de envío
    router.patch(
      '/api/v1/admin/shipping/zones/:id/toggle',
      createAuthMiddleware(identityGateway, 'admin', 'shipping:update'),
      async (c) => {
        try {
          const id = c.req.param('id');
          const zone = await shippingGateway.toggleZone(id);
          return c.json({ data: zone });
        } catch {
          return c.json({ error: 'No fue posible actualizar el estado de la zona' }, 400);
        }
      }
    );

    // ADMIN: Eliminar zona de envío
    router.delete(
      '/api/v1/admin/shipping/zones/:id',
      createAuthMiddleware(identityGateway, 'admin', 'shipping:delete'),
      async (c) => {
        try {
          const id = c.req.param('id');
          await shippingGateway.deleteZone(id);
          return c.json({ success: true });
        } catch {
          return c.json({ error: 'No fue posible eliminar la zona' }, 400);
        }
      }
    );

    return router;
  }
}
