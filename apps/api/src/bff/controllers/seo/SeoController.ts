import { Hono } from 'hono';
import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { SeoGateway } from '../../gateways/seo/SeoGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class SeoController {
  public static createRoutes(seoGateway: SeoGateway, catalogGateway: CatalogGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // robots.txt
    router.get('/robots.txt', (c) => {
      const robots = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/',
        '',
        'Sitemap: https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/sitemap.xml',
      ].join('\n');

      return c.text(robots, 200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      });
    });

    // sitemap.xml principal (Sitemap Index)
    router.get('/sitemap.xml', (c) => {
      const baseUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const today = new Date().toISOString().split('T')[0];

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <sitemap>',
        `    <loc>${baseUrl}/sitemap-pages.xml</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '  </sitemap>',
        '  <sitemap>',
        `    <loc>${baseUrl}/sitemap-products.xml</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '  </sitemap>',
        '  <sitemap>',
        `    <loc>${baseUrl}/sitemap-blog.xml</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '  </sitemap>',
        '</sitemapindex>',
      ].join('\n');

      return c.text(xml, 200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      });
    });

    // sitemap-pages.xml (Páginas estáticas y colecciones)
    router.get('/sitemap-pages.xml', async (c) => {
      const baseUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const today = new Date().toISOString().split('T')[0];
      const collections = await catalogGateway.listCollections({ limit: 1000, offset: 0 });

      const staticUrls = [
        { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
        { loc: `${baseUrl}/productos`, priority: '0.9', changefreq: 'daily' },
        ...collections.map((collection) => ({ loc: `${baseUrl}/colecciones/${encodeURIComponent(collection.slug)}`, priority: '0.7', changefreq: 'weekly' })),
      ];

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...staticUrls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`),
        '</urlset>',
      ].join('\n');

      return c.text(xml, 200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      });
    });

    // sitemap-products.xml (Productos publicados e indexables)
    router.get('/sitemap-products.xml', async (c) => {
      const baseUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const products = await catalogGateway.listProducts({ limit: 1000, status: 'published' });
      const indexableProducts = products.filter((p: CatalogProductDto) => !p.noindex);

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...indexableProducts.map((p: CatalogProductDto) => {
          const lastmod = (p.updatedAt || p.createdAt).split('T')[0];
          return `  <url>\n    <loc>${baseUrl}/productos/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
        }),
        '</urlset>',
      ].join('\n');

      return c.text(xml, 200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
    });

    // Endpoint de gestión de redirecciones (Admin)
    router.post('/api/v1/admin/seo/redirects', createAuthMiddleware(identityGateway, 'admin', 'seo:edit'), async (c) => {
      try {
        const body = await c.req.json();
        const redirect = await seoGateway.createRedirect(body);
        return c.json({ data: redirect }, 201);
      } catch {
        return c.json({ error: 'No fue posible registrar la redirección' }, 400);
      }
    });

    return router;
  }
}
