import { Hono, type Context } from 'hono';
import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { ProductLandingGateway } from '../../gateways/catalog/ProductLandingGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CmsGateway, BlogPostDto } from '../../gateways/cms/CmsGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ReviewsGateway } from '../../gateways/reviews/ReviewsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderProductLandingHero } from '../../views/renderProductLandingHero.js';
import { renderProductLandingBenefits } from '../../views/renderProductLandingBenefits.js';
import { renderProductLandingFaq } from '../../views/renderProductLandingFaq.js';
import { renderProductLandingSpecifications } from '../../views/renderProductLandingSpecifications.js';
import { renderProductLandingReviews } from '../../views/renderProductLandingReviews.js';
import { renderProductGuides } from '../../views/renderProductGuides.js';
import { renderRelatedProducts } from '../../views/renderRelatedProducts.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { StructuredDataHelper } from '../../../modules/catalog/domain/services/StructuredDataHelper.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';
import { resolveProductDiscounts } from './StorefrontDiscountResolver.js';

export class ProductLandingController {
  public static createRoutes(catalog: CatalogGateway, landing: ProductLandingGateway, identity: IdentityGateway, cms: CmsGateway, promotions: PromotionsGateway, settings: SettingsGateway, reviews: ReviewsGateway): Hono {
    const router = new Hono();
    router.get('/ofertas/:slug', async (c) => {
      const slug = c.req.param('slug'), customerEmail = await getCustomerEmail(c, identity);
      const nav = await getStorefrontNavMenus(cms, settings);
      let product: CatalogProductDto;
      try {
        product = await catalog.getProductBySlug(slug);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'Producto no encontrado') throw error;
        return notFound(c, slug, customerEmail, nav);
      }
      if (product.status !== 'published') return notFound(c, slug, customerEmail, nav);
      const config = await landing.getProductLandingConfig(product.id);
      if (!config?.enabled) return notFound(c, slug, customerEmail, nav);

      const [related, articles, reviewPage] = await Promise.all([
        config.sections.includes('related') ? catalog.listProducts({ limit: 8, relatedToId: product.id }).catch(() => []) : [],
        config.sections.includes('guides') ? Promise.all((product.relatedBlogPostIds || []).map((id) => cms.getBlogPostById(id).catch(() => null))) : [],
        config.sections.includes('reviews') ? reviews.list(product.id, 1, 1).catch(() => emptyReviewPage()) : Promise.resolve(emptyReviewPage()),
      ]);
      const [discounts, relatedReviews] = await Promise.all([
        resolveProductDiscounts(related, promotions),
        reviews.summaries(related.map((item) => item.id)).catch(() => ({})),
      ]);
      const sections = config.sections;
      const publishedArticles = articles.reduce<BlogPostDto[]>((published, post) => {
        if (post?.status === 'published') published.push(post);
        return published;
      }, []);
      const body = [
        renderProductLandingHero(config, product),
        renderProductLandingBenefits(config),
        sections.includes('specifications') ? renderProductLandingSpecifications(product) : '',
        sections.includes('guides') ? renderProductGuides(product.guideTitle, product.guideContent, publishedArticles) : '',
        renderProductLandingReviews(config, product, reviewPage.summary),
        renderProductLandingFaq(config),
        sections.includes('related') ? renderRelatedProducts(related, discounts, relatedReviews) : '',
      ].join('');
      const canonical = `https://vega.jnmtortas.com/ofertas/${encodeURIComponent(product.slug)}`;
      const breadcrumbs = StructuredDataHelper.generateBreadcrumbList([{ name: 'Inicio', url: 'https://vega.jnmtortas.com/' }, { name: 'Catálogo', url: 'https://vega.jnmtortas.com/productos' }, { name: product.name, url: canonical }]);
      return c.html(renderBaseLayout({
        title: config.seoTitle?.trim() || config.headline.trim() || product.seoTitle || product.name,
        description: config.seoDescription?.trim() || product.seoDescription || config.subtitle || product.description,
        canonicalUrl: canonical, ogImageUrl: product.mediaIds[0] ? `https://vega.jnmtortas.com/media/${encodeURIComponent(product.mediaIds[0])}` : undefined,
        noindex: product.noindex, jsonLd: breadcrumbs, bodyHtml: body, customerEmail,
        headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile,
      }));
    });
    return router;
  }
}

function emptyReviewPage(): Awaited<ReturnType<ReviewsGateway['list']>> {
  return { items: [], total: 0, summary: { average: 0, count: 0, isDemo: false, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } };
}

function notFound(c: Context, slug: string, customerEmail: string | undefined, nav: Awaited<ReturnType<typeof getStorefrontNavMenus>>) {
  return c.html(renderBaseLayout({
    title: 'Landing no encontrada', description: 'La página solicitada no está disponible.',
    canonicalUrl: `https://vega.jnmtortas.com/ofertas/${encodeURIComponent(slug)}`, noindex: true,
    bodyHtml: renderNotFoundPage(`/ofertas/${slug}`), customerEmail,
    headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile,
  }), 404);
}
