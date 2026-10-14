export function renderOrdersAdminScript(): string {
  return `
    window._adminOrdersCache = {};
    let _activeModalOrderId = null;

    async function loadAdminOrders() {
      const tbody = document.getElementById('orders-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/orders', { headers: adminHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.orders)) throw new Error('No fue posible cargar los pedidos.');
        window._adminOrdersCache = {};
        window._adminOrdersList = data.orders;
        data.orders.forEach(o => { window._adminOrdersCache[o.id] = o; });
        window.renderAdminOrdersTable();
      } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="orders-loading">' + escapeHtml(error.message || 'Error al cargar pedidos') + '</td></tr>';
      }
    }

    function openOrderDetailModal(orderId) {
      const order = window._adminOrdersCache[orderId];
      if (!order) return;
      _activeModalOrderId = orderId;

      document.getElementById('modal-order-id').innerText = '#' + order.id;
      document.getElementById('modal-order-date').innerText = new Date(order.createdAt).toLocaleString('es-CO');
      
      const stEl = document.getElementById('modal-order-status');
      stEl.innerText = order.status;
      const orderState = orderStates[order.status] || ['En proceso', '#eef0f4', '#3e4656'];
      stEl.style.background = orderState[1];
      stEl.style.color = orderState[2];

      const payEl = document.getElementById('modal-payment-status');
      payEl.innerText = order.paymentStatus;
      const paymentState = paymentStates[order.paymentStatus] || ['Pendiente', '#eef0f4', '#3e4656'];
      payEl.style.background = paymentState[1];
      payEl.style.color = paymentState[2];

      document.getElementById('modal-payment-method').innerText = order.paymentMethod === 'wompi' ? '💳 Pago en línea (Wompi)' : '💵 Pago Contra Entrega';

      document.getElementById('modal-customer-name').innerText = order.customerName || '--';
      document.getElementById('modal-customer-email').innerText = order.customerEmail || '--';
      document.getElementById('modal-customer-phone').innerText = order.customerPhone || '--';

      const addr = order.shippingAddress || {};
      document.getElementById('modal-shipping-address').innerText = addr.addressLine || '--';
      document.getElementById('modal-shipping-city').innerText = (addr.municipality || '') + (addr.department ? ', ' + addr.department : '');
      
      const notesWrap = document.getElementById('modal-shipping-notes-wrap');
      if (addr.notes) {
        notesWrap.style.display = 'block';
        document.getElementById('modal-shipping-notes').innerText = addr.notes;
      } else {
        notesWrap.style.display = 'none';
      }

      // Líneas de productos
      const linesBody = document.getElementById('modal-order-lines-body');
      const lines = order.lines || [];
      if (lines.length === 0) {
        linesBody.innerHTML = '<tr><td colspan="5" style="padding:1rem; text-align:center; color:var(--muted);">Sin líneas registradas</td></tr>';
      } else {
        linesBody.innerHTML = lines.map(l => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.6rem 0.75rem;"><strong>\${escapeHtml(l.productName || 'Producto')}</strong></td>
            <td style="padding:0.6rem 0.75rem;"><code style="color:var(--muted);">\${escapeHtml(l.productSku || '--')}</code></td>
            <td style="padding:0.6rem 0.75rem; text-align:center; font-weight:700;">\${l.quantity}</td>
            <td style="padding:0.6rem 0.75rem; text-align:right;">$\${(l.unitPriceCents/100).toLocaleString('es-CO')}</td>
            <td style="padding:0.6rem 0.75rem; text-align:right; font-weight:700;">$\${(l.totalCents/100).toLocaleString('es-CO')}</td>
          </tr>
        \`).join('');
      }

      // Desglose financiero
      document.getElementById('modal-subtotal').innerText = '$' + (order.subtotalCents / 100).toLocaleString('es-CO');
      const disc = order.discountCents || 0;
      const discRow = document.getElementById('modal-discount-row');
      if (disc > 0) {
        discRow.style.display = 'flex';
        document.getElementById('modal-discount').innerText = '-$' + (disc / 100).toLocaleString('es-CO');
      } else {
        discRow.style.display = 'none';
      }
      const taxCents = Number(order.pricingVersion) === 2 ? Number(order.taxCents || 0) : Number(order.totalCents) - Number(order.subtotalCents) - Number(order.shippingCostCents) + Number(disc);
      document.getElementById('modal-tax').innerText = '$' + (taxCents / 100).toLocaleString('es-CO');
      document.getElementById('modal-transaction-fee').innerText = '$' + (Number(order.transactionFeeCents || 0) / 100).toLocaleString('es-CO');
      document.getElementById('modal-payment-fee').innerText = '$' + (Number(order.estimatedPaymentFeeCents || 0) / 100).toLocaleString('es-CO') + ' (estimada)';
      document.getElementById('modal-shipping-cost').innerText = '$' + (order.shippingCostCents / 100).toLocaleString('es-CO');
      document.getElementById('modal-total').innerText = '$' + (order.totalCents / 100).toLocaleString('es-CO');

      const selectEl = document.getElementById('modal-change-status-select');
      if (selectEl) selectEl.value = order.status;

      document.getElementById('order-detail-modal').style.display = 'flex';
    }

    function closeOrderDetailModal() {
      const modal = document.getElementById('order-detail-modal');
      if (modal) modal.style.display = 'none';
      _activeModalOrderId = null;
    }

    async function applyModalStatusChange() {
      if (!_activeModalOrderId) return;
      const selectEl = document.getElementById('modal-change-status-select');
      const newStatus = selectEl ? selectEl.value : null;
      if (!newStatus) return;
      await updateOrderStatus(_activeModalOrderId, newStatus);
      closeOrderDetailModal();
    }

    async function updateOrderStatus(orderId, newStatus) {
      if (!newStatus) return;
      await fetch('/api/v1/admin/orders/' + orderId + '/status', {
        method: 'PATCH',
        headers: adminHeaders(true),
        body: JSON.stringify({ status: newStatus, note: 'Actualizado desde panel admin' })
      });
      loadAdminOrders();
    }

    window.loadAdminOrders = loadAdminOrders;
    window.openOrderDetailModal = openOrderDetailModal;
    window.closeOrderDetailModal = closeOrderDetailModal;
    window.applyModalStatusChange = applyModalStatusChange;
    window.updateOrderStatus = updateOrderStatus;
  `;
}
