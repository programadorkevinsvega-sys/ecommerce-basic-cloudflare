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
      document.getElementById('shipping-detail-zones').textContent = zones.map((zone) =>
        zone.name + ' · ' + (zone.priceInCents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) +
        ' · ' + zone.minEstimatedDays + '–' + zone.maxEstimatedDays + ' días · Contra entrega: ' + (zone.allowsCashOnDelivery ? 'sí' : 'no') +
        ' · ' + (zone.isActive ? 'Activa' : 'Inactiva') + ' · Municipios DANE: ' + (zone.locations || []).join(', ')
      ).join('\n') || 'Sin zona local activa';
      dialog.showModal();
    }
  `;
}
