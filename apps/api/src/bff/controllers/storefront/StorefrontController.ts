import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SeoGateway } from '../../gateways/seo/SeoGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductList } from '../../views/renderProductList.js';
import { renderCatalogPage } from '../../views/renderCatalogPage.js';
import { renderProductDetail } from '../../views/renderProductDetail.js';
import { renderAuthPage } from '../../views/renderAuthPage.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { ProductSeoHelper } from '../../../modules/catalog/domain/services/ProductSeoHelper.js';
import { StructuredDataHelper } from '../../../modules/catalog/domain/services/StructuredDataHelper.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';
import { resolveProductDiscounts } from './StorefrontDiscountResolver.js';
import { getPageMarketingContent } from './StorefrontPageMarketing.js';

export class StorefrontController {
  public static createRoutes(
    catalogGateway: CatalogGateway,
    identityGateway: IdentityGateway,
    storefrontGateway: StorefrontGateway,
    seoGateway: SeoGateway,
    cmsGateway: CmsGateway,
    promotionsGateway: PromotionsGateway,
    settingsGateway: SettingsGateway
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
      const productsPage = Number(c.req.query('products_page') || 1);
      if (!Number.isSafeInteger(productsPage) || productsPage < 1 || productsPage > 1000) return c.redirect('/#products-title', 302);
      const [productRecords, homeContent, nav, brands, homeAnnouncements] = await Promise.all([
        catalogGateway.listProducts({ limit: 13, offset: (productsPage - 1) * 12, status: 'published' }),
        storefrontGateway.getHomeContent(),
        getStorefrontNavMenus(cmsGateway, settingsGateway),
        catalogGateway.listBrands(),
        storefrontGateway.getPublicAnnouncements('home'),
      ]);

      if (productRecords.length === 0 && productsPage > 1) return c.redirect('/#products-title', 302);
      const products = productRecords.slice(0, 12);
      const discountMap = await resolveProductDiscounts(products, promotionsGateway);
      const activeAnnouncement = homeAnnouncements[0] || homeContent.announcements[0];
      const brandLinks = new Map(brands.map((brand) => [brand.name.trim().toLocaleLowerCase(), `/marcas/${encodeURIComponent(brand.slug)}`]));
      const bodyHtml = renderProductList(products, undefined, homeContent.banners, discountMap, brandLinks, brands, { page: productsPage, hasNext: productRecords.length > 12 });

      const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const webSiteJsonLd = StructuredDataHelper.generateWebSiteSchema(storeUrl, 'Vega Store');
      const orgJsonLd = StructuredDataHelper.generateOrganizationSchema(storeUrl, 'Vega Store');

      const html = renderBaseLayout({
        title: 'Tienda Oficial - Alta Calidad y Confianza',
        description: 'Compra online con envíos locales y nacionales, y opción de pago contra entrega en Colombia.',
        canonicalUrl: productsPage > 1 ? `${storeUrl}/?products_page=${productsPage}` : `${storeUrl}/`,
        jsonLd: `[${webSiteJsonLd}, ${orgJsonLd}]`,
        bodyHtml,
        customerEmail,
        announcementMessage: activeAnnouncement?.message,
        announcementLink: activeAnnouncement?.linkUrl,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      });

      return c.html(html);
    });

    router.get('/productos', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const query = c.req.query('q');
      const page = Number(c.req.query('page') || 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000) return c.redirect('/productos', 302);
      const placement = c.req.query('category') ? 'category' : 'catalog';
      const [productRecords, nav, banners] = await Promise.all([
        catalogGateway.listProducts({ limit: 25, offset: (page - 1) * 24, status: 'published', searchQuery: query }),
        getStorefrontNavMenus(cmsGateway, settingsGateway),
        getPageMarketingContent(storefrontGateway, placement, 'Contenido destacado', placement === 'catalog' ? ['products'] : []),
      ]);

      const products = productRecords.slice(0, 24);
      const discountMap = await resolveProductDiscounts(products, promotionsGateway);
      const pageHref = (targetPage: number) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        const category = c.req.query('category');
        if (category) params.set('category', category);
        params.set('page', String(targetPage));
        return `/productos?${params.toString()}#catalog-product-grid`;
      };
      const bodyHtml = renderCatalogPage(products, query, banners.banners, discountMap, {
        page,
        previousHref: page > 1 ? pageHref(page - 1) : undefined,
        nextHref: productRecords.length > 24 ? pageHref(page + 1) : undefined,
      });

      const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
      const itemListJsonLd = StructuredDataHelper.generateItemListSchema(
        products.map((p, idx) => ({ name: p.name, url: `${storeUrl}/productos/${p.slug}`, position: idx + 1 }))
      );

      const html = renderBaseLayout({
        title: query ? `Búsqueda: ${query}` : 'Catálogo de Productos',
        description: 'Explora nuestra variedad de productos con garantía de satisfacción.',
        canonicalUrl: `${storeUrl}/productos${page > 1 ? `?page=${page}` : ''}`,
        noindex: Boolean(query && query.trim().length > 0),
        jsonLd: itemListJsonLd,
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
        announcementMessage: banners.announcementMessage,
        announcementLink: banners.announcementLink,
      });

      return c.html(html);
    });

    router.get('/productos/:slug', async (c) => {
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const slug = c.req.param('slug');
      const nav = await getStorefrontNavMenus(cmsGateway, settingsGateway);
      try {
        const product = await catalogGateway.getProductBySlug(slug);
        const discount = await promotionsGateway.evaluateProductDiscount({
          productId: product.id,
          priceInCents: product.priceInCents,
        }).catch(() => undefined);

        const marketing = await getPageMarketingContent(storefrontGateway, `product:${product.slug}`, 'Contenido destacado', ['product']);
        const bodyHtml = `${renderProductList([], undefined, marketing.banners)}${renderProductDetail(product, discount)}`;
        const storeUrl = 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev';
        const canonical = product.canonicalUrl || `${storeUrl}/productos/${product.slug}`;

        const productJsonLd = ProductSeoHelper.generateJsonLd({
          name: product.name,
          description: product.description,
          priceInCents: discount?.hasDiscount ? discount.finalPriceCents : product.priceInCents,
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
          footerStoreProfile: nav.footerStoreProfile,
          announcementMessage: marketing.announcementMessage,
          announcementLink: marketing.announcementLink,
        });

        return c.html(html);
      } catch {
        const notFoundHtml = renderBaseLayout({
          title: 'Producto no encontrado',
          description: 'El producto solicitado no existe o fue retirado del catálogo.',
          bodyHtml: renderNotFoundPage(`/productos/${slug}`),
          customerEmail,
          headerMenuItems: nav.headerMenuItems,
          footerMenuItems: nav.footerMenuItems,
          footerStoreProfile: nav.footerStoreProfile,
        });
        return c.html(notFoundHtml, 404);
      }
    });

    router.get('/auth/login', async (c) => {
      const nav = await getStorefrontNavMenus(cmsGateway, settingsGateway);
      const html = renderBaseLayout({
        title: 'Iniciar Sesión',
        description: 'Accede a tu cuenta de cliente en Vega Store.',
        bodyHtml: renderAuthPage(),
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      });
      return c.html(html);
    });

    return router;
  }
}
