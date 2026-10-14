import { DivipolaLocationDto, ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingLocationRows(locations: DivipolaLocationDto[], zones: ShippingZoneDto[]): string {
  if (!locations.length) return '<tr><td colspan="5" class="shipping-empty">No hay municipios DANE disponibles.</td></tr>';
  return locations.map(location => {
    const localZones = zones.filter(zone => zone.type !== 'national' && zone.locations.includes(location.daneCode));
    const activeLocalZones = localZones.filter(zone => zone.isActive);
    const activeNational = zones.some(zone => zone.type === 'national' && zone.isActive);
    const coverage = activeLocalZones.length
      ? `<span class="shipping-badge active">Zona local activa</span><small>${escapeHtml(activeLocalZones.map(zone => zone.name).join(', '))}</small>${activeNational ? '<small>Cobertura nacional también activa</small>' : ''}`
      : localZones.length
      ? `<span class="shipping-badge inactive">Zona local inactiva</span><small>${escapeHtml(localZones.map(zone => zone.name).join(', '))}</small>${activeNational ? '<small>Cobertura nacional activa</small>' : ''}`
      : activeNational
      ? '<span class="shipping-badge neutral">Solo cobertura nacional</span><small>Sin una tarifa local específica</small>'
      : '<span class="shipping-badge inactive">Sin cobertura activa</span>';
    const editableZone = activeLocalZones[0] || localZones[0];
    const button = editableZone
      ? `<button class="shipping-action primary" type="button" data-item="${encodeURIComponent(JSON.stringify(editableZone))}" onclick="editShippingZoneModal(this)">Editar zona local</button>`
      : `<button class="shipping-action primary" type="button" data-code="${escapeHtml(location.daneCode)}" data-name="${escapeHtml(location.municipality)}" onclick="createZoneForLocation(this)">Crear zona local</button>`;
    const search = `${location.municipality} ${location.department} ${location.daneCode}`.toLowerCase();
    return `<tr data-shipping-search="${escapeHtml(search)}"><td><strong>${escapeHtml(location.municipality)}</strong></td><td>${escapeHtml(location.department)}</td><td><code>${escapeHtml(location.daneCode)}</code></td><td>${coverage}</td><td>${button}</td></tr>`;
  }).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
