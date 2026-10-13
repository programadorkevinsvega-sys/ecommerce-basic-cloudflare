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
    const ctaHtml = isInformative ? '' : `<a class="campaign-action" href="${escapeHtml(item.linkUrl)}">${escapeHtml(item.buttonText || 'Explorar colección')} <span aria-hidden="true">↗</span></a>`;
    return `
    <article class="campaign-banner" role="group" aria-roledescription="diapositiva" aria-label="${index + 1} de ${banners.length}">
      <div class="campaign-copy">
        <span class="eyebrow">${isInformative ? 'Comunicado' : 'Selección de la tienda'}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.description || (isInformative ? '' : 'Descubre productos elegidos para acompañarte todos los días.'))}</p>
        ${ctaHtml}
      </div>
      ${item.imageUrl ? `<div class="campaign-image"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.altText || item.title)}" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.remove();this.parentElement.classList.add('campaign-image-missing')" /></div>` : ''}
    </article>`;
  };

  const bannerHtml = banners.length > 1
    ? `<div class="campaign-carousel-wrap"><section id="heroCarousel" class="campaign-carousel" role="region" aria-roledescription="carrusel" aria-label="Colecciones destacadas" aria-live="polite" tabindex="0">${banners.map(renderBanner).join('')}</section><div class="campaign-carousel-controls" role="group" aria-label="Controles del carrusel"><button type="button" data-carousel-direction="-1" aria-controls="heroCarousel">Anterior</button><button type="button" data-carousel-direction="1" aria-controls="heroCarousel">Siguiente</button></div></div>`
    : banners.length === 1 && banners[0]
      ? renderBanner(banners[0], 0).replace('<article class="campaign-banner" role="group" aria-roledescription="diapositiva" aria-label="1 de 1">', '<section class="campaign-banner" aria-label="Colección destacada">').replace('</article>', '</section>')
      : products.length
        ? `<section class="campaign-banner fallback-banner" aria-label="Bienvenido a Vega Store"><div class="campaign-copy"><span class="eyebrow">Selección de la tienda</span><h2>Encuentra algo para tu día</h2><p>Explora productos disponibles y descubre cada detalle antes de elegir.</p><a class="campaign-action" href="/productos">Explorar catálogo <span aria-hidden="true">↗</span></a></div>${products[0]?.mediaIds?.[0] ? `<div class="campaign-image"><img src="/media/${escapeHtml(products[0].mediaIds[0])}" alt="${escapeHtml(products[0].name)}" fetchpriority="high" /></div>` : '<div class="campaign-image campaign-image-empty" aria-hidden="true"></div>'}</section>`
        : '';

  const brands = [...new Set(products.map((product) => product.brand?.trim()).filter((brand): brand is string => Boolean(brand)))].slice(0, 4);
  const brandSection = brands.length ? `<section class="brand-section" aria-labelledby="brand-title"><div class="section-heading"><div><span class="eyebrow">Encuentra lo que buscas</span><h2 id="brand-title">Compra por línea</h2></div><a href="/productos">Ver catálogo <span aria-hidden="true">↗</span></a></div><div class="brand-grid">${brands.map((brand) => `<a class="brand-tile" href="/productos?q=${encodeURIComponent(brand)}"><span aria-hidden="true">✳</span><strong>${escapeHtml(brand)}</strong><span>Ver productos <span aria-hidden="true">→</span></span></a>`).join('')}</div></section>` : '';
  const searchForm = searchQuery ? `<form class="search-bar" action="/productos" method="GET" role="search" aria-label="Buscar productos">
      <label class="search-label" for="store-search">Buscar</label>
      <input id="store-search" type="search" name="q" placeholder="¿Qué estás buscando hoy?" value="${queryVal}" required />
      <button type="submit">Buscar <span aria-hidden="true">↗</span></button>
      <a href="/productos" class="clear-search">Limpiar</a>
    </form>` : '';
  let html = `${bannerHtml}${searchForm}${brandSection}
    <section class="products-section" aria-labelledby="products-title">
      <div class="section-heading"><div><span class="eyebrow">Selección de Vega Store</span><h1 id="products-title">${searchQuery ? `Resultados para “${queryVal}”` : 'Descubre nuestros productos'}</h1><p>Encuentra opciones para tu día a día, con información clara antes de comprar.</p></div><a href="/productos">Ver catálogo <span aria-hidden="true">↗</span></a></div>`;

  if (products.length === 0) {
    html += `<div style="background: #fff; padding: 3rem; text-align: center; border-radius: 8px; border: 1px solid var(--border);"><h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No se encontraron productos</h3><p style="color: var(--muted);">Intenta buscando con otro término.</p></div>`;
    return `${html}</section>`;
  }

  html += '<div class="grid">';
  for (const product of products) {
    const formattedPrice = (product.priceInCents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const imageHtml = product.mediaIds?.[0] ? `<img src="/media/${escapeHtml(product.mediaIds[0])}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'product-media-placeholder',textContent:'Imagen no disponible'}))" />` : '<div class="product-media-placeholder" aria-hidden="true">Vega Store</div>';
    const discountInfo = discountMap?.get(product.id);
    let priceHtml = `<div class="card-price">${formattedPrice}</div>`;
    let promoBadge = '';
    if (discountInfo?.hasDiscount) {
      const finalFormatted = (discountInfo.finalPriceCents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
      priceHtml = `<div class="card-price-group"><span class="card-price-sale">${finalFormatted}</span><span class="card-price-old">${formattedPrice}</span></div>`;
      promoBadge = `<span class="card-discount-badge">-${discountInfo.discountPercentage}%</span>`;
    }
    const effectivePrice = discountInfo?.hasDiscount ? discountInfo.finalPriceCents : product.priceInCents;

    html += `
      <article class="card product-card-v2">
        <a class="product-media" href="/productos/${escapeHtml(product.slug)}" aria-label="${escapeHtml(product.name)}">
          ${imageHtml}${promoBadge}
        </a>
        <div class="card-body">
          <div class="card-eyebrow"><span class="card-brand">${escapeHtml(product.brand || 'Vega Store')}</span><span class="card-sku">${escapeHtml(product.sku)}</span></div>
          <h2 class="card-title"><a href="/productos/${escapeHtml(product.slug)}">${escapeHtml(product.name)}</a></h2>
          <div class="card-pricing-block">${priceHtml}<span class="card-stock-indicator ${product.stockQuantity <= 5 && product.stockQuantity > 0 ? 'stock-low' : ''}">${product.stockQuantity > 0 ? product.stockQuantity + ' disponibles' : 'Sin stock'}</span></div>
          <div class="product-card-footer">
            <div class="card-shipping-bullet"><span class="bullet-dot"></span><span>${product.salePolicy.shippingScope === 'national' ? 'Envío nacional' : 'Envío local'} · ${product.salePolicy.allowsCashOnDelivery ? 'Contra entrega' : 'Pago online'}</span></div>
            <div class="card-actions-group">
              ${product.stockQuantity > 0 ? `<button type="button" class="btn-action-cart" onclick="addToCartFromCard('${product.id}', ${effectivePrice}, this)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span>Añadir</span></button>` : ''}
              <a class="btn-action-view" href="/productos/${escapeHtml(product.slug)}">Detalles</a>
            </div>
          </div>
        </div>
      </article>`;
  }
  html += `</div></section>
  <section class="benefits-strip" aria-label="Información de compra"><article><span aria-hidden="true">↗</span><div><strong>Envíos locales y nacionales</strong><p>La cobertura se indica en cada producto.</p></div></article><article><span aria-hidden="true">⌂</span><div><strong>Opciones de pago</strong><p>Consulta las alternativas disponibles al comprar.</p></div></article><article><span aria-hidden="true">✓</span><div><strong>Compra con confianza</strong><p>Revisa los detalles y políticas de cada producto.</p></div></article></section>
  <script>
    document.querySelectorAll('.campaign-carousel-controls button[data-carousel-direction]').forEach((button) => {
      button.addEventListener('click', () => {
        const carousel = document.getElementById(button.getAttribute('aria-controls'));
        if (!carousel) return;
        const slide = carousel.querySelector('.campaign-banner');
        const distance = slide ? slide.getBoundingClientRect().width + 16 : carousel.clientWidth;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        carousel.scrollBy({ left: Number(button.dataset.carouselDirection) * distance, behavior: reduceMotion ? 'instant' : 'smooth' });
      });
    });
    const heroCarousel = document.getElementById('heroCarousel');
    heroCarousel?.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const slide = heroCarousel.querySelector('.campaign-banner');
      const distance = slide ? slide.getBoundingClientRect().width + 16 : heroCarousel.clientWidth;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      heroCarousel.scrollBy({ left: direction * distance, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });

    async function addToCartFromCard(productId, priceCents, btn) {
      const origText = btn.innerText;
      btn.disabled = true; btn.innerText = 'Agregando...';
      try {
        const res = await fetch('/api/v1/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity: 1, unitPriceCents: priceCents })
        });
        if (res.ok) {
          btn.innerText = '¡Añadido! ✅';
          setTimeout(() => { btn.disabled = false; btn.innerText = origText; }, 1800);
        } else {
          const err = await res.json();
          alert(err.error || 'No se pudo agregar al carrito');
          btn.disabled = false; btn.innerText = origText;
        }
      } catch {
        alert('Error de conexión al agregar al carrito');
        btn.disabled = false; btn.innerText = origText;
      }
    }
  </script>`;
  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
