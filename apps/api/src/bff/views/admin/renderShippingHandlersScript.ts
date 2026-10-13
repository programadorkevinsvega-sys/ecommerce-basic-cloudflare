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

      const locsHtml = data.type === 'national'
        ? '<em>Cobertura nacional estándar para todo Colombia</em>'
        : data.locations.length > 0
        ? '<code>' + data.locations.join(', ') + '</code> (' + data.locations.length + ' códigos DANE)'
        : '<em>Sin municipios asignados explícitamente</em>';

      document.getElementById('modalShContent').innerHTML = [
        '<p><strong>ID:</strong> <code>' + data.id + '</code></p>',
        '<p><strong>Tipo de Cobertura:</strong> ' + typeLabel + '</p>',
        '<p><strong>Tarifa de Envío:</strong> <span style="color:#38bdf8; font-weight:700;">' + formattedPrice + '</span></p>',
        '<p><strong>Plazo Estimado:</strong> ' + data.minEstimatedDays + ' a ' + data.maxEstimatedDays + ' días hábiles</p>',
        '<p><strong>Pago Contra Entrega:</strong> ' + (data.allowsCashOnDelivery ? '<span class="badge badge-published">✓ Permitido</span>' : '<span class="badge badge-draft">✕ Solo Pago Anticipado</span>') + '</p>',
        '<p><strong>Estado:</strong> ' + (data.isActive ? '<span class="badge badge-published">Activa</span>' : '<span class="badge badge-draft">Inactiva</span>') + '</p>',
        '<div style="margin-top:0.75rem;"><strong>Códigos DANE Cubiertos:</strong><div style="background:#0f172a; padding:0.5rem; border-radius:4px; margin-top:0.25rem; font-size:0.8rem; max-height:120px; overflow-y:auto;">' + locsHtml + '</div></div>'
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
      document.getElementById('shPrice').value = Math.round(data.priceInCents / 100);
      document.getElementById('shMinDays').value = data.minEstimatedDays;
      document.getElementById('shMaxDays').value = data.maxEstimatedDays;
      document.getElementById('shAllowsCod').value = data.allowsCashOnDelivery ? '1' : '0';
      document.getElementById('shIsActive').value = data.isActive ? '1' : '0';

      onShippingTypeChange();

      const locSelect = document.getElementById('shLocationsSelect');
      if (locSelect) {
        const assignedSet = new Set(data.locations || []);
        for (let i = 0; i < locSelect.options.length; i++) {
          locSelect.options[i].selected = assignedSet.has(locSelect.options[i].value);
        }
        updateSelectedLocationsCount();
      }

      document.getElementById('shFormTitle').textContent = 'Editar Zona de Envío (' + data.name + ')';
      document.getElementById('shSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('shCancelBtn').style.display = 'inline-block';

      document.getElementById('shFormTitle').scrollIntoView({ behavior: 'smooth' });
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
  `;
}
