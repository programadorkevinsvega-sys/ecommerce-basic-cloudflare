import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { renderProductShippingWidget } from './renderProductShippingWidget.js';

export function renderProductDetail(product: CatalogProductDto, discount?: ProductDiscountDto): string {
  const formattedPrice = (product.priceInCents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  let priceHtml = `<div class="detail-price">${formattedPrice}</div>`;
  let effectivePriceCents = product.priceInCents;
  let promoBanner = '';

  if (discount?.hasDiscount) {
    effectivePriceCents = discount.finalPriceCents;
    const finalFormatted = (discount.finalPriceCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
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

  const saleModeText = product.salePolicy.saleMode === 'both'
    ? 'Disponible para compra de contado o a crédito.'
    : product.salePolicy.saleMode === 'credit'
    ? 'Venta exclusiva a crédito.'
    : 'Venta de contado.';

  const conditionText = product.condition === 'refurbished' ? 'Reacondicionado' : product.condition === 'used' ? 'Usado' : 'Nuevo';

  const specsList = Object.entries(product.specifications || {})
    .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</li>`)
    .join('');

  return `
    <nav aria-label="Breadcrumb" style="margin-bottom: 1rem; font-size: 0.875rem; color: var(--muted);">
      <a href="/" style="color: var(--accent); text-decoration: none;">Inicio</a> &gt;
      <a href="/productos" style="color: var(--accent); text-decoration: none;">Catálogo</a> &gt;
      <span>${escapeHtml(product.name)}</span>
    </nav>
    <article class="detail-view">
      ${product.mediaIds?.[0] ? `<div class="detail-media"><img src="/media/${escapeHtml(product.mediaIds[0])}" alt="${escapeHtml(product.name)}" fetchpriority="high" /></div>` : '<div class="detail-media detail-media-empty" aria-hidden="true">Vega Store</div>'}
      ${promoBanner}
      <h1 class="detail-title">${escapeHtml(product.name)}</h1>
      <div class="detail-sku">
        SKU: ${escapeHtml(product.sku)} | Condición: <strong>${conditionText}</strong> | Stock: ${product.stockQuantity} un.
        ${product.brand ? ` | Marca: <strong>${escapeHtml(product.brand)}</strong>` : ''}
        ${product.barcodeGtin ? ` | GTIN: <code>${escapeHtml(product.barcodeGtin)}</code>` : ''}
      </div>
      ${priceHtml}
      <p style="font-size: 1.05rem; color: var(--text); margin-bottom: 1.5rem;">${escapeHtml(product.description)}</p>

      ${specsList ? `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg); border-radius: 6px;">
          <h3 style="font-size: 1.05rem; margin-bottom: 0.5rem;">Especificaciones Técnicas</h3>
          <ul style="padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.6;">${specsList}</ul>
        </div>
      ` : ''}

      <div class="detail-policy">
        <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Políticas Comerciales y Envío</h3>
        <p>${codText}</p>
        <p>${scopeText}</p>
        <p>💳 Modalidad: ${saleModeText}</p>
      </div>

      ${renderProductShippingWidget(product)}

      <div style="margin-top: 2rem; display: flex; gap: 1rem; align-items: center;">
        <label class="quantity-control"><span>Cantidad</span><input type="number" id="buy-qty" aria-label="Cantidad de ${escapeHtml(product.name)}" value="1" min="1" max="${Math.max(1, product.stockQuantity)}" style="width: 70px; padding: 0.8rem; border: 1px solid var(--border); border-radius: 6px; font-size: 1.1rem; text-align: center;">
        <button type="button" id="btn-add-cart" style="flex:1; padding: 1rem; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 700; cursor: pointer;">
          Añadir al Carrito 🛒
        </button>
      </div>
      <div id="cart-msg" style="margin-top: 0.75rem; font-weight: 600; display: none;"></div>

      <script>
        document.getElementById('btn-add-cart').addEventListener('click', async () => {
          const btn = document.getElementById('btn-add-cart');
          const msg = document.getElementById('cart-msg');
          const qty = parseInt(document.getElementById('buy-qty').value, 10) || 1;
          btn.disabled = true;
          btn.innerText = 'Agregando...';
          try {
            const res = await fetch('/api/v1/cart/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: '${product.id}',
                quantity: qty,
                unitPriceCents: ${effectivePriceCents}
              })
            });
            const data = await res.json();
            if (res.ok) {
              msg.style.display = 'block';
              msg.style.color = '#15803d';
              msg.innerHTML = '¡Producto agregado al carrito! <a href="/carrito" style="text-decoration:underline; font-weight:bold;">Ver Carrito &rarr;</a>';
              btn.innerText = '¡Añadido!';
              setTimeout(() => { btn.disabled = false; btn.innerText = 'Añadir al Carrito 🛒'; }, 2000);
            } else {
              msg.style.display = 'block';
              msg.style.color = '#b91c1c';
              msg.innerText = data.error || 'Error al agregar al carrito';
              btn.disabled = false;
              btn.innerText = 'Añadir al Carrito 🛒';
            }
          } catch (e) {
            msg.style.display = 'block';
            msg.style.color = '#b91c1c';
            msg.innerText = 'Error de conexión';
            btn.disabled = false;
            btn.innerText = 'Añadir al Carrito 🛒';
          }
        });
      </script>
    </article>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
