export function renderShippingLocationDetailsScript(): string {
  return `
    function viewShippingLocation(button) {
      const dialog = document.getElementById('shipping-location-detail');
      if (!dialog) return;
      document.getElementById('shipping-detail-name').textContent = button.dataset.name || '';
      document.getElementById('shipping-detail-department').textContent = button.dataset.department || '';
      document.getElementById('shipping-detail-code').textContent = button.dataset.code || '';
      document.getElementById('shipping-detail-type').textContent = button.dataset.type || 'Municipio';
      dialog.showModal();
    }
  `;
}
