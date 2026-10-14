import { Context, Hono } from 'hono';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCmsPage } from '../../views/renderCmsPage.js';
import { CMS_INSTITUTIONAL_PAGE_ROUTES } from '../../cms/CmsInstitutionalPageRoutes.js';
import { getStorefrontNavMenus } from '../storefront/StorefrontNavigationHelper.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { getPageMarketingContent } from '../storefront/StorefrontPageMarketing.js';

export class CmsController {
  public static createRoutes(cmsGateway: CmsGateway, identityGateway: IdentityGateway, settingsGateway: SettingsGateway, storefront: StorefrontGateway): Hono {
    const router = new Hono();

    const showPublishedPage = async (c: Context, slug: string, requestedPath: string) => {
      const { headerMenuItems, footerMenuItems, footerStoreProfile } = await getStorefrontNavMenus(cmsGateway, settingsGateway);

      try {
        const page = await cmsGateway.getPageBySlug(slug);
        if (page.status !== 'published') throw new Error('Página no publicada');
        const rendered = renderCmsPage(page);
        const marketing = await getPageMarketingContent(storefront, `cms:${slug}`, 'Contenido destacado');
        const canonical = `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev${requestedPath}`;

        const html = renderBaseLayout({
          title: rendered.title,
          description: rendered.description,
          canonicalUrl: canonical,
          bodyHtml: marketing.bannersHtml + rendered.bodyHtml,
          announcementMessage: marketing.announcementMessage,
          announcementLink: marketing.announcementLink,
          headerMenuItems,
          footerMenuItems,
          footerStoreProfile,
        });

        return c.html(html);
      } catch {
        const notFoundHtml = renderBaseLayout({
          title: 'Página no encontrada',
          description: 'El contenido solicitado no existe.',
          bodyHtml: '<div style="text-align:center; padding:4rem;"><h2>404 - Página no encontrada</h2><p><a href="/">Volver al inicio</a></p></div>',
          headerMenuItems,
          footerMenuItems,
          footerStoreProfile,
        });
        return c.html(notFoundHtml, 404);
      }
    };

    // Las rutas limpias son canónicas. /p/:slug se conserva para enlaces históricos.
    for (const route of CMS_INSTITUTIONAL_PAGE_ROUTES) {
      router.get(route.path, (c) => showPublishedPage(c, route.slug, route.path));
    }
    router.get('/p/:slug', (c) => {
      const slug = c.req.param('slug');
      const route = CMS_INSTITUTIONAL_PAGE_ROUTES.find((item) => item.slug === slug);
      return showPublishedPage(c, slug, route?.path ?? `/p/${slug}`);
    });

    // Menús anidados públicos por código (ej. header, footer)
    router.get('/api/v1/menus/:code', async (c) => {
      const code = c.req.param('code');
      try {
        const menu = await cmsGateway.getMenuByCode(code);
        return c.json({ data: menu });
      } catch {
        return c.json({ error: 'Menú no encontrado' }, 404);
      }
    });

    // Creación de páginas (Admin)
    router.post(
      '/api/v1/admin/cms/pages',
      createAuthMiddleware(identityGateway, 'admin', 'cms:create'),
      async (c) => {
        try {
          const body = await c.req.json();
          const page = await cmsGateway.createPage(body);
          return c.json({ data: page }, 201);
        } catch {
          return c.json({ error: 'No fue posible crear la página' }, 400);
        }
      }
    );

    // Actualización de versión y bloques (Admin)
    router.put(
      '/api/v1/admin/cms/pages/:id',
      createAuthMiddleware(identityGateway, 'admin', 'cms:update'),
      async (c) => {
        try {
          const id = c.req.param('id');
          const body = await c.req.json();
          const page = await cmsGateway.updatePageContent({ ...body, id });
          return c.json({ data: page });
        } catch {
          return c.json({ error: 'No fue posible actualizar la página' }, 400);
        }
      }
    );

    // Listar páginas (Admin)
    router.get(
      '/api/v1/admin/cms/pages',
      createAuthMiddleware(identityGateway, 'admin', 'cms:read'),
      async (c) => {
        try {
          const pages = await cmsGateway.listPages(50, 0);
          return c.json({ data: pages });
        } catch {
          return c.json({ error: 'No fue posible consultar las páginas' }, 500);
        }
      }
    );

    // Eliminar página (Admin)
    router.delete(
      '/api/v1/admin/cms/pages/:id',
      createAuthMiddleware(identityGateway, 'admin', 'cms:delete'),
      async (c) => {
        try {
          const id = c.req.param('id');
          await cmsGateway.deletePage(id);
          return c.json({ success: true, message: 'Página eliminada con éxito' });
        } catch {
          return c.json({ error: 'No fue posible eliminar la página' }, 400);
        }
      }
    );

    return router;
  }
}
