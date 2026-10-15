export function renderShippingHandlersScript(): string {
  return `
    function parseShippingItemData(btn) {
      const raw = btn.getAttribute('data-item');
      if (!raw) return null;
      try {
        return JSON.parse(decodeURIComponent(raw));
      } catch (e) {
        console.error('No fue posible interpretar los datos de la zona de envío');
        return null;
      }
    }

    function viewShippingZoneModal(btn) {
      const data = parseShippingItemData(btn);
      if (!data) return;

      document.getElementById('modalShTitle').textContent = 'Zona: ' + data.name;
      const formattedPrice = (data.priceInCents / 100).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      });

      const typeLabel = {
        national: 'Nacional (Todo el país)',
        department: 'Departamento',
        city: 'Ciudad / Área Metropolitana',
        municipality: 'Municipio Específico'
      }[data.type] || data.type;

      const localMunicipalities = {
        '05001': 'Medellín', '05079': 'Barbosa', '05088': 'Bello', '05129': 'Caldas',
        '05212': 'Copacabana', '05266': 'Envigado', '05308': 'Girardota', '05360': 'Itagüí',
        '05380': 'La Estrella', '05631': 'Sabaneta'
      };
      const coverage = data.type === 'national'
        ? '<p class="shipping-detail-coverage">Cobertura nacional</p>'
        : (data.locations || []).map((code) => '<span>' + escapeHtml(localMunicipalities[code] || 'Municipio') + ' <code>' + escapeHtml(code) + '</code></span>').join('') || '<em>Sin municipios asignados</em>';

      document.getElementById('modalShContent').innerHTML = [
        '<dl class="shipping-zone-details">',
        '<div><dt>Identificador</dt><dd><code>' + escapeHtml(data.id) + '</code></dd></div>',
        '<div><dt>Tipo de zona</dt><dd>' + escapeHtml(typeLabel) + '</dd></div>',
        '<div><dt>Tarifa de envío</dt><dd class="shipping-detail-price">' + formattedPrice + ' COP</dd></div>',
        '<div><dt>Plazo estimado</dt><dd>' + data.minEstimatedDays + '–' + data.maxEstimatedDays + ' días hábiles</dd></div>',
        '<div><dt>Pago contra entrega</dt><dd>' + (data.allowsCashOnDelivery ? 'Permitido' : 'No permitido · Pago anticipado') + '</dd></div>',
        '<div><dt>Estado</dt><dd><span class="shipping-badge ' + (data.isActive ? 'active' : 'inactive') + '">' + (data.isActive ? 'Activa' : 'Inactiva') + '</span></dd></div>',
        '<div class="shipping-zone-coverage"><dt>Municipios cubiertos (' + (data.locations || []).length + ')</dt><dd><div class="shipping-detail-coverage">' + coverage + '</div></dd></div>',
        '</dl>'
      ].join('');

      document.getElementById('shippingDetailsModal').style.display = 'flex';
    }

    function closeShippingDetailsModal() {
      document.getElementById('shippingDetailsModal').style.display = 'none';
    }

    function editShippingZoneModal(btn) {
      const data = parseShippingItemData(btn);
      if (!data) return;

      document.getElementById('shEditId').value = data.id;
      document.getElementById('shName').value = data.name;
      document.getElementById('shType').value = data.type;
      window.setCopInputValue('shPrice', Math.round(data.priceInCents / 100));
      document.getElementById('shMinDays').value = data.minEstimatedDays;
      document.getElementById('shMaxDays').value = data.maxEstimatedDays;
      document.getElementById('shAllowsCod').value = data.allowsCashOnDelivery ? '1' : '0';
      document.getElementById('shIsActive').value = data.isActive ? '1' : '0';

      onShippingTypeChange();

      const locSelect = document.getElementById('shLocationsSelect');
      if (locSelect) {
        const assignedSet = new Set(data.locations || []);
        assignedSet.forEach((code) => window.ensureShippingOption(code));
        for (let i = 0; i < locSelect.options.length; i++) {
          locSelect.options[i].selected = assignedSet.has(locSelect.options[i].value);
        }
        updateSelectedLocationsCount();
      }

      document.getElementById('shFormTitle').textContent = 'Editar zona de envío';
      document.getElementById('shSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('shCancelBtn').style.display = 'inline-block';
      document.getElementById('shippingZoneModal').style.display = 'flex';
      window.focusShippingZoneDialog();
    }

    async function toggleShippingZoneStatus(id, activate) {
      try {
        const res = await fetch('/api/v1/admin/shipping/zones/' + id + '/toggle', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          location.reload();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al cambiar estado de zona');
        }
      } catch (err) {
        alert('Error de conexión');
      }
    }

    async function deleteShippingZone(id) {
      if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta zona de envío?')) {
        return;
      }
      try {
        const res = await fetch('/api/v1/admin/shipping/zones/' + id, {
          method: 'DELETE',
        });
        if (res.ok) {
          location.reload();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al eliminar zona');
        }
      } catch (err) {
        alert('Error de conexión');
      }
    }
    window.parseShippingItemData = parseShippingItemData;
    window.viewShippingZoneModal = viewShippingZoneModal;
    window.editShippingZoneModal = editShippingZoneModal;
    window.toggleShippingZoneStatus = toggleShippingZoneStatus;
    window.deleteShippingZone = deleteShippingZone;
  `;
}
