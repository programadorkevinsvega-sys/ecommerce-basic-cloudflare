import { Hono } from 'hono';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { renderStorefrontBannerRows } from '../../views/admin/renderStorefrontBannerRows.js';
import { renderStorefrontAnnouncementRows } from '../../views/admin/renderStorefrontAnnouncementRows.js';

export class StorefrontAdminController {
  public static createRoutes(storefrontGateway: StorefrontGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Banners CRUD
    router.get('/api/v1/admin/storefront/banners', createAuthMiddleware(identityGateway, 'admin', 'storefront:read'), async (c) => {
      const { page, pageSize } = parsePagination(c.req.query('page'), c.req.query('pageSize'));
      if (!page) return c.json({ error: 'Paginación inválida' }, 400);
      const kind: 'informative' | 'promotional' = c.req.query('type') === 'informative' ? 'informative' : 'promotional';
      const query = (c.req.query('q') || '').trim();
      const placement = (c.req.query('placement') || '').trim();
      const active = c.req.query('active');
      if (query.length > 120 || placement.length > 80 || (active && active !== 'true' && active !== 'false')) return c.json({ error: 'Filtros inválidos' }, 400);
      const filters = { type: kind, query: query || undefined, placement: placement || undefined, isActive: active ? active === 'true' : undefined };
      const result = await storefrontGateway.listAdminBanners(pageSize, (page - 1) * pageSize, filters);
      return c.json({ success: true, data: result.items, rowsHtml: renderStorefrontBannerRows(result.items, kind === 'promotional'), page, pageSize, total: result.total, hasMore: page * pageSize < result.total });
    });

    router.post('/api/v1/admin/storefront/banners', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const banner = await storefrontGateway.createBanner(body);
        return c.json({ data: banner }, 201);
      } catch {
        return c.json({ error: 'No fue posible crear el banner' }, 400);
      }
    });

    router.post('/api/v1/admin/storefront/banners/:id/duplicate', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const source = await storefrontGateway.getBannerById(c.req.param('id'));
        if (!source) return c.json({ error: 'Banner no encontrado' }, 404);
        const copy = await storefrontGateway.createBanner({
          title: `${source.title} (copia)`, description: source.description, bannerType: source.bannerType,
          buttonText: source.buttonText, placement: source.placement, imageUrl: source.imageUrl,
          linkUrl: source.linkUrl, altText: source.altText, isActive: false, sortOrder: source.sortOrder,
        });
        return c.json({ data: copy }, 201);
      } catch { return c.json({ error: 'No se pudo duplicar el banner' }, 400); }
    });

    router.put('/api/v1/admin/storefront/banners/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const banner = await storefrontGateway.updateBanner({ id: c.req.param('id'), ...body });
        return c.json({ data: banner });
      } catch {
        return c.json({ error: 'No fue posible actualizar el banner' }, 400);
      }
    });

    router.delete('/api/v1/admin/storefront/banners/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:delete'), async (c) => {
      try {
        await storefrontGateway.deleteBanner(c.req.param('id'));
        return c.json({ success: true });
      } catch {
        return c.json({ error: 'No fue posible eliminar el banner' }, 400);
      }
    });

    // Anuncios CRUD
    router.get('/api/v1/admin/storefront/announcements', createAuthMiddleware(identityGateway, 'admin', 'storefront:read'), async (c) => {
      const { page, pageSize } = parsePagination(c.req.query('page'), c.req.query('pageSize'));
      if (!page) return c.json({ error: 'Paginación inválida' }, 400);
      const result = await storefrontGateway.listAdminAnnouncements(pageSize, (page - 1) * pageSize);
      return c.json({ success: true, data: result.items, rowsHtml: renderStorefrontAnnouncementRows(result.items), page, pageSize, total: result.total, hasMore: page * pageSize < result.total });
    });

    router.post('/api/v1/admin/storefront/announcements', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const announcement = await storefrontGateway.createAnnouncement(body);
        return c.json({ data: announcement }, 201);
      } catch {
        return c.json({ error: 'No fue posible crear el anuncio' }, 400);
      }
    });

    router.put('/api/v1/admin/storefront/announcements/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const announcement = await storefrontGateway.updateAnnouncement({ id: c.req.param('id'), ...body });
        return c.json({ data: announcement });
      } catch {
        return c.json({ error: 'No fue posible actualizar el anuncio' }, 400);
      }
    });

    router.delete('/api/v1/admin/storefront/announcements/:id', createAuthMiddleware(identityGateway, 'admin', 'storefront:delete'), async (c) => {
      try {
        await storefrontGateway.deleteAnnouncement(c.req.param('id'));
        return c.json({ success: true });
      } catch {
        return c.json({ error: 'No fue posible eliminar el anuncio' }, 400);
      }
    });

    return router;
  }
}

function parsePagination(pageInput?: string, sizeInput?: string): { page: number | null; pageSize: number } {
  const page = Number(pageInput || 1), pageSize = Number(sizeInput || 25);
  return { page: Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 && Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 50 ? page : null, pageSize };
}
