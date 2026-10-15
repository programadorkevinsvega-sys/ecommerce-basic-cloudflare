import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SeoGateway } from '../../gateways/seo/SeoGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ReviewsGateway } from '../../gateways/reviews/ReviewsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductList } from '../../views/renderProductList.js';
import { renderCatalogPage } from '../../views/renderCatalogPage.js';
import { renderAuthPage } from '../../views/renderAuthPage.js';
import { StructuredDataHelper } from '../../../modules/catalog/domain/services/StructuredDataHelper.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';
import { resolveProductDiscounts } from './StorefrontDiscountResolver.js';
import { getPageMarketingContent } from './StorefrontPageMarketing.js';
import { ProductDetailController } from './ProductDetailController.js';

export class StorefrontController {
  public static createRoutes(
    catalogGateway: CatalogGateway,
    identityGateway: IdentityGateway,
    storefrontGateway: StorefrontGateway,
    seoGateway: SeoGateway,
    cmsGateway: CmsGateway,
    promotionsGateway: PromotionsGateway,
    settingsGateway: SettingsGateway,
    reviewsGateway: ReviewsGateway
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
      const announcementItems = [...new Map([...homeAnnouncements, ...homeContent.announcements].map((item) => [item.id, { message: item.message, linkUrl: item.linkUrl }])).values()];
      const brandLinks = new Map(brands.map((brand) => [brand.name.trim().toLocaleLowerCase(), `/marcas/${encodeURIComponent(brand.slug)}`]));
      const bodyHtml = renderProductList(products, undefined, homeContent.banners, discountMap, brandLinks, brands, { page: productsPage, hasNext: productRecords.length > 12 });

      const storeUrl = 'https://vega.jnmtortas.com';
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
        announcementItems,
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
      const [discountMap, reviewSummaries] = await Promise.all([resolveProductDiscounts(products, promotionsGateway), reviewsGateway.summaries(products.map((product) => product.id)).catch(() => ({}))]);
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
      }, reviewSummaries);

      const storeUrl = 'https://vega.jnmtortas.com';
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
        announcementItems: banners.announcementItems,
      });

      return c.html(html);
    });

    router.route('/', ProductDetailController.createRoutes(catalogGateway, identityGateway, storefrontGateway, cmsGateway, promotionsGateway, settingsGateway, reviewsGateway));

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
