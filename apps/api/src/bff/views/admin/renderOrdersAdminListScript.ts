export function renderOrdersAdminListScript(): string {
  return `
    let activeOrderStatus = 'all';
    const orderStates = {
      placed: ['Recibido', '#eef0f4', '#3e4656'], confirmed: ['Confirmado', '#eaf0fd', '#1c3fa8'],
      shipped: ['Enviado', '#e3f1f6', '#0b566f'], delivered: ['Entregado', '#e6f4ec', '#136b3e'],
      cancelled: ['Cancelado', '#fbe9e7', '#a8231b'],
    };
    const paymentStates = {
      approved: ['Aprobado', '#e6f4ec', '#136b3e'], pending: ['Pendiente', '#fcf1dc', '#7a4f00'],
      collected: ['Recaudado', '#e6f4ec', '#136b3e'], failed: ['Fallido', '#fbe9e7', '#a8231b'],
    };

    function filteredAdminOrders() {
      const query = (document.getElementById('orders-search')?.value || '').trim().toLowerCase();
      const method = document.getElementById('orders-method-filter')?.value || 'all';
      const payment = document.getElementById('orders-payment-filter')?.value || 'all';
      return (window._adminOrdersList || []).filter(order => {
        const id = String(order.id || '');
        const matchesQuery = !query || [id, order.customerName, order.customerPhone].join(' ').toLowerCase().includes(query);
        const orderMethod = order.paymentMethod === 'wompi' ? 'wompi' : 'cod';
        return matchesQuery && (activeOrderStatus === 'all' || order.status === activeOrderStatus) &&
          (method === 'all' || method === orderMethod) && (payment === 'all' || payment === order.paymentStatus);
      });
    }

    function renderAdminOrdersTable() {
      const orders = window._adminOrdersList || [];
      document.querySelectorAll('[data-orders-count]').forEach(node => {
        const status = node.dataset.ordersCount;
        node.textContent = String(status === 'all' ? orders.length : orders.filter(order => order.status === status).length);
      });
      const visible = filteredAdminOrders();
      const body = document.getElementById('orders-table-body');
      const region = document.getElementById('orders-table-region');
      const empty = document.getElementById('orders-empty');
      if (!body || !region || !empty) return;
      region.hidden = visible.length === 0;
      empty.hidden = visible.length !== 0;
      body.innerHTML = visible.map(renderAdminOrderRow).join('');
      const sum = visible.reduce((total, order) => total + Number(order.totalCents || 0), 0);
      document.getElementById('orders-summary').innerHTML = '<span>Mostrando ' + visible.length + ' de ' + orders.length + ' pedidos cargados</span>' +
        '<span>Total mostrado <strong>' + orderMoney(sum) + '</strong></span>';
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
      const options = [['placed', 'Recibido'], ['confirmed', 'Confirmado'], ['shipped', 'Enviado'], ['delivered', 'Entregado'], ['cancelled', 'Cancelado']];
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
      document.querySelectorAll('[data-orders-status]').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('selected', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });
      renderAdminOrdersTable();
    }));
    ['orders-search', 'orders-method-filter', 'orders-payment-filter'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', renderAdminOrdersTable);
      document.getElementById(id)?.addEventListener('change', renderAdminOrdersTable);
    });
    document.getElementById('orders-refresh')?.addEventListener('click', loadAdminOrders);
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
