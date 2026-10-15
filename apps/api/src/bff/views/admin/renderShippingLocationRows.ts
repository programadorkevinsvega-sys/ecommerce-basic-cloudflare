import { DivipolaLocationDto, ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingLocationRows(locations: DivipolaLocationDto[], zones: ShippingZoneDto[]): string {
  if (!locations.length) return '<tr><td colspan="5" class="shipping-empty">No hay municipios DANE disponibles.</td></tr>';
  return locations.map(location => {
    const localZones = zones.filter(zone => zone.type !== 'national' && zone.locations.includes(location.daneCode));
    const activeLocalZones = localZones.filter(zone => zone.isActive);
    const coverage = activeLocalZones.length
      ? `<span class="shipping-badge active">Entrega local activa</span><small>${escapeHtml(activeLocalZones.map(zone => zone.name).join(', '))}</small>`
      : localZones.length
      ? `<span class="shipping-badge inactive">Entrega local inactiva</span><small>${escapeHtml(localZones.map(zone => zone.name).join(', '))}</small>`
      : '<span class="shipping-badge neutral">Sin entrega local</span><small>Consulta tarifas nacionales en MiPaquete</small>';
    const editableZone = activeLocalZones[0] || localZones[0];
    const button = editableZone
      ? `<button class="shipping-action primary" type="button" data-item="${encodeURIComponent(JSON.stringify(editableZone))}" onclick="editShippingZoneModal(this)">Editar cobertura</button>`
      : `<button class="shipping-action primary" type="button" data-code="${escapeHtml(location.daneCode)}" data-name="${escapeHtml(location.municipality)}" onclick="createZoneForLocation(this)">Crear zona local</button>`;
    const view = `<button class="shipping-action" type="button" data-code="${escapeHtml(location.daneCode)}" data-name="${escapeHtml(location.municipality)}" data-department="${escapeHtml(location.department)}" data-type="${escapeHtml(location.type)}" onclick="viewShippingLocation(this)">Ver</button>`;
    const search = `${location.municipality} ${location.department} ${location.daneCode}`.toLowerCase();
    return `<tr data-shipping-search="${escapeHtml(search)}"><td><strong>${escapeHtml(location.municipality)}</strong></td><td>${escapeHtml(location.department)}</td><td><code>${escapeHtml(location.daneCode)}</code></td><td>${coverage}</td><td><div class="shipping-row-actions">${view}${button}</div></td></tr>`;
  }).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
