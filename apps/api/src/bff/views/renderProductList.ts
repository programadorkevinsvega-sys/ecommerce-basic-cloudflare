import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { renderStorefrontProductCard } from './renderStorefrontProductCard.js';
import { renderProductCardActionsScript } from './renderProductCardActionsScript.js';
import { renderStorefrontCarouselScript } from './renderStorefrontCarouselScript.js';
import { BrandDto } from '../gateways/catalog/CatalogGateway.js';
import { renderStorefrontPagination } from './renderStorefrontPagination.js';

export interface ProductListPagination { page: number; hasNext: boolean; }

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
  discountMap?: Map<string, ProductDiscountDto>,
  brandLinks: Map<string, string> = new Map(),
  brandAssets: BrandDto[] = [],
  pagination?: ProductListPagination
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
    ? `<div class="campaign-carousel-wrap"><section id="heroCarousel" class="campaign-carousel" role="region" aria-roledescription="carrusel" aria-label="Colecciones destacadas" aria-live="off" tabindex="0">${banners.map(renderBanner).join('')}</section><div class="campaign-carousel-controls" role="group" aria-label="Controles del carrusel"><button type="button" data-carousel-direction="-1" aria-controls="heroCarousel">Anterior</button><button type="button" data-carousel-pause aria-controls="heroCarousel" aria-label="Pausar carrusel automático" aria-pressed="false">Pausar</button><button type="button" data-carousel-direction="1" aria-controls="heroCarousel">Siguiente</button></div></div>`
    : banners.length === 1 && banners[0]
      ? renderBanner(banners[0], 0).replace('<article class="campaign-banner" role="group" aria-roledescription="diapositiva" aria-label="1 de 1">', '<section class="campaign-banner" aria-label="Colección destacada">').replace('</article>', '</section>')
      : products.length
        ? `<section class="campaign-banner fallback-banner" aria-label="Bienvenido a Vega Store"><div class="campaign-copy"><span class="eyebrow">Selección de la tienda</span><h2>Encuentra algo para tu día</h2><p>Explora productos disponibles y descubre cada detalle antes de elegir.</p><a class="campaign-action" href="/productos">Explorar catálogo <span aria-hidden="true">↗</span></a></div>${products[0]?.mediaIds?.[0] ? `<div class="campaign-image"><img src="/media/${escapeHtml(products[0].mediaIds[0])}" alt="${escapeHtml(products[0].name)}" fetchpriority="high" /></div>` : '<div class="campaign-image campaign-image-empty" aria-hidden="true"></div>'}</section>`
        : '';

  const brands = [...new Set(products.map((product) => product.brand?.trim()).filter((brand): brand is string => Boolean(brand)))].slice(0, 4);
  const brandByName = new Map(brandAssets.map((brand) => [brand.name.trim().toLocaleLowerCase(), brand]));
  const brandSection = brands.length ? `<section class="brand-section" aria-labelledby="brand-title"><div class="section-heading"><div><span class="eyebrow">Encuentra lo que buscas</span><h2 id="brand-title">Compra por línea</h2></div><a href="/marcas">Ver marcas <span aria-hidden="true">↗</span></a></div><div class="brand-grid">${brands.map((name) => { const asset = brandByName.get(name.toLocaleLowerCase()); const href = brandLinks.get(name.toLocaleLowerCase()) || `/productos?q=${encodeURIComponent(name)}`; return `<a class="brand-tile" href="${escapeHtml(href)}">${asset?.imageMediaId ? `<span class="brand-image-frame"><img src="/media/${encodeURIComponent(asset.imageMediaId)}" alt="${escapeHtml(name)}" loading="lazy"></span>` : '<span class="brand-fallback" aria-hidden="true">✳</span>'}<strong class="brand-card-name">${escapeHtml(name)}</strong><span class="brand-card-action">Ver productos <b aria-hidden="true">→</b></span></a>`; }).join('')}</div></section>` : '';
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

  html += '<p id="catalog-cart-feedback" class="catalog-cart-feedback" role="status" aria-live="polite" hidden></p><div class="grid">';
  for (const product of products) html += renderStorefrontProductCard(product, discountMap?.get(product.id));
  const pageStatus = pagination ? `Mostrando ${(pagination.page - 1) * 12 + 1}–${(pagination.page - 1) * 12 + products.length} productos · Página ${pagination.page}` : '';
  html += `</div>${pagination ? renderStorefrontPagination('Paginación de productos destacados', pageStatus, pagination.page > 1 ? `/?products_page=${pagination.page - 1}#products-title` : undefined, pagination.hasNext ? `/?products_page=${pagination.page + 1}#products-title` : undefined) : ''}</section>
  <section class="benefits-strip" aria-label="Información de compra"><article><span aria-hidden="true">↗</span><div><strong>Envíos locales y nacionales</strong><p>La cobertura se indica en cada producto.</p></div></article><article><span aria-hidden="true">⌂</span><div><strong>Opciones de pago</strong><p>Consulta las alternativas disponibles al comprar.</p></div></article><article><span aria-hidden="true">✓</span><div><strong>Compra con confianza</strong><p>Revisa los detalles y políticas de cada producto.</p></div></article></section>
  ${banners.length > 1 ? renderStorefrontCarouselScript('heroCarousel') : ''}${renderProductCardActionsScript}`;
  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
