import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderProductLandingSpecifications(product: CatalogProductDto): string {
  const entries = Object.entries(product.specifications || {})
    .map(([key, value]) => [key, formatValue(value)] as const)
    .filter(([, value]) => value.length > 0);
  if (!entries.length) return '';
  return `<section class="product-landing-specifications" aria-labelledby="product-landing-specifications-title">
    <div class="product-landing-section-heading"><p class="product-landing-eyebrow">Detalles del producto</p><h2 id="product-landing-specifications-title">Especificaciones técnicas</h2></div>
    <dl>${entries.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
  </section>`;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : JSON.stringify(value) ?? '';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
