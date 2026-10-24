export function renderOrdersAdminListScript(): string {
  return `
    let activeOrderStatus = 'all';
    const orderStates = {
      placed: ['Recibido', '#eef0f4', '#3e4656'], confirmed: ['Confirmado', '#e9efe9', '#315b43'],
      prepared: ['Preparado', '#edf2e9', '#315b43'], shipped: ['Enviado', '#e8f2ed', '#315b43'], delivered: ['Entregado', '#e6f4ec', '#136b3e'],
      cancelled: ['Cancelado', '#fbe9e7', '#a8231b'],
    };
    const paymentStates = {
      approved: ['Aprobado', '#e9efe9', '#315b43'], pending: ['Pendiente', '#fcf1dc', '#7a4f00'],
      collected: ['Recaudado', '#e6f4ec', '#136b3e'], failed: ['Fallido', '#fbe9e7', '#a8231b'],
    };

    function filteredAdminOrders() {
      return window._adminOrdersList || [];
    }

    function renderAdminOrdersTable() {
      const orders = window._adminOrdersList || [];
      const meta = window._adminOrdersMeta || {};
      const counts = meta.statusCounts || {};
      document.querySelectorAll('[data-orders-count]').forEach(node => {
        const status = node.dataset.ordersCount;
        node.textContent = String(status === 'all' ? Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0) : Number(counts[status] || 0));
      });
      const pendingCount = document.getElementById('orders-pending-count');
      if (pendingCount) pendingCount.textContent = String(Number(counts.placed || 0));
      const visible = filteredAdminOrders();
      const body = document.getElementById('orders-table-body');
      const region = document.getElementById('orders-table-region');
      const empty = document.getElementById('orders-empty');
      if (!body || !region || !empty) return;
      region.hidden = false;
      empty.hidden = visible.length !== 0 && Number(meta.total || 0) === 0;
      body.innerHTML = visible.length ? visible.map(renderAdminOrderRow).join('') : '<tr><td colspan="7" class="orders-loading">No hay pedidos en esta página.</td></tr>';
      const sum = visible.reduce((total, order) => total + Number(order.totalCents || 0), 0);
      const first = Number(meta.total || 0) ? (Number(meta.page) - 1) * Number(meta.pageSize) + 1 : 0;
      const last = Math.min(Number(meta.page || 1) * Number(meta.pageSize || 25), Number(meta.total || 0));
      document.getElementById('orders-summary').innerHTML = '<span>' + first + '–' + last + ' de ' + Number(meta.total || 0) + ' pedidos</span>' +
        '<span>Total mostrado <strong>' + orderMoney(sum) + '</strong></span>';
      renderOrdersPagination(meta);
    }

    function renderOrdersPagination(meta) {
      const nav = document.getElementById('orders-pagination');
      if (!nav) return;
      const page = Number(meta.page || 1);
      nav.innerHTML = '<button type="button" class="orders-secondary-button" data-orders-page="previous">Anterior</button>' +
        '<span aria-live="polite">Página ' + page + (meta.hasMore ? '+' : '') + '</span>' +
        '<button type="button" class="orders-secondary-button" data-orders-page="next">Siguiente</button>';
      nav.querySelector('[data-orders-page="previous"]').disabled = page <= 1;
      nav.querySelector('[data-orders-page="next"]').disabled = !meta.hasMore;
      nav.querySelector('[data-orders-page="previous"]').onclick = () => loadAdminOrders(page - 1);
      nav.querySelector('[data-orders-page="next"]').onclick = () => loadAdminOrders(page + 1);
    }

    function renderAdminOrderRow(order) {
      const shortId = String(order.id).replace(/^ord-/, '');
      const state = orderStates[order.status] || [order.status || 'En proceso', '#eef0f4', '#3e4656'];
      const payment = paymentStates[order.paymentStatus] || [order.paymentStatus || 'Pendiente', '#eef0f4', '#3e4656'];
      const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO') : '—';
      const orderId = escapeHtml(JSON.stringify(String(order.id)));
      return '<tr><td><div class="orders-id-cell"><a href="#" onclick="openOrderDetailModal(' + orderId + '); return false">#' + escapeHtml(shortId) + '</a><small>' + escapeHtml(date) + '</small></div></td>' +
        '<td><div class="orders-client-cell"><strong>' + escapeHtml(order.customerName || 'Cliente') + '</strong><small>' + escapeHtml(order.customerPhone || '—') + '</small></div></td>' +
        '<td class="orders-align-right"><strong>' + orderMoney(order.totalCents) + '</strong></td>' +
        '<td>' + (order.paymentMethod === 'wompi' ? 'Wompi' : 'Contra entrega') + '</td>' +
        '<td><span class="orders-order-badge" style="background:' + state[1] + ';color:' + state[2] + '">' + escapeHtml(state[0]) + '</span></td>' +
        '<td><span class="orders-payment-badge" style="background:' + payment[1] + ';color:' + payment[2] + '">' + escapeHtml(payment[0]) + '</span></td>' +
        '<td><div class="orders-action-cell"><button class="orders-secondary-button" type="button" onclick="openOrderDetailModal(' + orderId + ')">Ver detalle<span class="sr-only"> del pedido ' + escapeHtml(shortId) + '</span></button>' +
        '<label class="sr-only" for="orders-status-' + escapeHtml(shortId) + '">Cambiar estado del pedido ' + escapeHtml(shortId) + '</label>' +
        '<select class="orders-status-select" id="orders-status-' + escapeHtml(shortId) + '" onchange="updateOrderStatus(' + orderId + ', this.value)">' + orderStatusOptions(order.status) + '</select></div></td></tr>';
    }

    function orderStatusOptions(current) {
      const options = [['placed', 'Recibido'], ['confirmed', 'Confirmado'], ['prepared', 'Preparado'], ['shipped', 'Enviado'], ['delivered', 'Entregado'], ['cancelled', 'Cancelado']];
      return options.map(([value, label]) => '<option value="' + value + '"' + (current === value ? ' selected' : '') + '>' + label + '</option>').join('');
    }

    function orderMoney(cents) {
      const amount = Number(cents);
      return Number.isSafeInteger(amount) ? '$' + (amount / 100).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : '—';
    }

    function exportFilteredAdminOrders() {
      const rows = [['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Total COP', 'Método', 'Estado', 'Pago']];
      filteredAdminOrders().forEach(order => rows.push([
        order.id, order.createdAt, order.customerName, order.customerPhone, Math.round(Number(order.totalCents || 0) / 100),
        order.paymentMethod, order.status, order.paymentStatus,
      ].map(csvOrderCell)));
      const blob = new Blob(['\ufeff' + rows.map(row => row.join(',')).join('\\r\\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'pedidos.csv'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function csvOrderCell(value) {
      let text = String(value ?? '');
      if (/^[=+@\\t\\r-]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }

    document.querySelectorAll('[data-orders-status]').forEach(button => button.addEventListener('click', () => {
      activeOrderStatus = button.dataset.ordersStatus;
      window._adminOrdersPage = 1;
      document.querySelectorAll('[data-orders-status]').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('selected', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });
      loadAdminOrders(1);
    }));
    let orderSearchTimer;
    document.getElementById('orders-search')?.addEventListener('input', () => { clearTimeout(orderSearchTimer); orderSearchTimer = setTimeout(() => loadAdminOrders(1), 250); });
    ['orders-method-filter', 'orders-payment-filter'].forEach(id => document.getElementById(id)?.addEventListener('change', () => loadAdminOrders(1)));
    document.getElementById('orders-export')?.addEventListener('click', exportFilteredAdminOrders);
    document.getElementById('orders-reset-filters')?.addEventListener('click', () => {
      activeOrderStatus = 'all';
      document.getElementById('orders-search').value = '';
      document.getElementById('orders-method-filter').value = 'all';
      document.getElementById('orders-payment-filter').value = 'all';
      document.querySelector('[data-orders-status="all"]')?.click();
    });
    window.renderAdminOrdersTable = renderAdminOrdersTable;
  `;
}
