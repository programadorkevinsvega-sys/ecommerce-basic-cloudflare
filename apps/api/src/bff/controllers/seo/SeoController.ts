import { Hono } from 'hono';
import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { SeoGateway } from '../../gateways/seo/SeoGateway.js';

export class SeoController {
  public static createRoutes(seoGateway: SeoGateway, catalogGateway: CatalogGateway): Hono {
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

    // sitemap.xml
    router.get('/sitemap.xml', async (c) => {
      const baseUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const products = await catalogGateway.listProducts({ limit: 1000, status: 'published' });

      // Filtrar productos con noindex activo
      const indexableProducts = products.filter((p: CatalogProductDto) => !p.noindex);

      interface SitemapItem {
        loc: string;
        priority: string;
        changefreq: string;
        lastmod?: string;
      }

      const staticUrls: SitemapItem[] = [
        { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
        { loc: `${baseUrl}/productos`, priority: '0.9', changefreq: 'daily' },
      ];

      const productUrls: SitemapItem[] = indexableProducts.map((p: CatalogProductDto) => ({
        loc: `${baseUrl}/productos/${p.slug}`,
        lastmod: (p.updatedAt || p.createdAt).split('T')[0],
        priority: '0.8',
        changefreq: 'weekly',
      }));

      const allUrls = [...staticUrls, ...productUrls];

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...allUrls.map((u) => {
          return [
            '  <url>',
            `    <loc>${u.loc}</loc>`,
            u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : '',
            `    <changefreq>${u.changefreq}</changefreq>`,
            `    <priority>${u.priority}</priority>`,
            '  </url>',
          ].filter(Boolean).join('\n');
        }),
        '</urlset>',
      ].join('\n');

      return c.text(xml, 200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
    });

    // Endpoint de gestión de redirecciones (Admin)
    router.post('/api/v1/admin/seo/redirects', async (c) => {
      try {
        const body = await c.req.json();
        const redirect = await seoGateway.createRedirect(body);
        return c.json({ data: redirect }, 201);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al registrar redirección';
        return c.json({ error: msg }, 400);
      }
    });

    return router;
  }
}
