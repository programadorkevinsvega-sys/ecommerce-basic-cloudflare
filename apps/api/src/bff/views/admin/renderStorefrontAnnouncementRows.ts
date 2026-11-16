import { AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';

export function renderStorefrontAnnouncementRows(items: AnnouncementItemDto[]): string {
  if (!items.length) return '<tr><td colspan="4" class="admin-empty">No hay anuncios en esta página.</td></tr>';
  return items.map((item) => `<tr><td><strong>${e(item.message)}</strong>${item.linkUrl ? `<small>${e(item.linkUrl)}</small>` : ''}</td><td>${e(item.placement)}</td>
    <td>${item.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}</td><td class="marketing-row-actions">
    ${item.linkUrl ? `<a class="btn-action btn-action-view" href="${e(item.linkUrl)}" target="_blank" rel="noopener noreferrer">Ver</a>` : ''}
    <button class="btn-action" data-storefront-action="edit-announcement" data-id="${e(item.id)}" data-message="${e(item.message)}" data-link="${e(item.linkUrl || '')}" data-placement="${e(item.placement)}">Editar</button>
    <button class="btn-action" data-storefront-action="toggle-announcement" data-id="${e(item.id)}" data-active="${!item.isActive}">${item.isActive ? 'Ocultar' : 'Publicar'}</button>
    <button class="btn-action btn-action-delete" data-storefront-action="delete-announcement" data-id="${e(item.id)}">Eliminar</button></td></tr>`).join('');
}
function e(value: string): string { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
