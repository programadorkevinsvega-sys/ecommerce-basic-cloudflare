import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { renderProductShippingWidget } from './renderProductShippingWidget.js';

export function renderProductDetail(product: CatalogProductDto, discount?: ProductDiscountDto): string {
  const formattedPrice = (product.priceInCents / 100).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  });

  let priceHtml = `<div class="detail-price">${formattedPrice}</div>`;
  let effectivePriceCents = product.priceInCents;
  let promoBanner = '';

  if (discount?.hasDiscount) {
    effectivePriceCents = discount.finalPriceCents;
    const finalFormatted = (discount.finalPriceCents / 100).toLocaleString('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    });
    priceHtml = `
      <div style="display:flex; align-items:baseline; gap:0.75rem; margin-bottom:1.5rem;">
        <span class="detail-price" style="color:#dc2626; margin-bottom:0;">${finalFormatted}</span>
        <span style="font-size:1.4rem; text-decoration:line-through; color:var(--muted);">${formattedPrice}</span>
        <span class="tag" style="background:#fee2e2; color:#b91c1c; font-size:1rem; padding:0.3rem 0.6rem; font-weight:700;">-${discount.discountPercentage}% OFF</span>
      </div>
    `;
    promoBanner = `<div style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:0.75rem 1rem; border-radius:6px; margin-bottom:1.5rem; font-weight:600;">🔥 ¡Promoción activa: ${escapeHtml(discount.promotionName || 'Descuento especial')}!</div>`;
  }

  const codText = product.salePolicy.allowsCashOnDelivery
    ? '✅ Disponible pago contra entrega en efectivo al recibir el pedido.'
    : 'ℹ️ Este producto requiere pago en línea anticipado (Wompi).';

  const scopeText = product.salePolicy.shippingScope === 'national'
    ? '🇨🇴 Envío a todo el país disponible (cobertura nacional).'
    : `📍 Envío exclusivo local (zonas: ${product.salePolicy.localCoverageZones.join(', ') || 'Zona metropolitana'}).`;

  const saleModeText = product.salePolicy.saleMode === 'both' ? 'Disponible para compra de contado o a crédito.' : product.salePolicy.saleMode === 'credit' ? 'Venta exclusiva a crédito.' : 'Venta de contado.';
  const conditionText = product.condition === 'refurbished' ? 'Reacondicionado' : product.condition === 'used' ? 'Usado' : 'Nuevo';

  const specsList = Object.entries(product.specifications || {})
    .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</li>`)
    .join('');

  const mediaList = product.mediaIds && product.mediaIds.length > 0 ? product.mediaIds : [];
  const primaryMediaId = mediaList[0] || '';

  const thumbnailsHtml = mediaList.length > 1
    ? `<div class="detail-thumbnails-row" role="tablist" aria-label="Galería de imágenes">
        ${mediaList.map((mId, idx) => `
          <button type="button" class="detail-thumb-btn ${idx === 0 ? 'is-active' : ''}" onclick="selectProductImage('/media/${escapeHtml(mId)}', this)" aria-label="Ver imagen ${idx + 1}">
            <img src="/media/${escapeHtml(mId)}" alt="Miniatura ${idx + 1}" loading="lazy" />
          </button>
        `).join('')}
       </div>`
    : '';

  return `
    <nav class="detail-breadcrumb" aria-label="Navegación de migas de pan">
      <a href="/">Inicio</a> <span class="sep">/</span> <a href="/productos">Catálogo</a> <span class="sep">/</span> <span class="current">${escapeHtml(product.name)}</span>
    </nav>
    <article class="detail-grid-layout">
      <!-- Columna 1: Galería y Media Principal -->
      <div class="detail-gallery-col">
        ${primaryMediaId
          ? `<div class="detail-media-card"><img id="main-product-img" src="/media/${escapeHtml(primaryMediaId)}" alt="${escapeHtml(product.name)}" fetchpriority="high" /></div>`
          : '<div class="detail-media-card detail-media-empty"><div class="media-empty-icon">📦</div><span>Vega Store</span></div>'}
        ${thumbnailsHtml}
        ${specsList ? `<div class="detail-specs-card"><h3>Especificaciones Técnicas</h3><ul class="specs-grid-list">${specsList}</ul></div>` : ''}
      </div>

      <!-- Columna 2: Información Comercial y Compra -->
      <div class="detail-info-col">
        <div class="detail-header-block">
          <div class="detail-brand-sku">
            <span class="brand-name">${escapeHtml(product.brand || 'Vega Store')}</span>
            <span class="sku-tag">SKU: ${escapeHtml(product.sku)}</span>
          </div>
          <h1 class="detail-main-title">${escapeHtml(product.name)}</h1>
          <div class="detail-chips-row">
            <span class="detail-chip">${conditionText}</span>
            <span class="detail-chip ${product.stockQuantity > 0 ? 'chip-stock' : 'chip-out'}">${product.stockQuantity > 0 ? product.stockQuantity + ' en inventario' : 'Agotado'}</span>
            <span class="detail-chip chip-accent">${saleModeText}</span>
          </div>
        </div>

        ${promoBanner ? `<div class="promo-callout">${promoBanner}</div>` : ''}

        <div class="detail-pricing-panel">
          ${priceHtml}
          <div class="detail-payment-note">Precios en pesos colombianos (COP). Impuestos incluidos.</div>
        </div>

        <p class="detail-lead-desc">${escapeHtml(product.description)}</p>

        <!-- Bloque de Compra / Carrito -->
        <div class="detail-purchase-box">
          <div class="purchase-actions-row">
            <div class="qty-field-group">
              <label for="buy-qty">Cantidad</label>
              <input type="number" id="buy-qty" value="1" min="1" max="${Math.max(1, product.stockQuantity)}" />
            </div>
            <button type="button" id="btn-add-cart" class="btn-primary-commerce">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span>Añadir al Carrito</span>
            </button>
          </div>
          <div id="cart-msg" class="cart-feedback-banner" style="display:none;"></div>
        </div>

        <!-- Cobertura y Políticas -->
        <div class="detail-trust-cards">
          <div class="trust-item"><span class="trust-icon">🛡️</span><div><strong>Garantía de Entrega</strong><span>${codText}</span></div></div>
          <div class="trust-item"><span class="trust-icon">🚚</span><div><strong>Cobertura</strong><span>${scopeText}</span></div></div>
        </div>

        ${renderProductShippingWidget(product)}
      </div>

      <script>
        function selectProductImage(url, btn) {
          const mainImg = document.getElementById('main-product-img');
          if (mainImg) {
            mainImg.style.opacity = '0.4';
            setTimeout(() => { mainImg.src = url; mainImg.style.opacity = '1'; }, 120);
          }
          document.querySelectorAll('.detail-thumb-btn').forEach(b => b.classList.remove('is-active'));
          if (btn) btn.classList.add('is-active');
        }

        document.getElementById('btn-add-cart')?.addEventListener('click', async () => {
          const btn = document.getElementById('btn-add-cart');
          const msg = document.getElementById('cart-msg');
          const qty = parseInt(document.getElementById('buy-qty').value, 10) || 1;
          btn.disabled = true;
          btn.innerText = 'Agregando...';
          try {
            const res = await fetch('/api/v1/cart/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: '${product.id}', quantity: qty, unitPriceCents: ${effectivePriceCents} })
            });
            const data = await res.json();
            if (res.ok) {
              msg.style.display = 'block'; msg.style.color = '#15803d';
              msg.innerHTML = '¡Producto agregado al carrito! <a href="/carrito" style="text-decoration:underline; font-weight:bold;">Ver Carrito &rarr;</a>';
              btn.innerText = '¡Añadido!';
              setTimeout(() => { btn.disabled = false; btn.innerText = 'Añadir al Carrito 🛒'; }, 2000);
            } else {
              msg.style.display = 'block'; msg.style.color = '#b91c1c';
              msg.innerText = data.error || 'Error al agregar al carrito';
              btn.disabled = false; btn.innerText = 'Añadir al Carrito 🛒';
            }
          } catch {
            msg.style.display = 'block'; msg.style.color = '#b91c1c';
            msg.innerText = 'Error de conexión';
            btn.disabled = false; btn.innerText = 'Añadir al Carrito 🛒';
          }
        });
      </script>
    </article>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
