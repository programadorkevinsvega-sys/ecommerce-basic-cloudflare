import { BannerItemDto } from '../../gateways/storefront/StorefrontGateway.js';

export function renderStorefrontBannerRows(items: BannerItemDto[], promotional: boolean): string {
  if (!items.length) return '<tr><td colspan="4" class="admin-empty">No hay banners en esta página.</td></tr>';
  return items.map((banner) => {
    const cta = Boolean(banner.buttonText?.trim() && banner.linkUrl?.trim());
    const state = banner.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>';
    return `<tr data-banner-row="1" data-title="${e(banner.title.toLowerCase())}" data-type="${e(banner.bannerType || 'promotional')}" data-placement="${e(banner.placement)}" data-active="${banner.isActive ? 'active' : 'inactive'}">
      <td><div class="marketing-banner-row"><strong>${e(banner.title)}</strong><small>${e(banner.description || (promotional && cta ? `Botón: ${banner.buttonText} → ${banner.linkUrl}` : 'Banner informativo'))}</small></div></td>
      <td>${e(banner.placement)}</td><td>${state}</td><td class="marketing-row-actions">
      ${promotional && cta ? `<a class="btn-action btn-action-view" href="${e(banner.linkUrl)}" target="_blank" rel="noopener noreferrer">Ver</a>` : ''}
      <button class="btn-action" data-storefront-action="edit-banner" data-id="${e(banner.id)}" data-title="${e(banner.title)}" data-link="${e(banner.linkUrl)}" data-alt="${e(banner.altText)}" data-image="${e(banner.imageUrl)}" data-placement="${e(banner.placement)}" data-description="${e(banner.description || '')}" data-type="${e(banner.bannerType || 'promotional')}" data-button-text="${e(banner.buttonText || '')}" data-starts-at="${e(banner.startsAt || '')}" data-ends-at="${e(banner.endsAt || '')}" data-sort-order="${banner.sortOrder}">Editar</button>
      <button class="btn-action" data-storefront-action="duplicate-banner" data-id="${e(banner.id)}">Duplicar</button><button class="btn-action" data-storefront-action="toggle-banner" data-id="${e(banner.id)}" data-active="${!banner.isActive}">${banner.isActive ? 'Ocultar' : 'Publicar'}</button>
      <button class="btn-action btn-action-delete" data-storefront-action="delete-banner" data-id="${e(banner.id)}">Eliminar</button></td></tr>`;
  }).join('');
}

function e(value: string): string { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
