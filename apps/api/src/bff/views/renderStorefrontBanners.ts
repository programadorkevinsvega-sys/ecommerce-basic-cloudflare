import { BannerItem } from './renderProductList.js';

export function renderStorefrontBanners(banners: BannerItem[], label: string): string {
  if (!banners.length) return '';
  const items = banners.map((banner, index) => {
    const image = `<img src="${escapeHtml(banner.imageUrl)}" alt="${escapeHtml(banner.altText)}" loading="lazy" />`;
    const action = banner.bannerType === 'informative' ? '' : `<a class="campaign-action" href="${escapeHtml(banner.linkUrl)}">${escapeHtml(banner.buttonText || 'Explorar colección')}</a>`;
    return `<article class="campaign-banner" role="group" aria-roledescription="diapositiva" aria-label="${index + 1} de ${banners.length}"><div class="campaign-copy"><span class="eyebrow">${banner.bannerType === 'informative' ? 'Comunicado' : 'Selección de la tienda'}</span><h2>${escapeHtml(banner.title)}</h2>${banner.description ? `<p>${escapeHtml(banner.description)}</p>` : ''}${action}</div><div class="campaign-image">${image}</div></article>`;
  }).join('');
  if (banners.length === 1) return `<section class="campaign-banner" aria-label="${escapeHtml(label)}">${items}</section>`;
  return `<div class="campaign-carousel-wrap"><section id="storefrontBannerCarousel" class="campaign-carousel" role="region" aria-roledescription="carrusel" aria-label="${escapeHtml(label)}" aria-live="polite" tabindex="0">${items}</section><div class="campaign-carousel-controls" role="group" aria-label="Controles del carrusel"><button type="button" data-carousel-direction="-1" aria-controls="storefrontBannerCarousel">Anterior</button><button type="button" data-carousel-direction="1" aria-controls="storefrontBannerCarousel">Siguiente</button></div><script>const carousel=document.getElementById('storefrontBannerCarousel');const moveCarousel=(direction)=>{const slide=carousel?.querySelector('.campaign-banner');if(!carousel)return;const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;carousel.scrollBy({left:direction*(slide?slide.getBoundingClientRect().width+16:carousel.clientWidth),behavior:reduceMotion?'instant':'smooth'});};document.querySelectorAll('.campaign-carousel-controls button[data-carousel-direction]').forEach((button)=>button.addEventListener('click',()=>moveCarousel(Number(button.dataset.carouselDirection))));carousel?.addEventListener('keydown',(event)=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();moveCarousel(event.key==='ArrowLeft'?-1:1);}});</script></div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}
