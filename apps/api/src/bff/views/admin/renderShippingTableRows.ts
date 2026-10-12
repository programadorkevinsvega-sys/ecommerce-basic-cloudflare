import { ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingTableRows(
  zones: ShippingZoneDto[],
  divipolaMap: Map<string, string>
): string {
  if (zones.length === 0) {
    return '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#94a3b8;">No hay zonas de envío configuradas</td></tr>';
  }

  return zones.map((z) => {
    const isAct = z.isActive;
    const priceFormatted = (z.priceInCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

    const typeBadge = z.type === 'national'
      ? '<span class="badge" style="background:#0284c7; color:#fff;">Nacional</span>'
      : z.type === 'department'
      ? '<span class="badge" style="background:#7c3aed; color:#fff;">Departamento</span>'
      : z.type === 'city'
      ? '<span class="badge" style="background:#059669; color:#fff;">Ciudad</span>'
      : '<span class="badge" style="background:#d97706; color:#fff;">Municipio</span>';

    const codBadge = z.allowsCashOnDelivery
      ? '<span class="badge badge-published">✓ Admite Contra Entrega</span>'
      : '<span class="badge badge-draft">✕ Pago Anticipado</span>';

    const statusBadge = isAct
      ? '<span class="badge badge-published">Activa</span>'
      : '<span class="badge badge-draft">Inactiva</span>';

    const toggleBtn = isAct
      ? `<button class="btn-action btn-action-hide" onclick="toggleShippingZoneStatus('${z.id}', false)">Desactivar</button>`
      : `<button class="btn-action btn-action-publish" onclick="toggleShippingZoneStatus('${z.id}', true)">Activar</button>`;

    const encData = encodeURIComponent(JSON.stringify(z));

    const locNames = z.locations.slice(0, 3).map((c) => divipolaMap.get(c) || c).join(', ');
    const locsCount = z.type === 'national'
      ? 'Todo el territorio'
      : z.locations.length > 0
      ? locNames + (z.locations.length > 3 ? ` (+${z.locations.length - 3})` : '')
      : 'Sin municipios asignados';

    return `
      <tr>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">
          <strong>${escapeHtml(z.name)}</strong>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.2rem;">${locsCount}</div>
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">${typeBadge}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600; color:#38bdf8;">${priceFormatted}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">${z.minEstimatedDays} - ${z.maxEstimatedDays} días</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">${codBadge} ${statusBadge}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
          <button class="btn-action btn-action-view" data-item="${encData}" onclick="viewShippingZoneModal(this)">Ver</button>
          <button class="btn-action btn-action-edit" data-item="${encData}" onclick="editShippingZoneModal(this)">Editar</button>
          ${toggleBtn}
          <button class="btn-action btn-action-delete" onclick="deleteShippingZone('${z.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
