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
        if (!data.success || !data.orders || data.orders.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay pedidos registrados</td></tr>';
          return;
        }

        window._adminOrdersCache = {};
        data.orders.forEach(o => { window._adminOrdersCache[o.id] = o; });

        tbody.innerHTML = data.orders.map(o => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;">
              <code style="color:#38bdf8; font-weight:700;">#\${escapeHtml(String(o.id).replace('ord-', ''))}</code>
              <br><small style="color:var(--muted);">\${escapeHtml(new Date(o.createdAt).toLocaleDateString('es-CO'))}</small>
            </td>
            <td style="padding:0.75rem;">
              <strong>\${escapeHtml(o.customerName)}</strong>
              <br><small style="color:var(--muted);">\${escapeHtml(o.customerPhone)}</small>
            </td>
            <td style="padding:0.75rem; font-weight:700;">
              $\${(Number(o.totalCents)/100).toLocaleString('es-CO')}
            </td>
            <td style="padding:0.75rem;">
              \${o.paymentMethod === 'wompi' ? '💳 Wompi' : '💵 Contra Entrega'}
            </td>
            <td style="padding:0.75rem;">
              <span class="tag" style="background:\${o.status === 'confirmed' ? '#14532d' : o.status === 'delivered' ? '#047857' : o.status === 'cancelled' ? '#7f1d1d' : '#334155'}; color:#fff;">
                \${escapeHtml(o.status)}
              </span>
            </td>
            <td style="padding:0.75rem;">
              <span class="tag" style="background:\${o.paymentStatus === 'approved' ? '#14532d' : o.paymentStatus === 'collected' ? '#047857' : o.paymentStatus === 'failed' ? '#7f1d1d' : '#78350f'}; color:#fff;">
                \${escapeHtml(o.paymentStatus)}
              </span>
            </td>
            <td style="padding:0.75rem; text-align:center;">
              <div style="display:flex; gap:0.4rem; justify-content:center; align-items:center;">
                <button onclick="openOrderDetailModal(\${escapeHtml(JSON.stringify(String(o.id)))})"
                  style="padding:0.35rem 0.65rem; background:#0284c7; border:none; border-radius:5px; color:#fff; font-size:0.8rem; cursor:pointer; font-weight:600;">
                  👁️ Detalle
                </button>
                <select onchange="updateOrderStatus(\${escapeHtml(JSON.stringify(String(o.id)))}, this.value)"
                  style="padding:0.3rem; border:1px solid var(--border); border-radius:4px; font-size:0.8rem; background:transparent; color:inherit;">
                  <option value="">Estado…</option>
                  <option value="confirmed" \${o.status==='confirmed'?'selected':''}>Confirmado</option>
                  <option value="shipped" \${o.status==='shipped'?'selected':''}>Enviado</option>
                  <option value="delivered" \${o.status==='delivered'?'selected':''}>Entregado</option>
                  <option value="cancelled" \${o.status==='cancelled'?'selected':''}>Cancelado</option>
                </select>
              </div>
            </td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pedidos</td></tr>';
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
      stEl.style.background = order.status === 'confirmed' ? '#14532d' : order.status === 'delivered' ? '#047857' : '#334155';
      stEl.style.color = '#fff';

      const payEl = document.getElementById('modal-payment-status');
      payEl.innerText = order.paymentStatus;
      payEl.style.background = order.paymentStatus === 'approved' ? '#14532d' : order.paymentStatus === 'collected' ? '#047857' : '#78350f';
      payEl.style.color = '#fff';

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
