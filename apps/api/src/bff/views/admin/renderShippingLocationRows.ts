import { DivipolaLocationDto, ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingLocationRows(locations: DivipolaLocationDto[], zones: ShippingZoneDto[]): string {
  if (!locations.length) return '<tr><td colspan="5" class="shipping-empty">No hay municipios DANE disponibles.</td></tr>';
  return locations.map(location => {
    const activeZones = zones.filter(zone => zone.isActive && (zone.type === 'national' || zone.locations.includes(location.daneCode)));
    const coverage = activeZones.length
      ? `<span class="shipping-badge active">Cubierto</span><small>${escapeHtml(activeZones.map(zone => zone.name).join(', '))}</small>`
      : '<span class="shipping-badge inactive">Sin cobertura</span>';
    const button = activeZones.length
      ? '<span class="shipping-covered-label">Ya tiene zona activa</span>'
      : `<button class="shipping-action primary" type="button" data-code="${escapeHtml(location.daneCode)}" data-name="${escapeHtml(location.municipality)}" onclick="createZoneForLocation(this)">Crear zona</button>`;
    const search = `${location.municipality} ${location.department} ${location.daneCode}`.toLowerCase();
    return `<tr data-shipping-search="${escapeHtml(search)}"><td><strong>${escapeHtml(location.municipality)}</strong></td><td>${escapeHtml(location.department)}</td><td><code>${escapeHtml(location.daneCode)}</code></td><td>${coverage}</td><td>${button}</td></tr>`;
  }).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
