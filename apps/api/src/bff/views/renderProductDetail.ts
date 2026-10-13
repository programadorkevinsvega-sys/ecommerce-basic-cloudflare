import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { renderProductShippingWidget } from './renderProductShippingWidget.js';

export function renderProductDetail(product: CatalogProductDto, discount?: ProductDiscountDto): string {
  const salePrice = discount?.hasDiscount ? discount.finalPriceCents : product.priceInCents;
  const formatPrice = (cents: number): string => (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const condition = product.condition === 'refurbished' ? 'Reacondicionado' : product.condition === 'used' ? 'Usado' : 'Nuevo';
  const saleMode = product.salePolicy.saleMode === 'both' ? 'Contado o crédito' : product.salePolicy.saleMode === 'credit' ? 'Venta a crédito' : 'Venta de contado';
  const stockLabel = product.stockQuantity > 0 ? `${product.stockQuantity} disponibles` : 'Agotado';
  const specifications = Object.entries(product.specifications || {});
  const images = product.mediaIds || [];
  const primaryImage = images[0];
  const breadcrumb = `<nav class="detail-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/productos">Catálogo</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(product.name)}</span></nav>`;
  const gallery = `<section class="detail-gallery" aria-label="Imágenes y especificaciones del producto">
    <div class="detail-main-image">
      <span class="detail-condition">${condition}</span>
      ${primaryImage ? `<img id="main-product-img" src="/media/${escapeHtml(primaryImage)}" alt="${escapeHtml(product.name)}" fetchpriority="high" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><span class="detail-image-empty" hidden>Imagen no disponible</span>` : '<span class="detail-image-empty">Imagen no disponible</span>'}
    </div>
    ${images.length > 1 ? `<div class="detail-thumbnails" role="group" aria-label="Galería de imágenes">${images.map((id, index) => `<button type="button" class="detail-thumb ${index === 0 ? 'is-active' : ''}" data-image-src="/media/${escapeHtml(id)}" aria-label="Ver imagen ${index + 1}" aria-pressed="${index === 0}"><img src="/media/${escapeHtml(id)}" alt="" loading="lazy" /></button>`).join('')}</div>` : ''}
    ${specifications.length ? `<details class="detail-specifications" open><summary><span>Especificaciones técnicas</span><span class="detail-chevron" aria-hidden="true">⌄</span></summary><dl>${specifications.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join('')}</dl></details>` : ''}
  </section>`;
  const discountBadge = discount?.discountPercentage !== undefined ? `−${discount.discountPercentage}%` : 'Descuento';
  const price = `<section class="detail-price-panel" aria-label="Precio"><div class="detail-price-row"><strong class="detail-price"><span class="sr-only">Precio actual: </span>${formatPrice(salePrice)}</strong>${discount?.hasDiscount ? `<span class="detail-price-old"><span class="sr-only">Precio anterior: </span>${formatPrice(product.priceInCents)}</span><span class="detail-discount">${discountBadge}</span>` : ''}</div>${discount?.hasDiscount ? `<p class="detail-saving">Ahorras ${formatPrice(Math.max(0, product.priceInCents - salePrice))}${discount.promotionName ? ` · ${escapeHtml(discount.promotionName)}` : ''}</p>` : ''}<p class="detail-currency">Precios en pesos colombianos (COP). Impuestos incluidos.</p></section>`;
  const codTitle = product.salePolicy.allowsCashOnDelivery ? 'Pago contra entrega' : 'Pago en línea';
  const codDescription = product.salePolicy.allowsCashOnDelivery ? 'Disponible para este producto.' : 'Este producto requiere pago anticipado.';
  const shippingTitle = product.salePolicy.shippingScope === 'national' ? 'Cobertura nacional' : 'Cobertura local';
  const shippingDescription = product.salePolicy.shippingScope === 'national' ? 'Consulta disponibilidad y tarifa para tu destino.' : `Zonas: ${product.salePolicy.localCoverageZones.join(', ') || 'Consulta cobertura para tu destino.'}`;
  const brandHtml = product.brand ? `<a href="/productos?q=${encodeURIComponent(product.brand)}">${escapeHtml(product.brand)}</a>` : '<span class="detail-store-name">Vega Store</span>';
  const productId = JSON.stringify(product.id).replace(/</g, '\\u003c');

  return `${breadcrumb}<article class="detail-layout"><div class="detail-gallery-col">${gallery}</div><div class="detail-info-col">
    <header class="detail-product-heading"><div class="detail-brand-sku">${brandHtml}<span>SKU ${escapeHtml(product.sku)}</span></div>
      <h1>${escapeHtml(product.name)}</h1><div class="detail-product-meta"><span class="stock-dot ${product.stockQuantity > 0 ? 'is-available' : ''}" aria-hidden="true"></span><span>${stockLabel}</span><span aria-hidden="true">·</span><span>${escapeHtml(saleMode)}</span></div>
    </header>
    ${price}<p class="detail-description">${escapeHtml(product.description)}</p>
    <section class="detail-purchase" aria-label="Añadir producto al carrito"><div class="detail-quantity"><span id="quantity-label">Cantidad</span><div><button type="button" data-quantity-change="-1" aria-label="Disminuir cantidad" ${product.stockQuantity < 1 ? 'disabled' : ''}>−</button><input id="buy-qty" type="number" value="1" min="1" max="${Math.max(1, product.stockQuantity)}" step="1" aria-labelledby="quantity-label" ${product.stockQuantity < 1 ? 'disabled' : ''} /><button type="button" data-quantity-change="1" aria-label="Aumentar cantidad" ${product.stockQuantity < 1 ? 'disabled' : ''}>+</button></div></div>
      <button type="button" id="btn-add-cart" class="detail-add-button" ${product.stockQuantity < 1 ? 'disabled' : ''}><span aria-hidden="true">＋</span>Añadir al carrito · <span id="detail-total">${formatPrice(salePrice)}</span></button></section>
    <div id="cart-msg" class="detail-cart-message" role="status" aria-live="polite" hidden></div>
    <ul class="detail-trust-list"><li><span aria-hidden="true">◉</span><div><strong>${codTitle}</strong><p>${codDescription}</p></div></li><li><span aria-hidden="true">↗</span><div><strong>${shippingTitle}</strong><p>${escapeHtml(shippingDescription)}</p></div></li></ul>
    ${renderProductShippingWidget(product)}
  </div></article>
  <script>
    const detailPriceCents = ${salePrice};
    const detailProductId = ${productId};
    const quantity = document.getElementById('buy-qty');
    const total = document.getElementById('detail-total');
    const addButton = document.getElementById('btn-add-cart');
    const formatDetailPrice = cents => (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    function refreshDetailQuantity() {
      if (!quantity || !total) return;
      const min = Number(quantity.min) || 1;
      const max = Number(quantity.max) || 1;
      quantity.value = String(Math.min(max, Math.max(min, Math.trunc(Number(quantity.value) || min))));
      total.textContent = formatDetailPrice(detailPriceCents * Number(quantity.value));
      document.querySelectorAll('[data-quantity-change]').forEach(button => { button.disabled = Number(quantity.value) <= min && button.dataset.quantityChange === '-1' || Number(quantity.value) >= max && button.dataset.quantityChange === '1'; });
    }
    quantity?.addEventListener('input', refreshDetailQuantity);
    document.querySelectorAll('[data-quantity-change]').forEach(button => button.addEventListener('click', () => { if (quantity) quantity.value = String(Number(quantity.value) + Number(button.dataset.quantityChange)); refreshDetailQuantity(); }));
    document.querySelectorAll('.detail-thumb').forEach(button => button.addEventListener('click', () => {
      const image = document.getElementById('main-product-img');
      if (image) image.src = button.dataset.imageSrc;
      document.querySelectorAll('.detail-thumb').forEach(item => { item.classList.remove('is-active'); item.setAttribute('aria-pressed', 'false'); });
      button.classList.add('is-active'); button.setAttribute('aria-pressed', 'true');
    }));
    addButton?.addEventListener('click', async () => {
      const message = document.getElementById('cart-msg');
      if (!quantity || !message) return;
      addButton.disabled = true; addButton.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch('/api/v1/cart/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: detailProductId, quantity: Number(quantity.value), unitPriceCents: detailPriceCents }) });
        const result = await response.json();
        message.hidden = false; message.textContent = response.ok ? 'Producto agregado al carrito.' : result.error || 'No se pudo agregar al carrito.';
        if (response.ok) message.insertAdjacentHTML('beforeend', ' <a href="/carrito">Ver carrito</a>');
      } catch { message.hidden = false; message.textContent = 'Error de conexión al agregar el producto.'; }
      finally { addButton.disabled = ${product.stockQuantity < 1}; addButton.removeAttribute('aria-busy'); }
    });
    refreshDetailQuantity();
  </script>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
