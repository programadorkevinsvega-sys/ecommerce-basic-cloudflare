export function renderPaymentsAdminScript(): string {
  return `
    let _adminPaymentTransactions = [];
    let _adminPaymentOrders = new Map();
    let _adminPaymentInvoices = new Map();

    async function loadAdminPayments() {
      const tbody = document.getElementById('payments-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/payments', { headers: adminHeaders() });
        const data = await res.json();
        if (!data.success) throw new Error('No se pudieron cargar pagos');
        _adminPaymentTransactions = data.transactions || [];
        const [orders, invoices] = await Promise.all([
          loadAdminPaymentLookup('/api/v1/admin/orders', 'orders'),
          loadAdminPaymentLookup('/api/v1/admin/invoices', 'invoices'),
        ]);
        _adminPaymentOrders = new Map(orders.map(order => [order.id, order]));
        _adminPaymentInvoices = new Map();
        invoices.forEach(invoice => { if (!_adminPaymentInvoices.has(invoice.orderId)) _adminPaymentInvoices.set(invoice.orderId, invoice); });
        renderAdminPaymentTransactions();
        const collectionsBody = document.getElementById('cod-collections-table-body');
        if (collectionsBody) collectionsBody.innerHTML = (data.collections || []).length
          ? data.collections.map(row => \`<tr><td><code>\${escapeHtml(row.orderId)}</code></td><td>\${escapeHtml(row.receiptNumber || '—')}</td><td class="payments-amount">$\${(Number(row.amountInCents)/100).toLocaleString('es-CO')}</td><td>\${escapeHtml(new Date(row.collectedAt || row.createdAt).toLocaleString('es-CO'))}</td><td>\${escapeHtml(row.collectedBy || '—')}</td></tr>\`).join('')
          : '<tr><td colspan="5" class="payments-empty-row">Aún no hay recaudos registrados</td></tr>';
        const settlementBody = document.getElementById('settlement-table-body');
        if (settlementBody) settlementBody.innerHTML = (data.settlementCosts || []).length
          ? data.settlementCosts.map(row => \`<tr><td><code>\${escapeHtml(row.orderId)}</code></td><td>$\${(Number(row.estimatedFeeCents)/100).toLocaleString('es-CO')}</td><td>$\${(Number(row.actualFeeCents)/100).toLocaleString('es-CO')}</td><td>$\${(Number(row.varianceCents)/100).toLocaleString('es-CO')}</td><td>\${escapeHtml(row.reportReference || '—')}</td></tr>\`).join('')
          : '<tr><td colspan="5" class="payments-empty-row">Aún no hay conciliaciones registradas</td></tr>';
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pagos</td></tr>';
      }
    }

    async function loadAdminPaymentLookup(url, key) {
      try {
        const response = await fetch(url, { headers: adminHeaders() });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data[key]) ? data[key] : [];
      } catch { return []; }
    }

    function renderAdminPaymentTransactions() {
      const tbody = document.getElementById('payments-table-body');
      if (!tbody) return;
      const query = normalizePaymentSearch(document.getElementById('payments-search')?.value || '');
      const digits = query.replace(/\\D/g, '');
      const rows = _adminPaymentTransactions.filter(transaction => {
        const order = _adminPaymentOrders.get(transaction.orderId) || {};
        const invoice = _adminPaymentInvoices.get(transaction.orderId) || {};
        const amount = Math.round(Number(transaction.amountInCents || 0) / 100);
        const exactAmount = (Number(transaction.amountInCents || 0) / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 });
        const haystack = normalizePaymentSearch([transaction.reference, transaction.orderId, invoice.invoiceNumber, order.customerName, order.customerEmail, amount.toLocaleString('es-CO'), exactAmount].join(' '));
        return !query || haystack.includes(query) || (digits.length > 0 && (String(amount).includes(digits) || exactAmount.replace(/\\D/g, '').includes(digits)));
      });
      tbody.innerHTML = rows.length ? rows.map(transaction => {
        const order = _adminPaymentOrders.get(transaction.orderId) || {};
        const invoice = _adminPaymentInvoices.get(transaction.orderId) || {};
        const amount = Math.round(Number(transaction.amountInCents || 0) / 100);
        return \`<tr><td><code>\${escapeHtml(transaction.reference || '—')}</code></td><td><strong class="invoice-number">\${escapeHtml(invoice.invoiceNumber || '—')}</strong></td><td><code>\${escapeHtml(transaction.orderId || '—')}</code></td><td><div class="invoice-client"><strong>\${escapeHtml(order.customerName || invoice.customerName || '—')}</strong><small>\${escapeHtml(order.customerEmail || invoice.customerEmail || '')}</small></div></td><td>\${escapeHtml(transaction.paymentMethod || '—')}</td><td class="payments-amount">$\${amount.toLocaleString('es-CO')}</td><td><span class="tag">\${escapeHtml(transaction.status || '—')}</span></td><td>\${escapeHtml(new Date(transaction.createdAt).toLocaleString('es-CO'))}</td></tr>\`;
      }).join('') : '<tr><td colspan="8" class="payments-empty-row">No hay transacciones que coincidan con la búsqueda</td></tr>';
    }

    function normalizePaymentSearch(value) {
      return String(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
    }

    function filterPaymentTransactions() { renderAdminPaymentTransactions(); }

    async function submitCodCollection() {
      const orderId = document.getElementById('cod-order-id').value.trim();
      const amountInCents = window.copPesosToCents('cod-amount');
      const receipt = document.getElementById('cod-receipt').value.trim();
      if (!orderId || !amountInCents) { alert('Por favor indica ID del pedido y monto en pesos colombianos.'); return; }
      const res = await fetch('/api/v1/admin/payments/cod/collect', {
        method: 'POST',
        headers: adminHeaders(true),
        body: JSON.stringify({ orderId, amountInCents, receiptNumber: receipt })
      });
      if (res.ok) {
        alert('¡Recaudo registrado con éxito!');
        document.getElementById('cod-order-id').value = '';
        document.getElementById('cod-amount').value = '';
        document.getElementById('cod-receipt').value = '';
        closeCodCollectionForm();
        loadAdminPayments();
        loadAdminOrders();
      } else {
        alert('Error al registrar recaudo');
      }
    }

    async function submitSettlementCost() {
      const orderId = document.getElementById('settlement-order-id').value.trim();
      const actualFeeCents = window.copPesosToCents('settlement-fee');
      const reportReference = document.getElementById('settlement-report-ref').value.trim();
      if (!orderId || !Number.isSafeInteger(actualFeeCents) || actualFeeCents < 0 || !reportReference) return alert('Ingresa pedido, comisión real y referencia del reporte.');
      const response = await fetch('/api/v1/admin/payments/' + encodeURIComponent(orderId) + '/settlement', { method: 'POST', headers: adminHeaders(true), body: JSON.stringify({ actualFeeCents, reportReference }) });
      if (!response.ok) return alert('No fue posible guardar la liquidación. Verifica el pedido y el permiso payments:edit.');
      document.getElementById('settlement-order-id').value = '';
      document.getElementById('settlement-fee').value = '';
      document.getElementById('settlement-report-ref').value = '';
      closeSettlementForm();
      await loadAdminPayments();
    }

    function openPaymentsModal(id, firstFieldId) {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.hidden = false;
      document.getElementById(firstFieldId)?.focus();
    }
    function closePaymentsModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.hidden = true;
    }
    function openCodCollectionForm() { openPaymentsModal('cod-collection-modal', 'cod-order-id'); }
    function closeCodCollectionForm() { closePaymentsModal('cod-collection-modal'); }
    function openSettlementForm() { openPaymentsModal('settlement-modal', 'settlement-order-id'); }
    function closeSettlementForm() { closePaymentsModal('settlement-modal'); }

    window.loadAdminPayments = loadAdminPayments;
    window.filterPaymentTransactions = filterPaymentTransactions;
    window.submitCodCollection = submitCodCollection;
    window.submitSettlementCost = submitSettlementCost;
    window.openCodCollectionForm = openCodCollectionForm;
    window.closeCodCollectionForm = closeCodCollectionForm;
    window.openSettlementForm = openSettlementForm;
    window.closeSettlementForm = closeSettlementForm;

    function showAdminPaymentPage(page) {
      document.querySelectorAll('[data-payment-panel]').forEach(panel => { panel.hidden = panel.dataset.paymentPanel !== page; });
    }
    window.showAdminPaymentPage = showAdminPaymentPage;

    let lastNotificationTime = new Date().toISOString();
    async function pollRealtimeNotifications() {
      try {
        const res = await fetch('/api/v1/realtime/notifications?channel=admin&since=' + encodeURIComponent(lastNotificationTime));
        const data = await res.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          lastNotificationTime = data.serverTime || new Date().toISOString();
          const badge = document.getElementById('notification-bell-badge');
          if (badge) {
            badge.style.display = 'inline-block';
            badge.innerText = data.notifications.length;
          }
          if (typeof loadAdminOrders === 'function') loadAdminOrders();
          if (typeof loadAdminInventory === 'function') loadAdminInventory();
        }
      } catch (e) {}
    }
    setInterval(pollRealtimeNotifications, 8000);
  `;
}
