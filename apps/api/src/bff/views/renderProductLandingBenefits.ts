import { ProductLandingConfigDto } from '../gateways/catalog/ProductLandingGateway.js';

export function renderProductLandingBenefits(config: ProductLandingConfigDto): string {
  if (!config.enabled || config.templateKey !== 'standard' || !config.sections.includes('benefits') || !config.benefits.length) return '';
  const benefits = config.benefits.map((benefit) => `
    <article class="product-landing-standard-benefit">
      <h3>${escapeHtml(benefit.title)}</h3><p>${escapeHtml(benefit.description)}</p>
    </article>`).join('');
  return `
    <section class="product-landing-standard-benefits" aria-labelledby="product-landing-benefits-title">
      <div class="product-landing-section-heading"><p class="product-landing-eyebrow">Lo que lo hace especial</p><h2 id="product-landing-benefits-title">Beneficios destacados</h2></div>
      <div class="product-landing-standard-benefits-grid">${benefits}</div>
    </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
