import { BrandDto, CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { renderStorefrontProductCard } from './renderStorefrontProductCard.js';
import { renderProductCardActionsScript } from './renderProductCardActionsScript.js';

export function renderBrandDetailPage(brand: BrandDto, products: CatalogProductDto[], discounts: Map<string, ProductDiscountDto>): string {
  const cards = products.map((product) => renderStorefrontProductCard(product, discounts.get(product.id))).join('');
  return `<main class="brand-detail">
    <nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/marcas">Marcas</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(brand.name)}</span></nav>
    <header class="section-heading"><div><span class="eyebrow">Nuestra marca</span><h1>${escapeHtml(brand.name)}</h1><p>${escapeHtml(brand.description || 'Descubre los productos disponibles de esta marca.')}</p></div></header>
    ${products.length ? `<section class="products-section" aria-labelledby="brand-products-title"><h2 id="brand-products-title">Productos de ${escapeHtml(brand.name)}</h2><div id="catalog-cart-feedback" class="catalog-cart-feedback" role="status" aria-live="polite" hidden></div><div class="grid catalog-grid">${cards}</div></section>${renderProductCardActionsScript}` : '<p>Esta marca aún no tiene productos publicados.</p>'}
  </main>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
