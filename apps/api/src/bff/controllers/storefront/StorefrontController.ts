import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SeoGateway } from '../../gateways/seo/SeoGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductList } from '../../views/renderProductList.js';
import { renderProductDetail } from '../../views/renderProductDetail.js';
import { renderAuthPage } from '../../views/renderAuthPage.js';
import { ProductSeoHelper } from '../../../modules/catalog/domain/services/ProductSeoHelper.js';
import { StructuredDataHelper } from '../../../modules/catalog/domain/services/StructuredDataHelper.js';
import { getCustomerEmail, getStorefrontNavMenus } from './storefrontHelpers.js';

export class StorefrontController {
  public static createRoutes(
    catalogGateway: CatalogGateway,
    identityGateway: IdentityGateway,
    storefrontGateway: StorefrontGateway,
    seoGateway: SeoGateway,
    cmsGateway: CmsGateway
  ): Hono {
    const router = new Hono();

    router.use('*', async (c, next) => {
      const path = c.req.path;
      if (!path.startsWith('/api/') && !path.startsWith('/admin')) {
        const redirect = await seoGateway.resolveRedirect(path);
        if (redirect) {
          return c.redirect(redirect.toPath, redirect.statusCode as 301 | 302);
        }
      }
      return next();
    });

    router.get('/home', (c) => c.redirect('/', 301));

    router.get('/', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const [products, homeContent, nav] = await Promise.all([
        catalogGateway.listProducts({ limit: 12, status: 'published' }),
        storefrontGateway.getHomeContent(),
        getStorefrontNavMenus(cmsGateway),
      ]);

      const primaryBanner = homeContent.banners[0];
      const activeAnnouncement = homeContent.announcements[0];
      const bodyHtml = renderProductList(products, undefined, primaryBanner);

      const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const webSiteJsonLd = StructuredDataHelper.generateWebSiteSchema(storeUrl, 'Vega Store');
      const orgJsonLd = StructuredDataHelper.generateOrganizationSchema(storeUrl, 'Vega Store');

      const html = renderBaseLayout({
        title: 'Tienda Oficial - Alta Calidad y Confianza',
        description: 'Compra online con envíos locales y nacionales, y opción de pago contra entrega en Colombia.',
        canonicalUrl: `${storeUrl}/`,
        jsonLd: `[${webSiteJsonLd}, ${orgJsonLd}]`,
        bodyHtml,
        customerEmail,
        announcementMessage: activeAnnouncement?.message,
        announcementLink: activeAnnouncement?.linkUrl,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
      });

      return c.html(html);
    });

    router.get('/productos', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const query = c.req.query('q');
      const [products, nav] = await Promise.all([
        catalogGateway.listProducts({ limit: 24, status: 'published', searchQuery: query }),
        getStorefrontNavMenus(cmsGateway),
      ]);
      const bodyHtml = renderProductList(products, query);

      const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const itemListJsonLd = StructuredDataHelper.generateItemListSchema(
        products.map((p, idx) => ({ name: p.name, url: `${storeUrl}/productos/${p.slug}`, position: idx + 1 }))
      );

      const html = renderBaseLayout({
        title: query ? `Búsqueda: ${query}` : 'Catálogo de Productos',
        description: 'Explora nuestra variedad de productos con garantía de satisfacción.',
        canonicalUrl: `${storeUrl}/productos`,
        noindex: Boolean(query && query.trim().length > 0),
        jsonLd: itemListJsonLd,
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
      });

      return c.html(html);
    });

    router.get('/productos/:slug', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const slug = c.req.param('slug');
      const nav = await getStorefrontNavMenus(cmsGateway);
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        const bodyHtml = renderProductDetail(product);
        const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
        const canonical = product.canonicalUrl || `${storeUrl}/productos/${product.slug}`;

        const productJsonLd = ProductSeoHelper.generateJsonLd({
          name: product.name,
          description: product.description,
          priceInCents: product.priceInCents,
          sku: product.sku,
          brand: product.brand,
          stockQuantity: product.stockQuantity,
          condition: product.condition,
          url: canonical,
          imageUrl: product.mediaIds?.[0] ? `/media/${product.mediaIds[0]}` : undefined,
        });

        const breadcrumbsJsonLd = StructuredDataHelper.generateBreadcrumbList([
          { name: 'Inicio', url: `${storeUrl}/` },
          { name: 'Catálogo', url: `${storeUrl}/productos` },
          { name: product.name, url: canonical },
        ]);

        const html = renderBaseLayout({
          title: ProductSeoHelper.resolveTitle(product.seoTitle, product.name),
          description: ProductSeoHelper.resolveDescription(product.seoDescription, product.description),
          canonicalUrl: canonical,
          noindex: product.noindex,
          jsonLd: `[${productJsonLd}, ${breadcrumbsJsonLd}]`,
          bodyHtml,
          customerEmail,
          headerMenuItems: nav.headerMenuItems,
          footerMenuItems: nav.footerMenuItems,
        });

        return c.html(html);
      } catch {
        const notFoundHtml = renderBaseLayout({
          title: 'Producto no encontrado',
          description: 'El producto solicitado no existe o fue retirado del catálogo.',
          bodyHtml: '<div style="text-align:center; padding:3rem;"><h2>404 - Producto no encontrado</h2><p><a href="/productos">Regresar a la tienda</a></p></div>',
          customerEmail,
          headerMenuItems: nav.headerMenuItems,
          footerMenuItems: nav.footerMenuItems,
        });
        return c.html(notFoundHtml, 404);
      }
    });

    router.get('/auth/login', async (c) => {
      const nav = await getStorefrontNavMenus(cmsGateway);
      const html = renderBaseLayout({
        title: 'Iniciar Sesión',
        description: 'Accede a tu cuenta de cliente en Vega Store.',
        bodyHtml: renderAuthPage(),
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
      });
      return c.html(html);
    });

    return router;
  }
}
