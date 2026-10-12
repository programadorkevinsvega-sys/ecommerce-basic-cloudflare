import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';

export interface BannerItem {
  id: string;
  title: string;
  description?: string;
  bannerType?: 'informative' | 'promotional';
  buttonText?: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

export function renderProductList(
  products: CatalogProductDto[],
  searchQuery?: string,
  banner?: BannerItem | BannerItem[],
  discountMap?: Map<string, ProductDiscountDto>
): string {
  const queryVal = searchQuery ? escapeHtml(searchQuery) : '';

  const banners = (Array.isArray(banner) ? banner : banner ? [banner] : []).filter(Boolean);
  const renderBanner = (item: BannerItem, index: number): string => {
    const isInformative = item.bannerType === 'informative';
    const ctaHtml = isInformative
      ? ''
      : `<a class="campaign-action" href="${escapeHtml(item.linkUrl)}">${escapeHtml(item.buttonText || 'Explorar colección')} <span aria-hidden="true">↗</span></a>`;

    return `
    <article class="campaign-banner">
      <div class="campaign-copy">
        <span class="eyebrow">${isInformative ? 'Comunicado' : 'Selección de la tienda'}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.description || (isInformative ? '' : 'Descubre productos elegidos para acompañarte todos los días, con una experiencia de compra sencilla y segura.'))}</p>
        ${ctaHtml}
      </div>
      ${item.imageUrl ? `<div class="campaign-image"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.altText || item.title)}" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.remove();this.parentElement.classList.add(\'campaign-image-missing\')" /></div>` : ''}
    </article>`;
  };
  const bannerHtml = banners.length > 1
    ? `<section class="campaign-carousel" aria-label="Colecciones destacadas" tabindex="0">${banners.map(renderBanner).join('')}</section>`
    : banners.length === 1 && banners[0]
      ? renderBanner(banners[0], 0).replace('<article class="campaign-banner">', '<section class="campaign-banner" aria-label="Colección destacada">').replace('</article>', '</section>')
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

    const availabilityTag = product.stockQuantity > 0
      ? '<span class="product-availability is-available"><span aria-hidden="true">●</span> Disponible</span>'
      : '<span class="product-availability is-unavailable"><span aria-hidden="true">●</span> Agotado</span>';

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
        <div class="card-price-group">
          <span class="card-price card-price-sale">${finalFormatted}</span>
          <span class="card-price-old">${formattedPrice}</span>
        </div>
      `;
      promoBadge = `<span class="tag tag-promo">-${discountInfo.discountPercentage}%</span>`;
    }

    html += `
      <article class="card">
        <a class="product-media" href="/productos/${escapeHtml(product.slug)}" tabindex="-1" aria-hidden="true">
          ${imageHtml}
          ${promoBadge ? `<span class="product-promo">${promoBadge}</span>` : ''}
        </a>
        <div class="card-body">
          <div class="product-meta">${availabilityTag}</div>
          <h2 class="card-title">
            <a href="/productos/${escapeHtml(product.slug)}">${escapeHtml(product.name)}</a>
          </h2>
          <p class="card-desc">${escapeHtml(product.description)}</p>
          ${priceHtml}
          <div class="product-card-footer">
            <span class="product-shipping-note">${product.salePolicy.shippingScope === 'national' ? 'Envíos nacionales' : 'Envío local'} · ${product.salePolicy.allowsCashOnDelivery ? 'Contra entrega disponible' : 'Pago anticipado'}</span>
            <a class="product-action" href="/productos/${escapeHtml(product.slug)}"${product.stockQuantity <= 0 ? ' aria-label="' + escapeHtml(product.name) + ', agotado. Ver detalles"' : ''}>${product.stockQuantity > 0 ? 'Comprar' : 'Ver producto'} <span aria-hidden="true">→</span></a>
          </div>
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
