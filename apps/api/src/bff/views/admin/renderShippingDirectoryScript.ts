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
      const view = '<button class="shipping-action" type="button" data-shipping-action="view-location" data-code="' + escapeHtml(item.daneCode) + '" data-name="' + escapeHtml(item.municipality) + '" data-department="' + escapeHtml(item.department) + '" data-type="' + escapeHtml(item.type) + '" data-zones="' + escapeHtml(zoneData) + '">Ver</button>';
      const action = zone ? '<button class="shipping-action primary" type="button" data-shipping-action="edit-zone" data-item="' + encodeURIComponent(JSON.stringify(zone)) + '">Editar</button><button class="shipping-action danger" type="button" data-shipping-action="remove-location" data-item="' + encodeURIComponent(JSON.stringify(zone)) + '" data-code="' + escapeHtml(item.daneCode) + '">Eliminar</button>' : '';
      return '<tr><td><strong>' + escapeHtml(item.municipality) + '</strong></td><td>' + escapeHtml(item.department) + '</td><td><code>' + escapeHtml(item.daneCode) + '</code></td><td>' + coverage + '</td><td><div class="shipping-row-actions">' + view + action + '</div></td></tr>';
    }
    ${renderShippingLocationDetailsScript()}
    loadShippingZones();
    const zonePager = document.getElementById('shipping-zones-pagination');
    zonePager?.querySelector('[data-zone-page="previous"]')?.addEventListener('click', () => loadShippingZones(Math.max(1, shippingZonesPage - 1)));
    zonePager?.querySelector('[data-zone-page="next"]')?.addEventListener('click', () => loadShippingZones(shippingZonesPage + 1));
    document.addEventListener('input', (event) => {
      const input = event.target.closest('[data-shipping-input]');
      if (input?.dataset.shippingInput === 'directory') filterShippingDirectory();
      if (input?.dataset.shippingInput === 'locations') filterShippingLocations();
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-shipping-change="zone-type"]')) window.onShippingTypeChange?.();
    });
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shipping-action]');
      if (!button) return;
      const action = button.dataset.shippingAction;
      if (action === 'open-zone') window.openShippingZoneModal?.();
      if (action === 'close-zone') window.closeShippingZoneModal?.();
      if (action === 'reset-zone') window.resetShippingZoneForm?.();
      if (action === 'close-details') window.closeShippingDetailsModal?.();
      if (action === 'view-location') window.viewShippingLocation?.(button);
      if (action === 'edit-zone') window.editShippingZoneModal?.(button);
      if (action === 'remove-location') window.removeShippingLocationFromZone?.(button);
      if (action === 'view-zone') window.viewShippingZoneModal?.(button);
      if (action === 'toggle-zone') window.toggleShippingZoneStatus?.(button.dataset.zoneId, button.dataset.zoneActive === 'true');
      if (action === 'delete-zone') window.deleteShippingZone?.(button.dataset.zoneId);
    });
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
