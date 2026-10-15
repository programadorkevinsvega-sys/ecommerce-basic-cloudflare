import { CartDto } from '../gateways/cart/CartGateway.js';
import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { getCouponApplicationScript, renderCouponWidget } from './renderCouponWidget.js';

export function renderCartPage(cart: CartDto, productsMap: Map<string, CatalogProductDto>, discounts = new Map<string, ProductDiscountDto>()): string {
  const formatPrice = (cents: number): string => (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const breadcrumb = '<nav class="cart-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Carrito</span></nav>';
  const confirmation = `<dialog id="cart-confirm-dialog" class="cart-confirm-dialog" aria-labelledby="cart-confirm-title" aria-describedby="cart-confirm-description"><h2 id="cart-confirm-title">¿Vaciar el carrito?</h2><p id="cart-confirm-description">Se quitarán todos los productos de tu carrito.</p><div><button type="button" class="cart-danger-button" id="cart-confirm-action">Sí, vaciar</button><button type="button" class="cart-secondary-button" data-close-cart-dialog>Cancelar</button></div></dialog>`;
  if (!cart.items.length) return `${breadcrumb}<section class="cart-empty"><span aria-hidden="true">▢</span><h1>Tu carrito está vacío</h1><p>Aún no has agregado productos. Explora el catálogo y encuentra algo para ti.</p><a class="cart-primary-link" href="/productos">Explorar productos <span aria-hidden="true">→</span></a></section>${renderCartScript()}`;

  const basePriceFor = (productId: string, storedPrice: number) => productsMap.get(productId)?.priceInCents ?? storedPrice;
  const priceFor = (productId: string, basePrice: number) => discounts.get(productId)?.finalPriceCents ?? basePrice;
  const subtotalCents = cart.items.reduce((sum, item) => sum + priceFor(item.productId, basePriceFor(item.productId, item.unitPriceCents)) * item.quantity, 0);
  const couponScriptItems = cart.items.map((item) => ({ productId: item.productId, categoryIds: productsMap.get(item.productId)?.categoryIds ?? [], priceCents: priceFor(item.productId, basePriceFor(item.productId, item.unitPriceCents)) * item.quantity }));
  const products = cart.items.map((item) => {
    const product = productsMap.get(item.productId);
    const discount = discounts.get(item.productId);
    const basePrice = basePriceFor(item.productId, item.unitPriceCents);
    const unitPrice = priceFor(item.productId, basePrice);
    const linePrice = unitPrice * item.quantity;
    const name = product?.name || 'Producto';
    const detailsUrl = product ? `/productos/${encodeURIComponent(product.slug)}` : '/productos';
    const image = product?.mediaIds[0]
      ? `<img src="/media/${escapeHtml(product.mediaIds[0])}" alt="" loading="lazy" onerror="this.hidden=true;this.parentElement.classList.add('has-no-image')" />`
      : '<span aria-hidden="true">▢</span>';
    const promotionPrice = discount?.discountAppliedCents ? `<del>${formatPrice(basePrice)}</del> <strong>${formatPrice(unitPrice)}</strong> <small>−${discount.discountPercentage ?? ''}%</small>` : `${formatPrice(unitPrice)}`;
    const promotionName = discount?.promotionName ? `<small class="cart-promotion-name">${escapeHtml(discount.promotionName)}</small>` : '';
    return `<li class="cart-item" data-cart-item="${escapeHtml(item.productId)}"><a class="cart-item-image" href="${detailsUrl}" aria-label="Ver ${escapeHtml(name)}">${image}</a><div class="cart-item-info"><h2><a href="${detailsUrl}">${escapeHtml(name)}</a></h2><span class="cart-sku">SKU ${escapeHtml(product?.sku || '—')}</span><span class="cart-unit-price"><span class="sr-only">Precio unitario: </span>${promotionPrice} c/u</span>${promotionName}</div><div class="cart-quantity"><span id="quantity-${escapeHtml(item.id)}">Cantidad</span><div><button type="button" data-quantity-change="-1" data-product-id="${escapeHtml(item.productId)}" aria-label="Disminuir cantidad de ${escapeHtml(name)}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button><input type="number" min="1" max="99" step="1" value="${item.quantity}" data-quantity-input data-product-id="${escapeHtml(item.productId)}" aria-labelledby="quantity-${escapeHtml(item.id)}" /><button type="button" data-quantity-change="1" data-product-id="${escapeHtml(item.productId)}" aria-label="Aumentar cantidad de ${escapeHtml(name)}" ${item.quantity >= 99 ? 'disabled' : ''}>+</button></div></div><strong class="cart-line-total"><span class="sr-only">Total del producto: </span>${formatPrice(linePrice)}</strong><button type="button" class="cart-remove-button" data-remove-product="${escapeHtml(item.productId)}" aria-label="Eliminar ${escapeHtml(name)} del carrito"><span aria-hidden="true">×</span></button></li>`;
  }).join('');

  return `${breadcrumb}<header class="cart-page-heading"><div><h1>Tu carrito</h1><p>${cart.totalQuantity} ${cart.totalQuantity === 1 ? 'producto' : 'productos'} en tu carrito</p></div><button type="button" class="cart-empty-button" data-clear-cart>Vaciar carrito</button></header>
    <div id="cart-action-message" class="cart-action-message" role="status" aria-live="polite" hidden></div>
    <div class="cart-layout"><section class="cart-products-panel" aria-labelledby="cart-products-title"><h2 id="cart-products-title">Productos <span>(${cart.items.length})</span></h2><ul class="cart-items">${products}</ul><a class="cart-continue-link" href="/productos"><span aria-hidden="true">←</span> Seguir comprando</a></section>
    <aside class="cart-summary" aria-labelledby="cart-summary-title"><h2 id="cart-summary-title">Resumen del pedido</h2><div class="cart-summary-row"><span>Productos (${cart.totalQuantity})</span><span>${formatPrice(subtotalCents)}</span></div>${renderCouponWidget()}<div class="cart-summary-row cart-coupon-row" id="cart-coupon-row" hidden><span>Descuento de cupón</span><span id="cart-coupon-discount">−${formatPrice(0)}</span></div><div class="cart-summary-row cart-summary-total"><strong>Subtotal</strong><strong id="cart-subtotal-value">${formatPrice(subtotalCents)}</strong></div><p>El envío se calcula en el siguiente paso según tu destino.</p><a class="cart-checkout-link" href="/checkout">Proceder al checkout <span aria-hidden="true">→</span></a><div class="cart-payment-note"><span aria-hidden="true">✓</span><p>Pago en línea seguro. Contra entrega disponible en productos seleccionados.</p></div></aside></div>${confirmation}${renderCartScript(couponScriptItems, subtotalCents)}`;
}

function renderCartScript(couponItems: Array<{ productId: string; categoryIds?: string[]; priceCents: number }> = [], subtotalCents = 0): string {
  return `<script>
    const cartDialog = document.getElementById('cart-confirm-dialog');
    const cartConfirm = document.getElementById('cart-confirm-action');
    let cartPendingAction = null;
    let cartPendingProduct = '';
    function showCartMessage(text) {
      const message = document.getElementById('cart-action-message');
      if (message) { message.hidden = false; message.textContent = text; }
    }
    async function performCartAction(action, productId, quantity) {
      const endpoints = { clear: ['/api/v1/cart/clear', 'POST'], remove: ['/api/v1/cart/items/' + encodeURIComponent(productId), 'DELETE'], quantity: ['/api/v1/cart/items/' + encodeURIComponent(productId), 'PATCH'] };
      const [url, method] = endpoints[action];
      const response = await fetch(url, { method, ...(action === 'quantity' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }) } : {}) });
      if (!response.ok) throw new Error('No se pudo actualizar el carrito. Intenta de nuevo.');
      window.location.reload();
    }
    document.querySelectorAll('[data-quantity-change]').forEach(button => button.addEventListener('click', async () => {
      const row = button.closest('[data-cart-item]'); const input = row?.querySelector('[data-quantity-input]');
      if (!input) return;
      const next = Math.max(1, Math.min(99, Number(input.value) + Number(button.dataset.quantityChange)));
      input.value = String(next);
      try { await performCartAction('quantity', input.dataset.productId, next); } catch (error) { showCartMessage(error.message); }
    }));
    document.querySelectorAll('[data-quantity-input]').forEach(input => input.addEventListener('change', async () => {
      const quantity = Math.max(1, Math.min(99, Math.trunc(Number(input.value) || 1)));
      input.value = String(quantity);
      try { await performCartAction('quantity', input.dataset.productId, quantity); } catch (error) { showCartMessage(error.message); }
    }));
    function openCartConfirmation(action, productId) {
      cartPendingAction = action; cartPendingProduct = productId || '';
      const title = document.getElementById('cart-confirm-title');
      const description = document.getElementById('cart-confirm-description');
      const confirm = document.getElementById('cart-confirm-action');
      const removing = action === 'remove';
      title.textContent = removing ? '¿Quitar este producto?' : '¿Vaciar el carrito?';
      description.textContent = removing ? 'El producto se quitará de tu carrito.' : 'Se quitarán todos los productos de tu carrito.';
      confirm.textContent = removing ? 'Sí, quitar' : 'Sí, vaciar';
      if (cartDialog?.showModal) cartDialog.showModal(); else if (window.confirm(description.textContent)) performCartAction(action, cartPendingProduct).catch(error => showCartMessage(error.message));
    }
    document.querySelector('[data-clear-cart]')?.addEventListener('click', () => openCartConfirmation('clear'));
    document.querySelectorAll('[data-remove-product]').forEach(button => button.addEventListener('click', () => openCartConfirmation('remove', button.dataset.removeProduct)));
    document.querySelectorAll('[data-close-cart-dialog]').forEach(button => button.addEventListener('click', () => cartDialog?.close()));
    cartConfirm?.addEventListener('click', async () => {
      if (!cartPendingAction) return;
      cartConfirm.disabled = true;
      try { await performCartAction(cartPendingAction, cartPendingProduct); } catch (error) { cartDialog?.close(); showCartMessage(error.message); }
      finally { cartConfirm.disabled = false; cartPendingAction = null; }
    });
    cartDialog?.addEventListener('click', event => { if (event.target === cartDialog) cartDialog.close(); });
    document.addEventListener('coupon-validated', event => {
      const detail = event.detail; const amount = Math.min(subtotalCents, Number(detail.discountCents) || 0);
      const row = document.getElementById('cart-coupon-row');
      row.hidden = amount <= 0;
      document.getElementById('cart-coupon-discount').textContent = '−' + new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount / 100);
      document.getElementById('cart-subtotal-value').textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((subtotalCents - amount) / 100);
    });
    ${getCouponApplicationScript(couponItems, subtotalCents)}
  </script>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
