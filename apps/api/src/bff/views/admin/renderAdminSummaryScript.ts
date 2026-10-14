export function renderAdminSummaryScript(): string {
  return `
    let summaryOrders = [];
    let summaryInventoryAlerts = 0;
    let summaryUnreconciled = 0;
    async function loadAdminSummaryOrders() {
      const body = document.getElementById('summary-orders-body');
      if (!body) return;
      try {
        const response = await fetch('/api/v1/admin/orders', { headers: adminHeaders() });
        if (response.status === 403) throw new Error('No tienes permiso para consultar pedidos.');
        if (!response.ok) throw new Error('No fue posible consultar los pedidos.');
        const result = await response.json();
        summaryOrders = Array.isArray(result.orders) ? result.orders : [];
        const pending = document.getElementById('orders-pending-count');
        if (pending) pending.textContent = String(summaryOrders.filter(order => order.status === 'placed').length);
        renderAdminSummary();
        loadAdminPaymentAttention();
      } catch (error) {
        body.innerHTML = '<tr><td colspan="6" class="summary-empty">' + escapeHtml(error.message || 'No fue posible cargar los pedidos.') + '</td></tr>';
      }
    }

    function renderAdminSummary() {
      const days = Number(document.getElementById('summary-range')?.value || 30);
      const cutoff = Date.now() - days * 86400000;
      const orders = summaryOrders.filter(order => Date.parse(order.createdAt) >= cutoff && Date.parse(order.createdAt) <= Date.now());
      const paid = orders.filter(isSummaryPaid);
      const sales = paid.reduce((sum, order) => sum + Number(order.totalCents || 0), 0);
      document.getElementById('summary-sales').textContent = formatSummaryMoney(sales);
      document.getElementById('summary-orders-count').textContent = orders.length.toLocaleString('es-CO');
      document.getElementById('summary-average-ticket').textContent = formatSummaryMoney(paid.length ? Math.round(sales / paid.length) : 0);
      document.getElementById('summary-paid-rate').textContent = (orders.length ? Math.round(paid.length * 100 / orders.length) : 0) + '%';
      document.getElementById('summary-status-total').textContent = orders.length.toLocaleString('es-CO') + ' pedidos en el periodo';
      document.getElementById('summary-date-caption').textContent = 'Datos disponibles · últimos ' + days + ' días · máximo 100 pedidos consultados';
      renderSummaryChart(paid, days);
      renderSummaryStatuses(orders);
      renderSummaryRecentOrders(orders);
      renderSummaryAttention(orders);
    }

    function isSummaryPaid(order) { return order.paymentStatus === 'approved' || order.paymentStatus === 'collected'; }
    function filterAdminSummary() { renderAdminSummary(); }
    function renderSummaryRecentOrders(orders) {
      const body = document.getElementById('summary-orders-body');
      const query = normalizeSummarySearch(document.getElementById('summary-search')?.value || '');
      const rows = orders.filter(order => !query || normalizeSummarySearch([order.id, order.customerName, order.customerEmail, order.customerPhone, order.shippingAddress?.municipality, ...(order.lines || []).map(line => line.productSku)].join(' ')).includes(query)).slice(0, 6);
      if (!rows.length) { body.innerHTML = '<tr><td colspan="6" class="summary-empty">No hay pedidos para los filtros seleccionados.</td></tr>'; return; }
      body.innerHTML = rows.map(order => {
        const address = order.shippingAddress || {};
        const status = summaryOrderStatus(order.status);
        return '<tr><td><code>#' + escapeHtml(String(order.id).replace('ord-', '')) + '</code></td>' +
          '<td><strong>' + escapeHtml(order.customerName || 'Cliente') + '</strong></td>' +
          '<td>' + escapeHtml([address.municipality, address.department].filter(Boolean).join(', ') || '—') + '</td>' +
          '<td>' + (order.paymentMethod === 'wompi' ? 'Wompi' : 'Contra entrega') + '</td>' +
          '<td class="summary-order-total">' + formatSummaryMoney(order.totalCents) + '</td>' +
          '<td><span class="summary-status ' + status.className + '">' + escapeHtml(status.label) + '</span></td></tr>';
      }).join('');
    }

    function renderSummaryStatuses(orders) {
      const states = [['delivered', 'Entregados'], ['shipped', 'Enviados'], ['confirmed', 'Confirmados'], ['placed', 'Pendientes de pago'], ['cancelled', 'Cancelados']];
      const list = document.getElementById('summary-status-list');
      list.innerHTML = states.map(([key, label]) => {
        const count = orders.filter(order => order.status === key).length;
        const percent = orders.length ? Math.round(count * 100 / orders.length) : 0;
        return '<div class="summary-status-row"><div><span>' + label + '</span><strong>' + count + ' · ' + percent + '%</strong></div><span class="summary-status-track"><i class="state-' + key + '" style="width:' + percent + '%"></i></span></div>';
      }).join('');
    }

    function renderSummaryChart(paid, days) {
      const root = document.getElementById('summary-chart');
      const values = Array.from({ length: days }, (_, index) => {
        const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (days - index - 1));
        const key = date.toISOString().slice(0, 10);
        return { key, label: date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }), total: paid.filter(order => String(order.createdAt).slice(0, 10) === key).reduce((sum, order) => sum + Number(order.totalCents || 0), 0) };
      });
      const max = Math.max(1, ...values.map(item => item.total));
      const points = values.map((item, index) => ({ x: 12 + index * 696 / Math.max(1, values.length - 1), y: 202 - item.total / max * 170 }));
      const path = points.map((point, index) => (index ? 'L' : 'M') + point.x.toFixed(1) + ',' + point.y.toFixed(1)).join(' ');
      const area = path + ' L708,210 L12,210 Z';
      const labels = [0, Math.floor(days / 3), Math.floor(days * 2 / 3), days - 1].map(index => '<text x="' + points[index].x.toFixed(1) + '" y="242" text-anchor="middle">' + values[index].label + '</text>').join('');
      const average = Math.round(values.reduce((sum, item) => sum + item.total, 0) / days);
      document.getElementById('summary-daily-average').textContent = 'Promedio diario ' + formatSummaryMoney(average);
      root.innerHTML = '<svg viewBox="0 0 720 255" preserveAspectRatio="none" aria-hidden="true"><path class="summary-chart-area" d="' + area + '"></path><path class="summary-chart-line" d="' + path + '"></path><line x1="12" y1="32" x2="708" y2="32"></line><line x1="12" y1="88" x2="708" y2="88"></line><line x1="12" y1="145" x2="708" y2="145"></line><line x1="12" y1="210" x2="708" y2="210"></line>' + labels + '</svg>';
    }

    function renderSummaryAttention(orders) {
      const root = document.getElementById('summary-attention-list');
      const needsDispatch = orders.filter(order => order.status === 'placed').length;
      const expiring = Number(root.dataset.expiringBanners || 0);
      const items = [
        [needsDispatch, 'Pedidos sin despachar', 'Pedidos por atender', 'orders', 'orders'],
        [summaryUnreconciled, 'Pagos de Wompi por conciliar', 'Pagos aprobados sin liquidación registrada', 'payments', 'payments'],
        [summaryInventoryAlerts, 'Productos con stock bajo', 'Menos de 10 unidades disponibles', 'inventory', 'inventory'],
        [expiring, 'Banner por vencer', 'Finaliza en los próximos 3 días', 'storefront', 'storefront'],
      ];
      root.innerHTML = items.map(([count, title, note, tab, kind]) => '<button type="button" class="summary-attention-item" data-summary-tab="' + tab + '"><span class="summary-attention-count ' + (Number(count) ? 'attention-' + kind : 'attention-none') + '">' + Number(count) + '</span><span><strong>' + title + '</strong><small>' + note + '</small></span><span aria-hidden="true">›</span></button>').join('');
    }

    async function loadAdminPaymentAttention() {
      try {
        const response = await fetch('/api/v1/admin/payments', { headers: adminHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        const known = new Set((data.settlementCosts || []).map(row => row.orderId));
        summaryUnreconciled = summaryOrders.filter(order => order.paymentMethod === 'wompi' && order.paymentStatus === 'approved' && !known.has(order.id)).length;
        renderAdminSummary();
      } catch { /* La alerta de pagos queda sin datos si el permiso no está habilitado. */ }
    }

    async function loadAdminInventoryAlertCount() {
      try {
        const response = await fetch('/api/v1/admin/inventory', { headers: adminHeaders() });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.items)) return;
        summaryInventoryAlerts = result.items.filter(item => Number(item.availableQuantity ?? (item.quantity - item.reservedQuantity)) < 10).length;
        renderAdminSummary();
      } catch { /* El panel conserva los demás indicadores si inventario no está disponible. */ }
    }

    function exportAdminSummary() {
      const days = Number(document.getElementById('summary-range')?.value || 30);
      const cutoff = Date.now() - days * 86400000;
      const rows = summaryOrders.filter(order => Date.parse(order.createdAt) >= cutoff);
      const csv = [['Pedido', 'Fecha', 'Cliente', 'Correo', 'Ciudad', 'Método de pago', 'Total COP', 'Estado', 'Estado de pago'], ...rows.map(order => [order.id, order.createdAt, order.customerName, order.customerEmail, order.shippingAddress?.municipality, order.paymentMethod, Math.round(Number(order.totalCents || 0) / 100), order.status, order.paymentStatus])];
      const content = '\ufeff' + csv.map(row => row.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\\r\\n');
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); link.download = 'resumen-pedidos.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    function normalizeSummarySearch(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
    function summaryOrderStatus(status) {
      const values = { placed: ['Pendiente', 'neutral'], confirmed: ['Confirmado', 'success'], shipped: ['Enviado', 'info'], delivered: ['Entregado', 'success'], cancelled: ['Cancelado', 'danger'] };
      const current = values[status] || [status || 'En proceso', 'neutral'];
      return { label: current[0], className: current[1] };
    }
    function formatSummaryMoney(cents) { const amount = Number(cents); return Number.isSafeInteger(amount) ? '$' + (amount / 100).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : '—'; }
    window.filterAdminSummary = filterAdminSummary;
    window.exportAdminSummary = exportAdminSummary;
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelector('.admin-main')?.classList.add('summary-page-active');
      document.getElementById('summary-attention-list')?.addEventListener('click', event => {
        const button = event.target.closest('[data-summary-tab]');
        if (button) switchTab(button.dataset.summaryTab);
      });
      loadAdminSummaryOrders(); loadAdminInventoryAlertCount();
    });
  `;
}
