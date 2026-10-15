import { DivipolaLocationDto, ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingLocationRows(locations: DivipolaLocationDto[], zones: ShippingZoneDto[]): string {
  const configuredLocations = locations.filter((location) => zones.some((zone) => zone.type !== 'national' && zone.isActive && zone.locations.includes(location.daneCode)));
  if (!configuredLocations.length) return '<tr><td colspan="5" class="shipping-empty">Cargando municipios con entrega local…</td></tr>';
  return configuredLocations.map(location => {
    const localZones = zones.filter(zone => zone.type !== 'national' && zone.isActive && zone.locations.includes(location.daneCode));
    const activeLocalZones = localZones.filter(zone => zone.isActive);
    const coverage = activeLocalZones.length
      ? `<span class="shipping-badge active">Entrega local activa</span><small>${escapeHtml(activeLocalZones.map(zone => zone.name).join(', '))}</small>`
      : localZones.length
      ? `<span class="shipping-badge inactive">Entrega local inactiva</span><small>${escapeHtml(localZones.map(zone => zone.name).join(', '))}</small>`
      : '<span class="shipping-badge neutral">Sin entrega local</span>';
    const editableZone = activeLocalZones[0] || localZones[0];
    const encodedZones = escapeHtml(encodeURIComponent(JSON.stringify(localZones)));
    const view = `<button class="shipping-action" type="button" data-code="${escapeHtml(location.daneCode)}" data-name="${escapeHtml(location.municipality)}" data-department="${escapeHtml(location.department)}" data-type="${escapeHtml(location.type)}" data-zones="${encodedZones}" onclick="viewShippingLocation(this)">Ver</button>`;
    const actions = editableZone
      ? `<button class="shipping-action primary" type="button" data-item="${encodeHtmlData(editableZone)}" onclick="editShippingZoneModal(this)">Editar</button><button class="shipping-action danger" type="button" data-item="${encodeHtmlData(editableZone)}" data-code="${escapeHtml(location.daneCode)}" onclick="removeShippingLocationFromZone(this)">Eliminar</button>`
      : '';
    const search = `${location.municipality} ${location.department} ${location.daneCode}`.toLowerCase();
    return `<tr data-shipping-search="${escapeHtml(search)}"><td><strong>${escapeHtml(location.municipality)}</strong></td><td>${escapeHtml(location.department)}</td><td><code>${escapeHtml(location.daneCode)}</code></td><td>${coverage}</td><td><div class="shipping-row-actions">${view}${actions}</div></td></tr>`;
  }).join('');
}

function encodeHtmlData(value: ShippingZoneDto): string {
  return escapeHtml(encodeURIComponent(JSON.stringify(value)));
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
