export function renderAdminSummaryScript(): string {
  return `
    async function loadAdminSummaryOrders() {
      const body = document.getElementById('summary-orders-body');
      if (!body) return;
      try {
        const response = await fetch('/api/v1/admin/orders', { headers: adminHeaders() });
        if (response.status === 403) throw new Error('No tienes permiso para consultar pedidos.');
        if (!response.ok) throw new Error('No fue posible consultar los pedidos.');
        const result = await response.json();
        const orders = Array.isArray(result.orders) ? result.orders.slice(0, 6) : [];
        if (!orders.length) {
          body.innerHTML = '<tr><td colspan="6" class="summary-empty">Todavía no hay pedidos para mostrar.</td></tr>';
          return;
        }
        body.innerHTML = orders.map((order) => {
          const address = order.shippingAddress || {};
          const city = [address.municipality, address.department].filter(Boolean).join(', ') || '—';
          const status = summaryOrderStatus(order.status);
          return '<tr><td><code>#' + escapeHtml(String(order.id).replace('ord-', '')) + '</code></td>' +
            '<td><strong>' + escapeHtml(order.customerName || 'Cliente') + '</strong></td>' +
            '<td>' + escapeHtml(city) + '</td><td>' + (order.paymentMethod === 'wompi' ? 'Wompi' : 'Contra entrega') + '</td>' +
            '<td class="summary-order-total">' + formatSummaryMoney(order.totalCents) + '</td>' +
            '<td><span class="summary-status ' + status.className + '">' + escapeHtml(status.label) + '</span></td></tr>';
        }).join('');
      } catch (error) {
        body.innerHTML = '<tr><td colspan="6" class="summary-empty">' + escapeHtml(error.message || 'No fue posible cargar los pedidos.') + '</td></tr>';
      }
    }

    function summaryOrderStatus(status) {
      const values = {
        placed: ['Pendiente', 'neutral'], confirmed: ['Confirmado', 'success'], shipped: ['Enviado', 'info'],
        delivered: ['Entregado', 'success'], cancelled: ['Cancelado', 'danger'],
      };
      const current = values[status] || [status || 'En proceso', 'neutral'];
      return { label: current[0], className: current[1] };
    }

    function formatSummaryMoney(cents) {
      const amount = Number(cents);
      return Number.isSafeInteger(amount) ? '$' + (amount / 100).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : '—';
    }
    document.addEventListener('DOMContentLoaded', loadAdminSummaryOrders);
  `;
}
