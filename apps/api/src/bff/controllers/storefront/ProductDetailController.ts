import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ReviewsGateway } from '../../gateways/reviews/ReviewsGateway.js';
import { ProductLandingGateway } from '../../gateways/catalog/ProductLandingGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductList } from '../../views/renderProductList.js';
import { renderProductDetail } from '../../views/renderProductDetail.js';
import { renderProductGuides } from '../../views/renderProductGuides.js';
import { renderRelatedProducts } from '../../views/renderRelatedProducts.js';
import { renderProductLandingHero } from '../../views/renderProductLandingHero.js';
import { renderProductLandingFaq } from '../../views/renderProductLandingFaq.js';
import { renderProductLandingBenefits } from '../../views/renderProductLandingBenefits.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { ProductSeoHelper } from '../../../modules/catalog/domain/services/ProductSeoHelper.js';
import { StructuredDataHelper } from '../../../modules/catalog/domain/services/StructuredDataHelper.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';
import { getPageMarketingContent } from './StorefrontPageMarketing.js';
import { resolveProductDiscounts } from './StorefrontDiscountResolver.js';

export class ProductDetailController {
  public static createRoutes(catalog: CatalogGateway, landing: ProductLandingGateway, identity: IdentityGateway, storefront: StorefrontGateway, cms: CmsGateway, promotions: PromotionsGateway, settings: SettingsGateway, reviews: ReviewsGateway): Hono {
    const router = new Hono();
    router.get('/productos/:slug', async (c) => {
      const customerEmail = await getCustomerEmail(c, identity), slug = c.req.param('slug');
      const nav = await getStorefrontNavMenus(cms, settings);
      try {
        const product = await catalog.getProductBySlug(slug);
        const [related, articles, discount, reviewPage, savedLanding] = await Promise.all([
          catalog.listProducts({ limit: 8, relatedToId: product.id }).catch(() => []),
          Promise.all((product.relatedBlogPostIds || []).map((id) => cms.getBlogPostById(id).catch(() => null))),
          promotions.evaluateProductDiscount({ productId: product.id, categoryIds: product.categoryIds, priceInCents: product.priceInCents }).catch(() => undefined),
          reviews.list(product.id, 1, 1).catch(() => ({ items: [], total: 0, summary: { average: 0, count: 0, isDemo: false, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } })),
          landing.getProductLandingConfig(product.id).catch(() => null),
        ]);
        const [relatedDiscounts, relatedReviews] = await Promise.all([resolveProductDiscounts(related, promotions), reviews.summaries(related.map((item) => item.id)).catch(() => ({}))]);
        const marketing = await getPageMarketingContent(storefront, `product:${product.slug}`, 'Contenido destacado', ['product']);
        const publishedArticles = articles.filter((post): post is NonNullable<typeof post> => post?.status === 'published');
        const activeLanding = savedLanding?.enabled ? savedLanding : null;
        const landingHero = activeLanding ? renderProductLandingHero(activeLanding, product) : '';
        const detailOptions = activeLanding ? { introHtml: landingHero || undefined, sections: activeLanding.sections } : {};
        const detailHtml = renderProductDetail(product, discount, { ...reviewPage.summary, demoCount: reviewPage.total }, detailOptions);
        const benefitsHtml = activeLanding?.templateKey === 'standard' ? renderProductLandingBenefits(activeLanding) : '';
        const guidesHtml = !activeLanding || activeLanding.sections.includes('guides')
          ? renderProductGuides(product.guideTitle, product.guideContent, publishedArticles) : '';
        const faqHtml = activeLanding ? renderProductLandingFaq(activeLanding) : '';
        const relatedHtml = !activeLanding || activeLanding.sections.includes('related')
          ? renderRelatedProducts(related, relatedDiscounts, relatedReviews) : '';
        const body = `${renderProductList([], undefined, marketing.banners)}${detailHtml}${benefitsHtml}${guidesHtml}${faqHtml}${relatedHtml}`;
        const storeUrl = 'https://vega.jnmtortas.com', canonical = product.canonicalUrl || `${storeUrl}/productos/${product.slug}`;
        const productJsonLd = ProductSeoHelper.generateJsonLd({name:product.name,description:product.description,priceInCents:discount?.hasDiscount?discount.finalPriceCents:product.priceInCents,sku:product.sku,brand:product.brand,stockQuantity:product.stockQuantity,condition:product.condition,url:canonical,imageUrl:product.mediaIds?.[0]?`/media/${product.mediaIds[0]}`:undefined,ratingValue:reviewPage.summary.isDemo?0:reviewPage.summary.average,reviewCount:reviewPage.summary.isDemo?0:reviewPage.summary.count});
        const breadcrumbs = StructuredDataHelper.generateBreadcrumbList([{name:'Inicio',url:`${storeUrl}/`},{name:'Catálogo',url:`${storeUrl}/productos`},{name:product.name,url:canonical}]);
        const seoTitle = activeLanding?.seoTitle?.trim() || product.seoTitle;
        const seoDescription = activeLanding?.seoDescription?.trim() || product.seoDescription;
        const ogImageUrl = activeLanding && product.mediaIds[0]
          ? `${storeUrl}/media/${encodeURIComponent(product.mediaIds[0])}` : undefined;
        return c.html(renderBaseLayout({ title: ProductSeoHelper.resolveTitle(seoTitle, product.name),
          description: ProductSeoHelper.resolveDescription(seoDescription, product.description), canonicalUrl: canonical,
          ogImageUrl, ogType: 'product', noindex: product.noindex, jsonLd: `[${productJsonLd}, ${breadcrumbs}]`, bodyHtml: body,
          customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems,
          footerStoreProfile: nav.footerStoreProfile, announcementMessage: marketing.announcementMessage,
          announcementLink: marketing.announcementLink, announcementItems: marketing.announcementItems }));
      } catch {
        return c.html(renderBaseLayout({title:'Producto no encontrado',description:'El producto solicitado no existe o fue retirado del catálogo.',bodyHtml:renderNotFoundPage(`/productos/${slug}`),customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile}),404);
      }
    });
    return router;
  }
}
