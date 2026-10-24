import { BannerItemDto } from '../../gateways/storefront/StorefrontGateway.js';

export function renderStorefrontBannerRows(items: BannerItemDto[], promotional: boolean): string {
  if (!items.length) return '<tr><td colspan="4" class="admin-empty">No hay banners en esta página.</td></tr>';
  return items.map((banner) => {
    const cta = Boolean(banner.buttonText?.trim() && banner.linkUrl?.trim());
    const state = banner.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>';
    const action = banner.isActive ? 'setBannerStatus(\'' + e(banner.id) + '\', false)' : 'setBannerStatus(\'' + e(banner.id) + '\', true)';
    return `<tr data-banner-row="1" data-title="${e(banner.title.toLowerCase())}" data-type="${e(banner.bannerType || 'promotional')}" data-placement="${e(banner.placement)}" data-active="${banner.isActive ? 'active' : 'inactive'}">
      <td><div class="marketing-banner-row"><strong>${e(banner.title)}</strong><small>${e(banner.description || (promotional && cta ? `Botón: ${banner.buttonText} → ${banner.linkUrl}` : 'Banner informativo'))}</small></div></td>
      <td>${e(banner.placement)}</td><td>${state}</td><td class="marketing-row-actions">
      ${promotional && cta ? `<a class="btn-action btn-action-view" href="${e(banner.linkUrl)}" target="_blank" rel="noopener noreferrer">Ver</a>` : ''}
      <button class="btn-action" onclick="editBanner('${e(banner.id)}','${js(banner.title)}','${js(banner.linkUrl)}','${js(banner.altText)}','${js(banner.imageUrl)}','${js(banner.placement)}','${js(banner.description || '')}','${js(banner.bannerType || 'promotional')}','${js(banner.buttonText || '')}','${js(banner.startsAt || '')}','${js(banner.endsAt || '')}','${banner.sortOrder}')">Editar</button>
      <button class="btn-action" onclick="duplicateBanner('${e(banner.id)}')">Duplicar</button><button class="btn-action" onclick="${action}">${banner.isActive ? 'Ocultar' : 'Publicar'}</button>
      <button class="btn-action btn-action-delete" onclick="deleteBanner('${e(banner.id)}')">Eliminar</button></td></tr>`;
  }).join('');
}

function e(value: string): string { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function js(value: string): string { return value.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,'\\n'); }
