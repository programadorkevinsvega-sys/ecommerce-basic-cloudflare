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
      <h1 class="detail-title">${escapeHtml(product.name)}</h1>
      <div class="detail-sku">
        SKU: ${escapeHtml(product.sku)} | Condición: <strong>${conditionText}</strong> | Stock: ${product.stockQuantity} un.
        ${product.brand ? ` | Marca: <strong>${escapeHtml(product.brand)}</strong>` : ''}
        ${product.barcodeGtin ? ` | GTIN: <code>${escapeHtml(product.barcodeGtin)}</code>` : ''}
      </div>
      <div class="detail-price">${formattedPrice}</div>
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
