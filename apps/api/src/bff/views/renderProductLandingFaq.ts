import { ProductLandingConfigDto } from '../gateways/catalog/ProductLandingGateway.js';

export function renderProductLandingFaq(config: ProductLandingConfigDto): string {
  if (!config.enabled || !config.sections.includes('faq') || !config.faqs.length) return '';
  const items = config.faqs.map((item) => `
    <details class="product-landing-faq-item">
      <summary>${escapeHtml(item.question)}<span aria-hidden="true">＋</span></summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>`).join('');
  return `
    <section class="product-landing-faq" aria-labelledby="product-landing-faq-title">
      <div class="product-landing-section-heading"><p class="product-landing-eyebrow">Resolvemos tus dudas</p><h2 id="product-landing-faq-title">Preguntas frecuentes</h2></div>
      <div class="product-landing-faq-list">${items}</div>
    </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
