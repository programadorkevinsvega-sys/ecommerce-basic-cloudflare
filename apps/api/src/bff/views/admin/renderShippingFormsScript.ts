import { renderShippingLocationDetailsScript } from './renderShippingLocationDetailsScript.js';

export function renderShippingFormsScript(): string {
  return `
    function onShippingTypeChange() {
      const type = document.getElementById('shType').value;
      const wrap = document.getElementById('shLocationsWrapper');
      if (type === 'national') {
        wrap.style.display = 'none';
      } else {
        wrap.style.display = 'block';
      }
    }

    let shippingDirectoryPage = 1;
    let shippingDirectoryTimer;
    let shippingSelectTimer;
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
    async function filterShippingLocations() {
      clearTimeout(shippingSelectTimer);
      shippingSelectTimer = setTimeout(async () => {
        const select = document.getElementById('shLocationsSelect');
        const search = document.getElementById('shLocSearch').value.trim();
        if (!select) return;
        try {
          const response = await fetch('/api/v1/shipping/locations?q=' + encodeURIComponent(search) + '&limit=25');
          const result = await response.json();
          if (!response.ok) return;
          Array.from(select.options).filter((option) => !option.selected).forEach((option) => option.remove());
          result.data.forEach((item) => ensureShippingOption(item.daneCode, item.municipality + ' (' + item.department + ') [' + item.daneCode + ']'));
        } catch { /* La lista conserva las opciones ya seleccionadas. */ }
      }, 200);
    }
    function ensureShippingOption(code, label) {
      const select = document.getElementById('shLocationsSelect');
      if (!select || Array.from(select.options).some((option) => option.value === code)) return;
      const option = document.createElement('option'); option.value = code; option.textContent = label || 'Código DANE ' + code + ' (asignado)'; select.append(option);
    }

    function showAdminShippingPage(page) {
      document.querySelectorAll('[data-shipping-panel]').forEach(panel => { panel.hidden = panel.dataset.shippingPanel !== page; });
      document.querySelectorAll('[data-shipping-heading]').forEach(heading => { heading.hidden = page !== 'zones'; });
      if (page === 'locations') loadShippingDirectory(shippingDirectoryPage);
      if (page === 'tracking') loadAdminOrderTracking(1);
      if (page === 'print-labels') loadShipmentLabels(1);
    }

    function closeShippingZoneModal() {
      document.getElementById('shippingZoneModal').style.display = 'none';
    }

    function openShippingZoneModal() {
      resetShippingZoneForm(false);
      document.getElementById('shippingZoneModal').style.display = 'flex';
      filterShippingLocations();
      document.getElementById('shName').focus();
    }

    function createZoneForLocation(button) {
      openShippingZoneModal();
      document.getElementById('shType').value = 'municipality';
      document.getElementById('shName').value = 'Envío ' + button.dataset.name;
      const select = document.getElementById('shLocationsSelect');
      ensureShippingOption(button.dataset.code, button.dataset.name + ' [' + button.dataset.code + ']');
      Array.from(select.options).forEach(option => { option.selected = option.value === button.dataset.code; });
      updateSelectedLocationsCount();
      document.getElementById('shPrice').focus();
    }
    window.showAdminShippingPage = showAdminShippingPage;
    window.openShippingZoneModal = openShippingZoneModal;
    window.closeShippingZoneModal = closeShippingZoneModal;
    window.createZoneForLocation = createZoneForLocation;
    window.ensureShippingOption = ensureShippingOption;
    window.removeShippingLocationFromZone = removeShippingLocationFromZone;

    async function removeShippingLocationFromZone(button) {
      const zone = parseShippingItemData(button);
      const code = button.dataset.code;
      if (!zone || !code || !confirm('¿Eliminar este municipio de la zona local ' + zone.name + '? La zona conservará los demás municipios.')) return;
      const response = await fetch('/api/v1/admin/shipping/zones/' + encodeURIComponent(zone.id), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: zone.locations.filter((location) => location !== code) }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        alert(result.error || 'No fue posible eliminar la cobertura local.');
        return;
      }
      loadShippingDirectory(1);
    }

    function updateSelectedLocationsCount() {
      const select = document.getElementById('shLocationsSelect');
      const count = Array.from(select.selectedOptions).length;
      const label = document.getElementById('shSelectedCount');
      if (label) {
        label.textContent = count + ' municipio(s) seleccionado(s)';
      }
    }

    function resetShippingZoneForm(closeModal = true) {
      document.getElementById('shEditId').value = '';
      document.getElementById('shFormTitle').textContent = 'Crear nueva zona de envío';
      document.getElementById('shSubmitBtn').textContent = 'Crear zona de envío';
      document.getElementById('shCancelBtn').style.display = 'none';
      document.getElementById('newShippingZoneForm').reset();
      document.getElementById('shType').value = 'city';
      document.getElementById('shAllowsCod').value = '1';
      document.getElementById('shIsActive').value = '1';
      onShippingTypeChange();
      updateSelectedLocationsCount();
      const msg = document.getElementById('shMsg');
      if (msg) msg.textContent = '';
      if (closeModal) closeShippingZoneModal();
    }

    document.addEventListener('DOMContentLoaded', () => {
      const locationPager = document.getElementById('shipping-locations-pagination');
      locationPager?.querySelector('[data-page-direction="previous"]')?.addEventListener('click', () => loadShippingDirectory(Math.max(1, shippingDirectoryPage - 1)));
      locationPager?.querySelector('[data-page-direction="next"]')?.addEventListener('click', () => loadShippingDirectory(shippingDirectoryPage + 1));
      const locSelect = document.getElementById('shLocationsSelect');
      if (locSelect) {
        locSelect.addEventListener('change', updateSelectedLocationsCount);
      }

      const form = document.getElementById('newShippingZoneForm');
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('shMsg');
        msg.className = 'msg';
        msg.textContent = 'Guardando zona de envío...';

        const editId = document.getElementById('shEditId').value.trim();
        const name = document.getElementById('shName').value.trim();
        const type = document.getElementById('shType').value;
        const priceCop = window.readCopPesos('shPrice') || 0;
        const priceInCents = Math.round(priceCop * 100);
        const minEstimatedDays = Number(document.getElementById('shMinDays').value) || 1;
        const maxEstimatedDays = Number(document.getElementById('shMaxDays').value) || 3;
        const allowsCashOnDelivery = document.getElementById('shAllowsCod').value === '1';
        const isActive = document.getElementById('shIsActive').value === '1';

        const locSelect = document.getElementById('shLocationsSelect');
        const locations = type === 'national' ? [] : Array.from(locSelect.selectedOptions).map(opt => opt.value);

        const payload = {
          name,
          type,
          priceInCents,
          minEstimatedDays,
          maxEstimatedDays,
          allowsCashOnDelivery,
          isActive,
          locations,
        };

        try {
          const url = editId ? '/api/v1/admin/shipping/zones/' + editId : '/api/v1/admin/shipping/zones';
          const method = editId ? 'PUT' : 'POST';

          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          if (!res.ok) {
            msg.className = 'msg msg-error';
            msg.textContent = data.error || 'Error al guardar la zona de envío';
            return;
          }

          msg.className = 'msg msg-success';
          msg.textContent = editId ? '¡Zona de envío actualizada con éxito!' : '¡Zona de envío creada con éxito!';
          closeShippingZoneModal();
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          msg.className = 'msg msg-error';
          msg.textContent = 'Error de conexión al guardar';
        }
      });
    });
  `;
}
