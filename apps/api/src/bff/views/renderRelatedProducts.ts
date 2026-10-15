import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { renderStorefrontProductCard } from './renderStorefrontProductCard.js';
import { renderProductCardActionsScript } from './renderProductCardActionsScript.js';

export function renderRelatedProducts(products: CatalogProductDto[]): string {
  if (!products.length) return '';
  return `<section class="products-section related-products" aria-labelledby="related-products-title"><div class="section-heading"><div><span class="eyebrow">También te puede interesar</span><h2 id="related-products-title">Productos relacionados</h2><p>Selección basada en etiquetas, marca, tipo y categorías compartidas.</p></div><a href="/productos">Ver catálogo <span aria-hidden="true">↗</span></a></div><div class="grid catalog-grid">${products.map((product) => renderStorefrontProductCard(product)).join('')}</div><div id="catalog-cart-feedback" class="catalog-cart-feedback" role="status" aria-live="polite" hidden></div>${renderProductCardActionsScript}</section>`;
}
