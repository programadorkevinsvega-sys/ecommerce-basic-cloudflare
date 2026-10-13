import { BannerItem } from './renderProductList.js';

export function renderStorefrontBanners(banners: BannerItem[], label: string): string {
  if (!banners.length) return '';
  const items = banners.map((banner) => {
    const image = `<img src="${escapeHtml(banner.imageUrl)}" alt="${escapeHtml(banner.altText)}" loading="lazy" />`;
    const action = banner.bannerType === 'informative' ? '' : `<a class="campaign-action" href="${escapeHtml(banner.linkUrl)}">${escapeHtml(banner.buttonText || 'Explorar colección')}</a>`;
    return `<article class="campaign-banner"><div class="campaign-copy"><span class="eyebrow">${banner.bannerType === 'informative' ? 'Comunicado' : 'Selección de la tienda'}</span><h2>${escapeHtml(banner.title)}</h2>${banner.description ? `<p>${escapeHtml(banner.description)}</p>` : ''}${action}</div><div class="campaign-image">${image}</div></article>`;
  }).join('');
  if (banners.length === 1) return `<section class="campaign-banner" aria-label="${escapeHtml(label)}">${items}</section>`;
  return `<section class="campaign-carousel" aria-label="${escapeHtml(label)}" tabindex="0">${items}</section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}
