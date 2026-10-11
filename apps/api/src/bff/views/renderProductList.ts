import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderProductList(products: CatalogProductDto[], searchQuery?: string): string {
  const queryVal = searchQuery ? escapeHtml(searchQuery) : '';

  let html = `
    <div style="margin-bottom: 2rem;">
      <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem;">Nuestra Colección</h1>
      <p style="color: var(--muted);">Prendas y productos de alta calidad con envíos asegurados a nivel nacional y local.</p>
    </div>
    <form class="search-bar" action="/productos" method="GET">
      <input type="text" name="q" placeholder="Buscar por nombre, SKU o descripción..." value="${queryVal}" required />
      <button type="submit">Buscar</button>
      ${searchQuery ? '<a href="/productos" style="padding: 0.75rem 1rem; background:#cbd5e1; color:#1e293b; text-decoration:none; border-radius:6px; font-weight:600;">Limpiar</a>' : ''}
    </form>
  `;

  if (products.length === 0) {
    html += `
      <div style="background: #fff; padding: 3rem; text-align: center; border-radius: 8px; border: 1px solid var(--border);">
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No se encontraron productos</h3>
        <p style="color: var(--muted);">Intenta buscando con otro término o consulta nuestro catálogo completo.</p>
      </div>
    `;
    return html;
  }

  html += '<div class="grid">';
  for (const product of products) {
    const formattedPrice = (product.priceInCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

    const codTag = product.salePolicy.allowsCashOnDelivery
      ? '<span class="tag tag-cod">Contra Entrega Sí</span>'
      : '<span class="tag" style="background:#fee2e2; color:#b91c1c;">Pago Anticipado</span>';

    const scopeTag = product.salePolicy.shippingScope === 'national'
      ? '<span class="tag tag-scope">Envío Nacional</span>'
      : '<span class="tag tag-scope" style="background:#fef3c7; color:#b45309;">Envío Local</span>';

    html += `
      <article class="card">
        <div class="card-body">
          <div style="margin-bottom: 0.5rem;">${codTag} ${scopeTag}</div>
          <h2 class="card-title">
            <a href="/productos/${escapeHtml(product.slug)}">${escapeHtml(product.name)}</a>
          </h2>
          <p class="card-desc">${escapeHtml(product.description)}</p>
          <div class="card-price">${formattedPrice}</div>
          <a href="/productos/${escapeHtml(product.slug)}" style="display:block; text-align:center; padding:0.6rem; background:var(--primary); color:#fff; text-decoration:none; border-radius:6px; font-weight:600; font-size:0.9rem;">Ver Producto</a>
        </div>
      </article>
    `;
  }
  html += '</div>';

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
