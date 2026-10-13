import { BannerItem } from './renderProductList.js';
import { renderStorefrontCarouselScript } from './renderStorefrontCarouselScript.js';

export function renderStorefrontBanners(banners: BannerItem[], label: string): string {
  if (!banners.length) return '';
  const items = banners.map((banner, index) => {
    const image = `<img src="${escapeHtml(banner.imageUrl)}" alt="${escapeHtml(banner.altText)}" loading="lazy" />`;
    const action = banner.bannerType === 'informative' ? '' : `<a class="campaign-action" href="${escapeHtml(banner.linkUrl)}">${escapeHtml(banner.buttonText || 'Explorar colección')}</a>`;
    return `<article class="campaign-banner" role="group" aria-roledescription="diapositiva" aria-label="${index + 1} de ${banners.length}"><div class="campaign-copy"><span class="eyebrow">${banner.bannerType === 'informative' ? 'Comunicado' : 'Selección de la tienda'}</span><h2>${escapeHtml(banner.title)}</h2>${banner.description ? `<p>${escapeHtml(banner.description)}</p>` : ''}${action}</div><div class="campaign-image">${image}</div></article>`;
  }).join('');
  if (banners.length === 1) return `<section class="campaign-banner-single" aria-label="${escapeHtml(label)}">${items}</section>`;
  return `<div class="campaign-carousel-wrap"><section id="storefrontBannerCarousel" class="campaign-carousel" role="region" aria-roledescription="carrusel" aria-label="${escapeHtml(label)}" aria-live="off" tabindex="0">${items}</section><div class="campaign-carousel-controls" role="group" aria-label="Controles del carrusel"><button type="button" data-carousel-direction="-1" aria-controls="storefrontBannerCarousel">Anterior</button><button type="button" data-carousel-pause aria-controls="storefrontBannerCarousel" aria-label="Pausar carrusel automático" aria-pressed="false">Pausar</button><button type="button" data-carousel-direction="1" aria-controls="storefrontBannerCarousel">Siguiente</button></div>${renderStorefrontCarouselScript('storefrontBannerCarousel')}</div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}
