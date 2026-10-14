import { ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingTableRows(zones: ShippingZoneDto[], divipolaMap: Map<string, string>): string {
  if (!zones.length) return '<tr><td colspan="6" class="shipping-empty">No hay zonas de envío configuradas.</td></tr>';
  return zones.map(zone => {
    const typeLabel = { national: 'Nacional', department: 'Departamento', city: 'Ciudad', municipality: 'Municipio' }[zone.type] || zone.type;
    const status = zone.isActive ? '<span class="shipping-badge active">Activa</span>' : '<span class="shipping-badge inactive">Inactiva</span>';
    const cod = zone.allowsCashOnDelivery ? '<span class="shipping-badge active">Contra entrega</span>' : '<span class="shipping-badge neutral">Pago anticipado</span>';
    const encoded = encodeURIComponent(JSON.stringify(zone));
    const locations = zone.type === 'national' ? 'Todo el territorio' : zone.locations.slice(0, 3).map(code => divipolaMap.get(code) || code).join(', ') || 'Sin municipios asignados';
    const more = zone.type !== 'national' && zone.locations.length > 3 ? ` (+${zone.locations.length - 3} municipios)` : '';
    const toggle = zone.isActive
      ? `<button class="shipping-action" onclick="toggleShippingZoneStatus('${zone.id}', false)">Desactivar</button>`
      : `<button class="shipping-action" onclick="toggleShippingZoneStatus('${zone.id}', true)">Activar</button>`;
    return `<tr><td><strong>${escapeHtml(zone.name)}</strong><small>${escapeHtml(locations + more)}</small></td><td><span class="shipping-type">${escapeHtml(typeLabel)}</span></td><td><strong class="shipping-price">${(zone.priceInCents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</strong></td><td>${zone.minEstimatedDays}–${zone.maxEstimatedDays} días</td><td><div class="shipping-badges">${cod}${status}</div></td><td><div class="shipping-actions"><button class="shipping-action" data-item="${encoded}" onclick="viewShippingZoneModal(this)">Ver</button><button class="shipping-action" data-item="${encoded}" onclick="editShippingZoneModal(this)">Editar</button>${toggle}<button class="shipping-action danger" onclick="deleteShippingZone('${zone.id}')">Eliminar</button></div></td></tr>`;
  }).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
