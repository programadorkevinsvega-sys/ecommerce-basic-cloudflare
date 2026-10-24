import { renderPaymentRecordDetailsScript } from './renderPaymentRecordDetailsScript.js';
import { renderCodCollectionAdminScript } from './renderCodCollectionAdminScript.js';

export function renderPaymentsAdminScript(): string {
  return `
    let _adminPaymentTransactions = [];
    let _adminPaymentCollections = [];
    let _adminPaymentSettlements = [];
    let _adminPaymentOrders = new Map();
    let _adminPaymentInvoices = new Map();
    const _paymentPages = { transactions: 1, collections: 1, settlements: 1 };
    let _paymentMeta = {};

    async function loadAdminPayments(pageChanges = {}) {
      const tbody = document.getElementById('payments-table-body');
      if (!tbody) return;
      Object.assign(_paymentPages, pageChanges);
      try {
        const params = new URLSearchParams({ pageSize: '25', transactionsPage: String(_paymentPages.transactions),
          collectionsPage: String(_paymentPages.collections), settlementsPage: String(_paymentPages.settlements) });
        const query = document.getElementById('payments-search')?.value.trim() || '';
        if (query) params.set('q', query);
        const res = await fetch('/api/v1/admin/payments?' + params, { headers: adminHeaders(), cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'No se pudieron cargar pagos');
        _paymentMeta = data;
        _paymentPages.transactions = data.transactions.page;
        _paymentPages.collections = data.collections.page;
        _paymentPages.settlements = data.settlementCosts.page;
        _adminPaymentTransactions = data.transactions.items;
        _adminPaymentCollections = data.collections.items;
        _adminPaymentSettlements = data.settlementCosts.items;
        _adminPaymentOrders = new Map(data.details.map(item => [item.orderId, item.order || {}]));
        _adminPaymentInvoices = new Map();
        data.details.forEach(item => { if (item.invoice) _adminPaymentInvoices.set(item.orderId, item.invoice); });
        renderAdminPaymentTransactions();
        const collectionsBody = document.getElementById('cod-collections-table-body');
        if (collectionsBody) collectionsBody.innerHTML = _adminPaymentCollections.map(row => \`<tr><td><code>\${escapeHtml(row.orderId)}</code></td><td>\${escapeHtml(row.receiptNumber || '—')}</td><td class="payments-amount">$\${(Number(row.amountInCents)/100).toLocaleString('es-CO')}</td><td>\${escapeHtml(new Date(row.collectedAt || row.createdAt).toLocaleString('es-CO'))}</td><td>\${escapeHtml(row.collectedBy || '—')}</td><td><button class="payments-row-action" type="button" data-collection-id="\${escapeHtml(row.id)}" onclick="viewCodCollection(this)">Ver</button></td></tr>\`).join('') || '<tr><td colspan="6">No hay recaudos registrados.</td></tr>';
        renderPaymentPagination('collections', data.collections);
        const settlementBody = document.getElementById('settlement-table-body');
        if (settlementBody) settlementBody.innerHTML = _adminPaymentSettlements.map(row => \`<tr><td><code>\${escapeHtml(row.orderId)}</code>\${row.corrected ? '<small class="payments-corrected-label">Corregida</small>' : ''}</td><td>$\${(Number(row.estimatedFeeCents)/100).toLocaleString('es-CO')}</td><td>$\${(Number(row.actualFeeCents)/100).toLocaleString('es-CO')}</td><td>$\${(Number(row.varianceCents)/100).toLocaleString('es-CO')}</td><td>\${escapeHtml(row.reportReference || '—')}</td><td><div class="payments-row-actions"><button class="payments-row-action" type="button" data-settlement-order="\${escapeHtml(row.orderId)}" onclick="viewPaymentSettlement(this)">Ver</button><button class="payments-row-action" type="button" data-settlement-order="\${escapeHtml(row.orderId)}" onclick="openSettlementCorrection(this)">Corregir</button></div></td></tr>\`).join('') || '<tr><td colspan="6">Aún no hay conciliaciones registradas.</td></tr>';
        renderPaymentPagination('settlements', data.settlementCosts);
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pagos</td></tr>';
      }
    }

    function renderPaymentPagination(key, meta) {
      const nav = document.getElementById('payments-pagination-' + key);
      if (!nav) return;
      const from = meta.total ? (meta.page - 1) * meta.pageSize + 1 : 0;
      const to = Math.min(meta.page * meta.pageSize, meta.total);
      nav.innerHTML = '<button type="button" data-page="previous">Anterior</button><span aria-live="polite">' + from + '–' + to + ' de ' + meta.total + ' · Página ' + meta.page + '</span><button type="button" data-page="next">Siguiente</button>';
      nav.querySelector('[data-page="previous"]').disabled = meta.page <= 1;
      nav.querySelector('[data-page="next"]').disabled = !meta.hasMore;
      nav.querySelector('[data-page="previous"]').onclick = () => loadAdminPayments({ [key]: meta.page - 1 });
      nav.querySelector('[data-page="next"]').onclick = () => loadAdminPayments({ [key]: meta.page + 1 });
    }

    function renderAdminPaymentTransactions() {
      const tbody = document.getElementById('payments-table-body');
      if (!tbody) return;
      const rows = _adminPaymentTransactions;
      tbody.innerHTML = rows.map(transaction => {
        const order = _adminPaymentOrders.get(transaction.orderId) || {};
        const invoice = _adminPaymentInvoices.get(transaction.orderId) || {};
        const amount = Math.round(Number(transaction.amountInCents || 0) / 100);
        return \`<tr><td><code>\${escapeHtml(transaction.reference || '—')}</code></td><td><strong class="invoice-number">\${escapeHtml(invoice.invoiceNumber || '—')}</strong></td><td><code>\${escapeHtml(transaction.orderId || '—')}</code></td><td><div class="invoice-client"><strong>\${escapeHtml(order.customerName || invoice.customerName || '—')}</strong><small>\${escapeHtml(order.customerEmail || invoice.customerEmail || '')}</small></div></td><td>\${escapeHtml(transaction.paymentMethod || '—')}</td><td class="payments-amount">$\${amount.toLocaleString('es-CO')}</td><td><span class="payments-status-badge \${paymentStatusClass(transaction.status)}">\${escapeHtml(paymentStatusLabel(transaction.status))}</span></td><td>\${escapeHtml(new Date(transaction.createdAt).toLocaleString('es-CO'))}</td></tr>\`;
      }).join('') || '<tr><td colspan="8">No hay transacciones que coincidan con la búsqueda.</td></tr>';
      renderPaymentPagination('transactions', _paymentMeta.transactions);
    }

    function normalizePaymentSearch(value) {
      return String(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
    }

    ${renderPaymentRecordDetailsScript()}

    function paymentStatusClass(status) {
      const normalized = String(status || '').toLowerCase();
      if (normalized === 'approved' || normalized === 'collected') return 'success';
      if (normalized === 'pending') return 'pending';
      if (['declined', 'failed', 'error', 'voided', 'refunded'].includes(normalized)) return 'danger';
      return 'neutral';
    }

    function paymentStatusLabel(status) {
      const labels = { approved: 'Aprobado', collected: 'Recaudado', pending: 'Pendiente', declined: 'Rechazado', failed: 'Fallido', error: 'Error', voided: 'Anulado', refunded: 'Reintegrado' };
      const normalized = String(status || '').toLowerCase();
      return labels[normalized] || status || '—';
    }

    let paymentSearchTimer;
    function filterPaymentTransactions() { clearTimeout(paymentSearchTimer); paymentSearchTimer = setTimeout(() => loadAdminPayments({ transactions: 1 }), 250); }

    ${renderCodCollectionAdminScript()}

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

    function openSettlementCorrection(button) {
      const row = _adminPaymentSettlements.find(item => item.orderId === button.dataset.settlementOrder);
      if (!row) return;
      document.getElementById('settlement-correction-order').value = row.orderId;
      document.getElementById('settlement-correction-fee').value = String(Math.round(Number(row.actualFeeCents) / 100));
      document.getElementById('settlement-correction-reference').value = row.reportReference || '';
      document.getElementById('settlement-correction-reason').value = '';
      openPaymentsModal('settlement-correction-modal', 'settlement-correction-fee');
    }

    async function submitSettlementCorrection() {
      const orderId = document.getElementById('settlement-correction-order').value;
      const actualFeeCents = window.copPesosToCents('settlement-correction-fee');
      const reportReference = document.getElementById('settlement-correction-reference').value.trim();
      const reason = document.getElementById('settlement-correction-reason').value.trim();
      if (!reason || reason.length < 5) return alert('Explica el motivo de la corrección (mínimo 5 caracteres).');
      const response = await fetch('/api/v1/admin/payments/' + encodeURIComponent(orderId) + '/settlement/corrections', { method: 'POST', headers: adminHeaders(true), body: JSON.stringify({ actualFeeCents, reportReference, reason }) });
      if (!response.ok) return alert('No fue posible guardar la corrección. Verifica los datos y el permiso payments:edit.');
      closePaymentsModal('settlement-correction-modal');
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
    function openCodCollectionForm() { openPaymentsModal('cod-collection-modal', 'cod-order-id'); loadCodEligibleOrders(); }
    function closeCodCollectionForm() { closePaymentsModal('cod-collection-modal'); }
    function openSettlementForm() { openPaymentsModal('settlement-modal', 'settlement-order-id'); }
    function closeSettlementForm() { closePaymentsModal('settlement-modal'); }

    window.loadAdminPayments = loadAdminPayments;
    window.filterPaymentTransactions = filterPaymentTransactions;
    window.submitCodCollection = submitCodCollection;
    window.submitSettlementCost = submitSettlementCost;
    window.submitSettlementCorrection = submitSettlementCorrection;
    window.openSettlementCorrection = openSettlementCorrection;
    window.openCodCollectionForm = openCodCollectionForm;
    window.selectCodCollectionOrder = selectCodCollectionOrder;
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
