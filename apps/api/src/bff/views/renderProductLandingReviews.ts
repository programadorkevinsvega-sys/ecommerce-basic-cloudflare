import { ProductReviewSummaryDto } from '../gateways/reviews/ReviewsGateway.js';
import { ProductLandingConfigDto } from '../gateways/catalog/ProductLandingGateway.js';
import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderProductLandingReviews(config: ProductLandingConfigDto, product: CatalogProductDto, summary: ProductReviewSummaryDto): string {
  if (!config.sections.includes('reviews')) return '';
  const score = summary.count ? `${summary.average.toFixed(1)} de 5 · ${summary.count} ${summary.count === 1 ? 'opinión' : 'opiniones'}` : 'Sé la primera persona en opinar';
  return `<section class="product-landing-reviews" aria-labelledby="product-landing-reviews-title">
    <div><p class="product-landing-eyebrow">Experiencias reales</p><h2 id="product-landing-reviews-title">Opiniones de clientes</h2><p>${escapeHtml(score)}</p></div>
    <a href="/productos/${encodeURIComponent(product.slug)}/opiniones">Leer opiniones <span aria-hidden="true">↗</span></a>
  </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
