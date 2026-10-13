export function renderPaymentsAdminScript(): string {
  return `
    async function loadAdminPayments() {
      const tbody = document.getElementById('payments-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/payments', { headers: adminHeaders() });
        const data = await res.json();
        if (!data.success || !data.transactions || data.transactions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay transacciones registradas</td></tr>';
          return;
        }
        tbody.innerHTML = data.transactions.map(t => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;"><code>\${escapeHtml(t.reference)}</code></td>
            <td style="padding:0.75rem;"><code>\${escapeHtml(t.orderId?.slice(0,12) || '')}…</code></td>
            <td style="padding:0.75rem;">\${escapeHtml(t.paymentMethod)}</td>
            <td style="padding:0.75rem; font-weight:700;">$\${(Number(t.amountInCents)/100).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem;"><span class="tag">\${escapeHtml(t.status)}</span></td>
            <td style="padding:0.75rem; font-size:0.85rem; color:var(--muted);">\${escapeHtml(new Date(t.createdAt).toLocaleString('es-CO'))}</td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pagos</td></tr>';
      }
    }

    async function submitCodCollection() {
      const orderId = document.getElementById('cod-order-id').value.trim();
      const amount = parseInt(document.getElementById('cod-amount').value, 10);
      const receipt = document.getElementById('cod-receipt').value.trim();
      if (!orderId || !amount) { alert('Por favor indica ID de Pedido y Monto en Centavos'); return; }
      const res = await fetch('/api/v1/admin/payments/cod/collect', {
        method: 'POST',
        headers: adminHeaders(true),
        body: JSON.stringify({ orderId, amountInCents: amount, receiptNumber: receipt })
      });
      if (res.ok) {
        alert('¡Recaudo registrado con éxito!');
        document.getElementById('cod-order-id').value = '';
        document.getElementById('cod-amount').value = '';
        document.getElementById('cod-receipt').value = '';
        loadAdminPayments();
        loadAdminOrders();
      } else {
        alert('Error al registrar recaudo');
      }
    }

    window.loadAdminPayments = loadAdminPayments;
    window.submitCodCollection = submitCodCollection;

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
