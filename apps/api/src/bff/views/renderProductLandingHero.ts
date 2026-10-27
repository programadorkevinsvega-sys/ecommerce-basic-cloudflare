import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductLandingConfigDto } from '../gateways/catalog/ProductLandingGateway.js';

export function renderProductLandingHero(config: ProductLandingConfigDto, product: CatalogProductDto): string {
  if (!config.enabled || config.templateKey === 'standard') return '';
  const theme = config.templateKey === 'launch' ? 'launch' : 'conversion';
  const headline = config.headline.trim() || product.name;
  const subtitle = config.subtitle.trim() || product.description;
  const imageId = product.mediaIds[0];
  const image = imageId
    ? `<img src="/media/${escapeHtml(imageId)}" alt="${escapeHtml(product.name)}" fetchpriority="high" />`
    : '<div class="product-landing-hero-placeholder" aria-hidden="true">Producto destacado</div>';
  const benefits = config.sections.includes('benefits') && config.benefits.length
    ? `<ul class="product-landing-benefits">${config.benefits.map((benefit) => `<li><strong>${escapeHtml(benefit.title)}</strong><span>${escapeHtml(benefit.description)}</span></li>`).join('')}</ul>`
    : '';
  return `
    <section class="product-landing-hero product-landing-hero--${theme}" aria-labelledby="product-landing-headline">
      <div class="product-landing-hero-copy">
        ${config.eyebrow.trim() ? `<p class="product-landing-eyebrow">${escapeHtml(config.eyebrow)}</p>` : ''}
        <h1 id="product-landing-headline">${escapeHtml(headline)}</h1>
        <p class="product-landing-subtitle">${escapeHtml(subtitle)}</p>
        ${benefits}
        <a class="product-landing-cta" href="#detail-purchase">${escapeHtml(config.ctaLabel || 'Comprar ahora')} <span aria-hidden="true">↓</span></a>
      </div>
      <div class="product-landing-hero-media">${image}</div>
    </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
