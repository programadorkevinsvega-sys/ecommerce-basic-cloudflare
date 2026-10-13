import { Hono } from 'hono';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class StorefrontAdminController {
  public static createRoutes(storefrontGateway: StorefrontGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Banners CRUD
    router.get('/api/v1/admin/storefront/banners', createAuthMiddleware(identityGateway, 'admin', 'storefront:read'), async (c) => {
      const banners = await storefrontGateway.listBanners();
      return c.json({ data: banners });
    });

    router.post('/api/v1/admin/storefront/banners', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const banner = await storefrontGateway.createBanner(body);
        return c.json({ data: banner }, 201);
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : 'Error al crear banner' }, 400);
      }
    });

    router.put('/api/v1/admin/storefront/banners/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const banner = await storefrontGateway.updateBanner({ id: c.req.param('id'), ...body });
        return c.json({ data: banner });
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : 'Error al actualizar banner' }, 400);
      }
    });

    router.delete('/api/v1/admin/storefront/banners/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:delete'), async (c) => {
      try {
        await storefrontGateway.deleteBanner(c.req.param('id'));
        return c.json({ success: true });
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : 'Error al eliminar banner' }, 400);
      }
    });

    // Anuncios CRUD
    router.get('/api/v1/admin/storefront/announcements', createAuthMiddleware(identityGateway, 'admin', 'storefront:read'), async (c) => {
      const announcements = await storefrontGateway.listAnnouncements();
      return c.json({ data: announcements });
    });

    router.post('/api/v1/admin/storefront/announcements', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const announcement = await storefrontGateway.createAnnouncement(body);
        return c.json({ data: announcement }, 201);
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : 'Error al crear anuncio' }, 400);
      }
    });

    router.put('/api/v1/admin/storefront/announcements/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const announcement = await storefrontGateway.updateAnnouncement({ id: c.req.param('id'), ...body });
        return c.json({ data: announcement });
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : 'Error al actualizar anuncio' }, 400);
      }
    });

    router.delete('/api/v1/admin/storefront/announcements/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:delete'), async (c) => {
      try {
        await storefrontGateway.deleteAnnouncement(c.req.param('id'));
        return c.json({ success: true });
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : 'Error al eliminar anuncio' }, 400);
      }
    });

    return router;
  }
}
