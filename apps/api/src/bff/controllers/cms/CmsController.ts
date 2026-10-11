import { Hono } from 'hono';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCmsBlocks } from '../../views/renderCmsBlocks.js';

export class CmsController {
  public static createRoutes(cmsGateway: CmsGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // Visualización pública SSR de páginas institucionales /p/:slug
    router.get('/p/:slug', async (c) => {
      const slug = c.req.param('slug');
      const [headerMenu, footerMenu] = await Promise.all([
        cmsGateway.getMenuByCode('header').catch(() => null),
        cmsGateway.getMenuByCode('footer').catch(() => null),
      ]);
      const headerMenuItems = headerMenu?.items?.map((it) => ({ title: it.title, url: it.url, target: it.target }));
      const footerMenuItems = footerMenu?.items?.map((it) => ({ title: it.title, url: it.url, target: it.target }));

      try {
        const page = await cmsGateway.getPageBySlug(slug);
        const blocksHtml = renderCmsBlocks(page.blocks);

        const bodyHtml = `
          <div style="max-width: 800px; margin: 0 auto; padding: 2rem 0;">
            <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--muted);">
              <a href="/" style="color: var(--accent); text-decoration: none;">Inicio</a> &gt;
              <span>${escapeHtml(page.title)}</span>
            </nav>
            <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--primary);">${escapeHtml(page.title)}</h1>
            <div class="cms-page-content">${blocksHtml}</div>
          </div>
        `;

        const canonical = `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/p/${page.slug}`;

        const html = renderBaseLayout({
          title: page.seoTitle || page.title,
          description: page.seoDescription || `Página oficial de ${page.title} en Vega Store.`,
          canonicalUrl: canonical,
          bodyHtml,
          headerMenuItems,
          footerMenuItems,
        });

        return c.html(html);
      } catch {
        const notFoundHtml = renderBaseLayout({
          title: 'Página no encontrada',
          description: 'El contenido solicitado no existe.',
          bodyHtml: '<div style="text-align:center; padding:4rem;"><h2>404 - Página no encontrada</h2><p><a href="/">Volver al inicio</a></p></div>',
          headerMenuItems,
          footerMenuItems,
        });
        return c.html(notFoundHtml, 404);
      }
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
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al crear página';
          return c.json({ error: msg }, 400);
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
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al actualizar página';
          return c.json({ error: msg }, 400);
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
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al listar páginas';
          return c.json({ error: msg }, 500);
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
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al eliminar página';
          return c.json({ error: msg }, 400);
        }
      }
    );

    return router;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
