import { renderShippingLocationDetailsScript } from './renderShippingLocationDetailsScript.js';

export function renderShippingDirectoryScript(): string {
  return `
    let shippingDirectoryPage = 1;
    let shippingDirectoryTimer;
    let shippingZonesPage = 1;
    async function loadShippingZones(page = 1) {
      const body = document.getElementById('shippingZonesTableBody'); if (!body) return;
      shippingZonesPage = page;
      try {
        const response = await fetch('/api/v1/admin/shipping/zones?page=' + page + '&pageSize=25', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cargar zonas.');
        body.innerHTML = result.rowsHtml || '<tr><td colspan="6" class="shipping-empty">No hay zonas locales.</td></tr>';
        const pager = document.getElementById('shipping-zones-pagination');
        pager.querySelector('span').textContent = result.total + ' zonas locales · Página ' + result.page;
        pager.querySelector('[data-zone-page="previous"]').disabled = result.page <= 1;
        pager.querySelector('[data-zone-page="next"]').disabled = !result.hasMore;
        pager.querySelector('[data-zone-page="previous"]').onclick = () => loadShippingZones(result.page - 1);
        pager.querySelector('[data-zone-page="next"]').onclick = () => loadShippingZones(result.page + 1);
      } catch (error) { body.innerHTML = '<tr><td colspan="6" class="shipping-empty">' + escapeHtml(error.message || 'Error cargando zonas.') + '</td></tr>'; }
    }
    async function loadShippingDirectory(page = 1) {
      const body = document.getElementById('shippingLocationsTableBody');
      if (!body) return;
      shippingDirectoryPage = page;
      body.innerHTML = '<tr><td colspan="5" class="shipping-empty">Cargando municipios…</td></tr>';
      const search = document.getElementById('shipping-location-search')?.value.trim() || '';
      try {
        const response = await fetch('/api/v1/admin/shipping/locations?page=' + page + '&q=' + encodeURIComponent(search));
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cargar municipios.');
        body.innerHTML = result.data.length ? result.data.map((item) => renderShippingDirectoryRow(item, result.zones)).join('') : '<tr><td colspan="5" class="shipping-empty">No hay municipios locales asignados que coincidan. Agrega municipios al crear o editar una zona local.</td></tr>';
        const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
        document.getElementById('shipping-location-count').textContent = result.total + ' municipios con entrega local · Página ' + result.page + ' de ' + totalPages;
        const pager = document.getElementById('shipping-locations-pagination');
        pager.querySelector('span').textContent = (result.total ? ((page - 1) * result.pageSize + 1) : 0) + '–' + Math.min(page * result.pageSize, result.total) + ' asignados · Página ' + result.page + ' de ' + totalPages;
        pager.querySelector('[data-page-direction="previous"]').disabled = page <= 1;
        pager.querySelector('[data-page-direction="next"]').disabled = !result.hasMore;
      } catch (error) {
        body.innerHTML = '<tr><td colspan="5" class="shipping-empty">' + escapeHtml(error.message || 'Error cargando municipios.') + '</td></tr>';
      }
    }
    function renderShippingDirectoryRow(item, zones) {
      const local = zones.filter((zone) => zone.type !== 'national' && zone.locations.includes(item.daneCode));
      const active = local.filter((zone) => zone.isActive);
      const coverage = active.length ? '<span class="shipping-badge active">Entrega local activa</span><small>' + escapeHtml(active.map((zone) => zone.name).join(', ')) + '</small>' : '<span class="shipping-badge inactive">Zona local inactiva</span><small>' + escapeHtml(local.map((zone) => zone.name).join(', ')) + '</small>';
      const zone = active[0] || local[0];
      const zoneData = encodeURIComponent(JSON.stringify(local));
      const view = '<button class="shipping-action" type="button" data-code="' + escapeHtml(item.daneCode) + '" data-name="' + escapeHtml(item.municipality) + '" data-department="' + escapeHtml(item.department) + '" data-type="' + escapeHtml(item.type) + '" data-zones="' + escapeHtml(zoneData) + '" onclick="viewShippingLocation(this)">Ver</button>';
      const action = zone ? '<button class="shipping-action primary" type="button" data-item="' + encodeURIComponent(JSON.stringify(zone)) + '" onclick="editShippingZoneModal(this)">Editar</button><button class="shipping-action danger" type="button" data-item="' + encodeURIComponent(JSON.stringify(zone)) + '" data-code="' + escapeHtml(item.daneCode) + '" onclick="removeShippingLocationFromZone(this)">Eliminar</button>' : '';
      return '<tr><td><strong>' + escapeHtml(item.municipality) + '</strong></td><td>' + escapeHtml(item.department) + '</td><td><code>' + escapeHtml(item.daneCode) + '</code></td><td>' + coverage + '</td><td><div class="shipping-row-actions">' + view + action + '</div></td></tr>';
    }
    ${renderShippingLocationDetailsScript()}
    function filterShippingDirectory() { clearTimeout(shippingDirectoryTimer); shippingDirectoryTimer = setTimeout(() => loadShippingDirectory(1), 250); }
    function filterShippingLocations() {
      const select = document.getElementById('shLocationsSelect');
      const query = (document.getElementById('shLocSearch')?.value || '').trim().toLocaleLowerCase('es-CO');
      if (!select) return;
      Array.from(select.options).forEach((option) => { option.hidden = Boolean(query) && !option.textContent.toLocaleLowerCase('es-CO').includes(query); });
    }
    function ensureShippingOption(code, label) {
      const select = document.getElementById('shLocationsSelect');
      if (!select || !['05001','05079','05088','05129','05212','05266','05308','05360','05380','05631'].includes(code)) return;
      const option = Array.from(select.options).find((item) => item.value === code);
      if (option && label) option.textContent = label;
    }
  `;
}
