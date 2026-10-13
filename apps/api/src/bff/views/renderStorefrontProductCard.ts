import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';

export function renderStorefrontProductCard(product: CatalogProductDto, discount?: ProductDiscountDto): string {
  const price = discount?.hasDiscount ? discount.finalPriceCents : product.priceInCents;
  const formatPrice = (cents: number): string => (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const priceHtml = discount?.hasDiscount
    ? `<div class="card-price-group"><span class="card-price-sale">${formatPrice(price)}</span><span class="card-price-old">${formatPrice(product.priceInCents)}</span></div>`
    : `<div class="card-price">${formatPrice(price)}</div>`;
  const badge = discount?.hasDiscount ? `<span class="card-discount-badge">${discount.discountPercentage === undefined ? 'Oferta' : `−${discount.discountPercentage}%`}</span>` : '';
  const image = product.mediaIds[0]
    ? `<img src="/media/${escapeHtml(product.mediaIds[0])}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'product-media-placeholder',textContent:'Imagen no disponible'}))" />`
    : '<span class="product-media-placeholder">Imagen no disponible</span>';
  const brand = product.brand || 'Vega Store';
  const stock = product.stockQuantity > 0 ? `${product.stockQuantity} disponibles` : 'Sin stock';
  const shipping = product.salePolicy.shippingScope === 'national' ? 'Envío nacional' : 'Envío local';

  return `<article class="card product-card-v2" data-catalog-product data-name="${escapeHtml(product.name)}" data-brand="${escapeHtml(product.brand || '')}" data-price="${price}" data-cod="${product.salePolicy.allowsCashOnDelivery}">
    <a class="product-media" href="/productos/${escapeHtml(product.slug)}" aria-label="${escapeHtml(product.name)}">${image}${badge}</a>
    <div class="card-body"><div class="card-eyebrow"><span class="card-brand">${escapeHtml(brand)}</span><span class="card-sku">${escapeHtml(product.sku)}</span></div>
      <h2 class="card-title"><a href="/productos/${escapeHtml(product.slug)}">${escapeHtml(product.name)}</a></h2>
      <div class="card-pricing-block">${priceHtml}<span class="card-stock-indicator ${product.stockQuantity <= 5 && product.stockQuantity > 0 ? 'stock-low' : ''}">${stock}</span></div>
      <div class="product-card-footer"><div class="card-shipping-bullet"><span class="bullet-dot"></span><span>${shipping} · ${product.salePolicy.allowsCashOnDelivery ? 'Contra entrega' : 'Pago online'}</span></div>
        <div class="card-actions-group">${product.stockQuantity > 0 ? `<button type="button" class="btn-action-cart" data-add-to-cart data-product-id="${escapeHtml(product.id)}" data-price-cents="${price}"><span aria-hidden="true">＋</span><span>Añadir</span></button>` : ''}<a class="btn-action-view" href="/productos/${escapeHtml(product.slug)}">Detalles</a></div>
      </div>
    </div>
  </article>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
