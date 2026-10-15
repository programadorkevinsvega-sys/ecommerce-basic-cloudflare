import { Hono } from 'hono';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

let lastLocationSyncAttempt = 0;

export class ShippingController {
  public static createRoutes(shippingGateway: ShippingGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    router.get('/api/v1/shipping/carrier/availability', async (c) => {
      c.header('Cache-Control', 'no-store');
      return c.json({ enabled: await shippingGateway.getCarrierAvailability() });
    });

    // Buscar municipios / departamentos (Público)
    router.get('/api/v1/shipping/locations', async (c) => {
      const q = c.req.query('q') || '';
      if (q.length > 100) return c.json({ error: 'Búsqueda demasiado larga' }, 400);
      if (!q) await syncCarrierLocationsIfNeeded(shippingGateway);
      const requestedLimit = Number(c.req.query('limit')) || 25;
      const limit = Math.min(25, Math.max(1, Number.isSafeInteger(requestedLimit) ? requestedLimit : 25));
      const locations = q ? await shippingGateway.searchLocations(q, limit) : await shippingGateway.listLocations({ limit, offset: 0 });
      return c.json({ data: locations });
    });

    router.get('/api/v1/admin/shipping/locations', createAuthMiddleware(identityGateway, 'admin', 'shipping:read'), async (c) => {
      const page = Number(c.req.query('page') || '1');
      const search = (c.req.query('q') || '').trim();
      if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000 || search.length > 100) {
        return c.json({ error: 'Parámetros de paginación o búsqueda inválidos' }, 400);
      }
      if (!search && page === 1) await syncCarrierLocationsIfNeeded(shippingGateway);
      const pageSize = 10;
      const [data, total, zones] = await Promise.all([
        shippingGateway.listLocations({ limit: pageSize, offset: (page - 1) * pageSize, search }),
        shippingGateway.countLocations(search),
        shippingGateway.listZones(),
      ]);
      return c.json({ success: true, page, pageSize, total, hasMore: page * pageSize < total, data, zones });
    });

    // Evaluar cobertura, tarifa y contra entrega (Público / Storefront / Checkout)
    router.get('/api/v1/shipping/coverage', async (c) => {
      const daneCode = c.req.query('daneCode');
      if (!daneCode) {
        return c.json({ error: 'daneCode es requerido' }, 400);
      }

      const shippingScope = c.req.query('shippingScope') as 'national' | 'local' | undefined;
      const allowedZoneIdsStr = c.req.query('allowedZoneIds');
      const zoneId = c.req.query('zoneId');
      const allowedZoneIds = zoneId ? [zoneId] : allowedZoneIdsStr ? allowedZoneIdsStr.split(',').map((s) => s.trim()) : undefined;

      const coverage = await shippingGateway.checkCoverage(daneCode, shippingScope, allowedZoneIds);
      return c.json({ data: coverage });
    });

    // ADMIN: Listar zonas de envío
    router.get(
      '/api/v1/admin/shipping/zones',
      createAuthMiddleware(identityGateway, 'admin', 'shipping:read'),
      async (c) => {
        const zones = (await shippingGateway.listZones()).filter((zone) => zone.type !== 'national');
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
          if (body?.type === 'national') return c.json({ error: 'La cobertura nacional la gestiona la transportadora; configura solo zonas locales.' }, 400);
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
          if (body?.type === 'national') return c.json({ error: 'La cobertura nacional la gestiona la transportadora; configura solo zonas locales.' }, 400);
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

async function syncCarrierLocationsIfNeeded(gateway: ShippingGateway): Promise<void> {
  const now = Date.now();
  if (now - lastLocationSyncAttempt < 5 * 60_000) return;
  lastLocationSyncAttempt = now;
  await gateway.syncCarrierLocations().catch(() => undefined);
}
