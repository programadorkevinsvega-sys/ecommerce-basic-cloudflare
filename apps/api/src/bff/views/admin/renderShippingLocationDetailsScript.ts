export function renderShippingLocationDetailsScript(): string {
  return `
    function viewShippingLocation(button) {
      const dialog = document.getElementById('shipping-location-detail');
      if (!dialog) return;
      document.getElementById('shipping-detail-name').textContent = button.dataset.name || '';
      document.getElementById('shipping-detail-department').textContent = button.dataset.department || '';
      document.getElementById('shipping-detail-code').textContent = button.dataset.code || '';
      document.getElementById('shipping-detail-type').textContent = button.dataset.type || 'Municipio';
      const zones = JSON.parse(decodeURIComponent(button.dataset.zones || '%5B%5D'));
      const details = zones.map((zone) => {
        const price = (zone.priceInCents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        const codes = (zone.locations || []).map((code) => '<code>' + escapeHtml(code) + '</code>').join(' ');
        return '<article class="shipping-location-zone"><h3>' + escapeHtml(zone.name) + '</h3><dl>' +
          '<div><dt>Tipo de zona</dt><dd>' + escapeHtml(zone.type) + '</dd></div>' +
          '<div><dt>Tarifa de envío</dt><dd class="shipping-detail-price">' + price + ' COP</dd></div>' +
          '<div><dt>Plazo</dt><dd>' + zone.minEstimatedDays + '–' + zone.maxEstimatedDays + ' días hábiles</dd></div>' +
          '<div><dt>Pago contra entrega</dt><dd>' + (zone.allowsCashOnDelivery ? 'Permitido' : 'No permitido · Pago anticipado') + '</dd></div>' +
          '<div><dt>Estado</dt><dd>' + (zone.isActive ? 'Activa' : 'Inactiva') + '</dd></div>' +
          '<div><dt>Municipios DANE</dt><dd>' + (codes || '—') + '</dd></div></dl></article>';
      }).join('') || '<p>Este municipio no tiene una zona local asignada.</p>';
      document.getElementById('shipping-detail-zones').innerHTML = details;
      dialog.showModal();
    }
  `;
}
