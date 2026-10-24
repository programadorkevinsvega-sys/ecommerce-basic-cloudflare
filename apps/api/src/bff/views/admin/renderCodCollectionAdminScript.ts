export function renderCodCollectionAdminScript(): string {
  return `
    let _adminCodEligibleOrders = [];
    let codCandidatePage = 1;
    let codCandidateHasMore = false;
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
    async function loadCodEligibleOrders(page = codCandidatePage) {
      codCandidatePage = page;
      const select = document.getElementById('cod-order-id'); if (!select) return;
      select.innerHTML = '<option value="">Cargando entregas…</option>';
      try {
        const response = await fetch('/api/v1/admin/payments/cod/local-deliveries?page=' + page + '&pageSize=25', { headers: adminHeaders(), cache: 'no-store' });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron consultar las entregas');
        _adminCodEligibleOrders = data.items || [];
        codCandidateHasMore = Boolean(data.hasMore);
        select.innerHTML = '<option value="">Selecciona una entrega local</option>' + _adminCodEligibleOrders.map((order) => '<option value="' + escapeHtml(order.orderId) + '">' + escapeHtml(order.orderId + ' · ' + order.customerName + ' · ' + order.customerPhone + ' · ' + order.municipality + ' · $' + Math.round(order.totalCents / 100).toLocaleString('es-CO')) + '</option>').join('');
        if (!_adminCodEligibleOrders.length) select.innerHTML = '<option value="">No hay entregas locales pendientes de recaudo</option>';
        document.getElementById('cod-order-page').textContent = 'Página ' + data.page + ' · ' + data.total + ' pendientes';
        document.getElementById('cod-order-prev').disabled = data.page <= 1;
        document.getElementById('cod-order-next').disabled = !data.hasMore;
      } catch (error) { select.innerHTML = '<option value="">' + escapeHtml(error.message || 'No se pudieron cargar las entregas') + '</option>'; }
    }
    document.getElementById('cod-order-prev')?.addEventListener('click', () => loadCodEligibleOrders(codCandidatePage - 1));
    document.getElementById('cod-order-next')?.addEventListener('click', () => codCandidateHasMore && loadCodEligibleOrders(codCandidatePage + 1));
    function selectCodCollectionOrder() {
      const selected = _adminCodEligibleOrders.find((order) => order.orderId === document.getElementById('cod-order-id')?.value);
      if (!selected) { document.getElementById('cod-amount').value = ''; document.getElementById('cod-receipt').value = ''; return; }
      document.getElementById('cod-amount').value = Math.round(selected.totalCents / 100).toLocaleString('es-CO');
      document.getElementById('cod-receipt').value = selected.receiptReference;
    }
  `;
}
