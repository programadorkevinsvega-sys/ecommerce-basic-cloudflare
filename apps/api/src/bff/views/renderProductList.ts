import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

export function renderProductList(
  products: CatalogProductDto[],
  searchQuery?: string,
  banner?: BannerItem,
  discountMap?: Map<string, ProductDiscountDto>
): string {
  const queryVal = searchQuery ? escapeHtml(searchQuery) : '';

  const bannerHtml = banner
    ? `<section class="campaign-banner" aria-label="Campaña destacada">
        <div class="campaign-copy">
          <span class="eyebrow">Selección de la tienda</span>
          <h2>${escapeHtml(banner.title)}</h2>
          <p>Descubre productos elegidos para acompañarte todos los días, con una experiencia de compra sencilla y segura.</p>
          <a class="campaign-action" href="${escapeHtml(banner.linkUrl)}">Explorar colección <span aria-hidden="true">↗</span></a>
        </div>
        ${banner.imageUrl ? `<div class="campaign-image"><img src="${escapeHtml(banner.imageUrl)}" alt="${escapeHtml(banner.altText || banner.title)}" loading="eager" /></div>` : ''}
      </section>`
    : '';

  let html = `
    ${bannerHtml}
    <section class="collection-hero">
      <div class="collection-copy">
        <span class="eyebrow">${searchQuery ? 'Resultados de búsqueda' : 'Diseñado para tu día a día'}</span>
        <h1>${searchQuery ? 'Encuentra lo que buscas.' : 'Menos ruido.\nMejores elecciones.'}</h1>
        <p>${searchQuery ? 'Explora los resultados y encuentra justo lo que necesitas.' : 'Una selección cuidada de productos útiles, con precios claros y una compra que se siente fácil desde el primer clic.'}</p>
      </div>
      <div class="collection-note" aria-hidden="true"><span class="note-mark">V.</span><span>Compra con intención<br /><strong>Vive mejor lo cotidiano.</strong></span></div>
    </section>
    <form class="search-bar" action="/productos" method="GET" role="search" aria-label="Buscar productos">
      <label class="search-label" for="store-search">Buscar</label>
      <input id="store-search" type="search" name="q" placeholder="¿Qué estás buscando hoy?" value="${queryVal}" required />
      <button type="submit">Buscar <span aria-hidden="true">↗</span></button>
      ${searchQuery ? '<a href="/productos" class="clear-search">Limpiar</a>' : ''}
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

    const imageHtml = product.mediaIds?.[0]
      ? `<img src="/media/${escapeHtml(product.mediaIds[0])}" alt="${escapeHtml(product.name)}" loading="lazy" />`
      : '<div class="product-media-placeholder" aria-hidden="true">Vega Store</div>';

    const discountInfo = discountMap?.get(product.id);
    let priceHtml = `<div class="card-price">${formattedPrice}</div>`;
    let promoBadge = '';

    if (discountInfo?.hasDiscount) {
      const finalFormatted = (discountInfo.finalPriceCents / 100).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      });
      priceHtml = `
        <div style="display:flex; align-items:baseline; gap:0.5rem; margin-bottom:0.75rem;">
          <span style="font-size:1.3rem; font-weight:700; color:#dc2626;">${finalFormatted}</span>
          <span style="font-size:0.95rem; text-decoration:line-through; color:var(--muted);">${formattedPrice}</span>
        </div>
      `;
      promoBadge = `<span class="tag" style="background:#fee2e2; color:#b91c1c; font-weight:700;">-${discountInfo.discountPercentage}% OFF</span>`;
    }

    html += `
      <article class="card">
        <a class="product-media" href="/productos/${escapeHtml(product.slug)}" tabindex="-1" aria-hidden="true">${imageHtml}</a>
        <div class="card-body">
          <div style="margin-bottom: 0.5rem;">${promoBadge} ${codTag} ${scopeTag}</div>
          <h2 class="card-title">
            <a href="/productos/${escapeHtml(product.slug)}">${escapeHtml(product.name)}</a>
          </h2>
          <p class="card-desc">${escapeHtml(product.description)}</p>
          ${priceHtml}
          <a class="product-action" href="/productos/${escapeHtml(product.slug)}">Ver producto <span aria-hidden="true">↗</span></a>
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
