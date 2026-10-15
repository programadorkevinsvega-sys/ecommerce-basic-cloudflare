export function renderCodCollectionAdminScript(): string {
  return `
    let _adminCodEligibleOrders = [];
    async function submitCodCollection() {
      const orderId = document.getElementById('cod-order-id').value;
      const amountInCents = window.copPesosToCents('cod-amount');
      const receipt = document.getElementById('cod-receipt').value.trim();
      if (!orderId || !amountInCents) return alert('Selecciona una entrega e indica el monto recibido.');
      const response = await fetch('/api/v1/admin/payments/cod/collect', { method: 'POST', headers: adminHeaders(true),
        body: JSON.stringify({ orderId, amountInCents, receiptNumber: receipt }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return alert(result.error || 'No se pudo registrar el recaudo');
      alert('¡Recaudo registrado con éxito!');
      document.getElementById('cod-order-id').value = '';
      document.getElementById('cod-amount').value = '';
      document.getElementById('cod-receipt').value = '';
      closeCodCollectionForm(); loadAdminPayments(); loadAdminOrders(); await loadCodEligibleOrders();
    }
    async function loadCodEligibleOrders() {
      const select = document.getElementById('cod-order-id'); if (!select) return;
      select.innerHTML = '<option value="">Cargando entregas…</option>';
      try {
        const response = await fetch('/api/v1/admin/payments/cod/local-deliveries?page=1&pageSize=50', { headers: adminHeaders() });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron consultar las entregas');
        _adminCodEligibleOrders = data.items || [];
        select.innerHTML = '<option value="">Selecciona una entrega local</option>' + _adminCodEligibleOrders.map((order) => '<option value="' + escapeHtml(order.orderId) + '">' + escapeHtml(order.orderId + ' · ' + order.customerName + ' · ' + order.customerPhone + ' · ' + order.municipality + ' · $' + Math.round(order.totalCents / 100).toLocaleString('es-CO')) + '</option>').join('');
        if (!_adminCodEligibleOrders.length) select.innerHTML = '<option value="">No hay entregas locales pendientes de recaudo</option>';
      } catch (error) { select.innerHTML = '<option value="">' + escapeHtml(error.message || 'No se pudieron cargar las entregas') + '</option>'; }
    }
    function selectCodCollectionOrder() {
      const selected = _adminCodEligibleOrders.find((order) => order.orderId === document.getElementById('cod-order-id')?.value);
      if (!selected) { document.getElementById('cod-amount').value = ''; document.getElementById('cod-receipt').value = ''; return; }
      document.getElementById('cod-amount').value = Math.round(selected.totalCents / 100).toLocaleString('es-CO');
      document.getElementById('cod-receipt').value = selected.receiptReference;
    }
  `;
}
