import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductList } from '../../views/renderProductList.js';
import { renderProductDetail } from '../../views/renderProductDetail.js';
import { renderAuthPage } from '../../views/renderAuthPage.js';

import { SeoGateway } from '../../gateways/seo/SeoGateway.js';
import { ProductSeoHelper } from '../../../modules/catalog/domain/services/ProductSeoHelper.js';
import { StructuredDataHelper } from '../../../modules/catalog/domain/services/StructuredDataHelper.js';

export class StorefrontController {
  public static createRoutes(
    catalogGateway: CatalogGateway,
    identityGateway: IdentityGateway,
    storefrontGateway: StorefrontGateway,
    seoGateway: SeoGateway
  ): Hono {
    const router = new Hono();

    // Redirecciones dinámicas 301 gestionadas por el módulo SEO
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

    // Home / Catálogo inicial SSR con Banners y Anuncios
    router.get('/', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const [products, homeContent] = await Promise.all([
        catalogGateway.listProducts({ limit: 12, status: 'published' }),
        storefrontGateway.getHomeContent(),
      ]);

      const primaryBanner = homeContent.banners[0];
      const activeAnnouncement = homeContent.announcements[0];
      const bodyHtml = renderProductList(products, undefined, primaryBanner);

      const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const webSiteJsonLd = StructuredDataHelper.generateWebSiteSchema(storeUrl, 'Vega Store');
      const orgJsonLd = StructuredDataHelper.generateOrganizationSchema(storeUrl, 'Vega Store');
      const combinedHomeJsonLd = `[${webSiteJsonLd}, ${orgJsonLd}]`;

      const html = renderBaseLayout({
        title: 'Tienda Oficial - Alta Calidad y Confianza',
        description: 'Compra online con envíos locales y nacionales, y opción de pago contra entrega en Colombia.',
        canonicalUrl: `${storeUrl}/`,
        jsonLd: combinedHomeJsonLd,
        bodyHtml,
        customerEmail,
        announcementMessage: activeAnnouncement?.message,
        announcementLink: activeAnnouncement?.linkUrl,
      });

      return c.html(html);
    });

    // Listado y búsqueda SSR (SEO: noindex para búsquedas internas y facetas)
    router.get('/productos', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const query = c.req.query('q');
      const products = await catalogGateway.listProducts({
        limit: 24,
        status: 'published',
        searchQuery: query,
      });
      const bodyHtml = renderProductList(products, query);

      const isSearchOrFiltered = Boolean(query && query.trim().length > 0);
      const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const canonical = `${storeUrl}/productos`;

      const itemListJsonLd = StructuredDataHelper.generateItemListSchema(
        products.map((p, idx) => ({
          name: p.name,
          url: `${storeUrl}/productos/${p.slug}`,
          position: idx + 1,
        }))
      );

      const html = renderBaseLayout({
        title: query ? `Búsqueda: ${query}` : 'Catálogo de Productos',
        description: 'Explora nuestra variedad de productos con garantía de satisfacción.',
        canonicalUrl: canonical,
        noindex: isSearchOrFiltered,
        jsonLd: itemListJsonLd,
        bodyHtml,
        customerEmail,
      });

      return c.html(html);
    });

    // Detalle de producto SSR con metadatos SEO, Product y BreadcrumbList JSON-LD
    router.get('/productos/:slug', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const slug = c.req.param('slug');
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        const bodyHtml = renderProductDetail(product);

        const pageTitle = ProductSeoHelper.resolveTitle(product.seoTitle, product.name);
        const pageDesc = ProductSeoHelper.resolveDescription(product.seoDescription, product.description);
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

        const combinedJsonLd = `[${productJsonLd}, ${breadcrumbsJsonLd}]`;

        const html = renderBaseLayout({
          title: pageTitle,
          description: pageDesc,
          canonicalUrl: canonical,
          noindex: product.noindex,
          jsonLd: combinedJsonLd,
          bodyHtml,
          customerEmail,
        });

        return c.html(html);
      } catch {
        const notFoundHtml = renderBaseLayout({
          title: 'Producto no encontrado',
          description: 'El producto solicitado no existe o fue retirado del catálogo.',
          bodyHtml: '<div style="text-align:center; padding:3rem;"><h2>404 - Producto no encontrado</h2><p><a href="/productos">Regresar a la tienda</a></p></div>',
          customerEmail,
        });
        return c.html(notFoundHtml, 404);
      }
    });

    // Página de login de clientes
    router.get('/auth/login', async (c) => {
      const html = renderBaseLayout({
        title: 'Iniciar Sesión',
        description: 'Accede a tu cuenta de cliente en Vega Store.',
        bodyHtml: renderAuthPage(),
      });
      return c.html(html);
    });

    return router;
  }
}


async function getCustomerEmail(c: { req: { header: (k: string) => string | undefined } }, identityGateway: IdentityGateway): Promise<string | undefined> {
  const cookieHeader = c.req.header('cookie') || '';
  const match = cookieHeader.match(/__Host-session=([^;]+)/);
  if (!match || !match[1]) return undefined;

  try {
    const session = await identityGateway.validateSession(match[1]);
    if (session.actorType === 'customer') {
      const profile = await identityGateway.getCustomerProfile(session.actorId);
      return profile.email;
    }
  } catch {
    // Sesión inválida o expirada, tratar como invitado
  }
  return undefined;
}
