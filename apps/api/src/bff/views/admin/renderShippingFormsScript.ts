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

    function filterShippingLocations() {
      const query = (document.getElementById('shLocSearch').value || '').toLowerCase().trim();
      const select = document.getElementById('shLocationsSelect');
      const options = select.options;
      for (let i = 0; i < options.length; i++) {
        const text = options[i].text.toLowerCase();
        options[i].style.display = text.includes(query) ? '' : 'none';
      }
    }

    function updateSelectedLocationsCount() {
      const select = document.getElementById('shLocationsSelect');
      const count = Array.from(select.selectedOptions).length;
      const label = document.getElementById('shSelectedCount');
      if (label) {
        label.textContent = count + ' municipio(s) seleccionado(s)';
      }
    }

    function resetShippingZoneForm() {
      document.getElementById('shEditId').value = '';
      document.getElementById('shFormTitle').textContent = 'Crear Nueva Zona de Envío';
      document.getElementById('shSubmitBtn').textContent = 'Crear Zona de Envío';
      document.getElementById('shCancelBtn').style.display = 'none';
      document.getElementById('newShippingZoneForm').reset();
      document.getElementById('shType').value = 'city';
      document.getElementById('shAllowsCod').value = '1';
      document.getElementById('shIsActive').value = '1';
      onShippingTypeChange();
      updateSelectedLocationsCount();
      const msg = document.getElementById('shMsg');
      if (msg) msg.textContent = '';
    }

    document.addEventListener('DOMContentLoaded', () => {
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
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          msg.className = 'msg msg-error';
          msg.textContent = 'Error de conexión al guardar';
        }
      });
    });
  `;
}
