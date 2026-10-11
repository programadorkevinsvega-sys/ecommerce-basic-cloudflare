import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderProductDetail(product: CatalogProductDto): string {
  const formattedPrice = (product.priceInCents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

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

  return `
    <div style="margin-bottom: 1rem;">
      <a href="/productos" style="color: var(--accent); text-decoration: none; font-weight: 600;">← Volver al catálogo</a>
    </div>
    <article class="detail-view">
      <h1 class="detail-title">${escapeHtml(product.name)}</h1>
      <div class="detail-sku">SKU: ${escapeHtml(product.sku)} | Disponibilidad: ${product.stockQuantity} unidades</div>
      <div class="detail-price">${formattedPrice}</div>
      <p style="font-size: 1.05rem; color: var(--text); margin-bottom: 2rem;">${escapeHtml(product.description)}</p>

      <div class="detail-policy">
        <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Políticas Comerciales y Envío</h3>
        <p>${codText}</p>
        <p>${scopeText}</p>
        <p>💳 Modalidad: ${saleModeText}</p>
      </div>

      <div style="margin-top: 2rem; display: flex; gap: 1rem;">
        <button type="button" style="flex:1; padding: 1rem; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 700; cursor: pointer;">
          Añadir al Carrito
        </button>
      </div>
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
