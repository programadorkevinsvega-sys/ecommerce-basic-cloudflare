export function renderPhase8AdminScript(): string {
  return `
    // ── PEDIDOS ──────────────────────────────────────────────────────────────
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
        tbody.innerHTML = data.orders.map(o => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;"><code>\${o.id}</code></td>
            <td style="padding:0.75rem;"><strong>\${escapeHtml(o.customerName)}</strong><br><small style="color:var(--muted);">\${escapeHtml(o.customerPhone)}</small></td>
            <td style="padding:0.75rem; font-weight:700;">$\${(o.totalCents/100).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem;">\${o.paymentMethod === 'wompi' ? '💳 Wompi' : '💵 Contra Entrega'}</td>
            <td style="padding:0.75rem;"><span class="tag">\${o.status}</span></td>
            <td style="padding:0.75rem;"><span class="tag">\${o.paymentStatus}</span></td>
            <td style="padding:0.75rem; text-align:center;">
              <select onchange="updateOrderStatus('\${o.id}', this.value)"
                style="padding:0.3rem; border:1px solid var(--border); border-radius:4px; font-size:0.85rem;">
                <option value="">Cambiar…</option>
                <option value="confirmed">Confirmado</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pedidos</td></tr>';
      }
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

    // ── INVENTARIO ───────────────────────────────────────────────────────────
    let _invCurrentProductId = null;
    let _invCurrentProductLabel = '';

    function invStockBadge(available) {
      if (available <= 0)  return '<span style="background:#7f1d1d;color:#fca5a5;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;">Sin stock</span>';
      if (available < 10) return '<span style="background:#78350f;color:#fcd34d;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;">Stock bajo</span>';
      return '<span style="background:#14532d;color:#86efac;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;">OK</span>';
    }

    async function loadAdminInventory() {
      const tbody = document.getElementById('inventory-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--muted);">Cargando…</td></tr>';
      try {
        const [invRes, prodRes] = await Promise.all([
          fetch('/api/v1/admin/inventory', { headers: adminHeaders() }),
          fetch('/api/v1/products?limit=200')
        ]);
        const invData = await invRes.json();
        const prodData = prodRes.ok ? await prodRes.json() : { data: [] };

        const productMap = {};
        (prodData.data || []).forEach(p => { productMap[p.id] = p; });

        if (!invData.success || !invData.items || invData.items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--muted);">No hay registros de inventario</td></tr>';
          _updateInvKpis([]);
          return;
        }

        _updateInvKpis(invData.items);

        tbody.innerHTML = invData.items.map(s => {
          const prod = productMap[s.productId];
          const name = prod ? escapeHtml(prod.name) : s.productId.slice(0,8) + '…';
          const sku  = prod ? '<br><small style="color:var(--muted);">' + escapeHtml(prod.sku) + '</small>' : '';
          const avail = s.availableQuantity ?? (s.quantity - s.reservedQuantity);
          const safeLabel = (name + (prod ? ' (' + escapeHtml(prod.sku) + ')' : '')).replace(/'/g, "\\\\'");
          return \`
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:0.75rem;"><strong>\${name}</strong>\${sku}</td>
              <td style="padding:0.75rem; text-align:center;">\${invStockBadge(avail)}</td>
              <td style="padding:0.75rem; text-align:right; font-weight:700;">\${s.quantity} u.</td>
              <td style="padding:0.75rem; text-align:right; color:#d97706;">\${s.reservedQuantity} u.</td>
              <td style="padding:0.75rem; text-align:right; color:\${avail > 0 ? '#4ade80' : '#f87171'}; font-weight:700;">\${avail} u.</td>
              <td style="padding:0.75rem; text-align:center;">
                <button onclick="openInvModal('\${s.productId}', '\${safeLabel}')"
                  style="padding:0.3rem 0.75rem; background:#1d4ed8; border:none; border-radius:5px; color:#fff; font-size:0.8rem; cursor:pointer;">
                  ✏️ Ajustar
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar inventario</td></tr>';
      }
    }

    function _updateInvKpis(items) {
      const totalSkus    = items.length;
      const totalAvail   = items.reduce((s,i) => s + (i.availableQuantity ?? (i.quantity - i.reservedQuantity)), 0);
      const totalReserved= items.reduce((s,i) => s + i.reservedQuantity, 0);
      const lowStock     = items.filter(i => (i.availableQuantity ?? (i.quantity - i.reservedQuantity)) < 10).length;
      const el = id => document.getElementById(id);
      if (el('inv-kpi-total'))     el('inv-kpi-total').innerText     = totalSkus;
      if (el('inv-kpi-available')) el('inv-kpi-available').innerText = totalAvail;
      if (el('inv-kpi-reserved'))  el('inv-kpi-reserved').innerText  = totalReserved;
      if (el('inv-kpi-low'))       el('inv-kpi-low').innerText       = lowStock;
    }

    function openInvModal(productId, label) {
      _invCurrentProductId    = productId;
      _invCurrentProductLabel = label;
      document.getElementById('inv-modal-product-name').innerText = label;
      document.getElementById('inv-modal-delta').value  = '';
      document.getElementById('inv-modal-reason').value = 'manual_adjustment';
      document.getElementById('inv-adjust-modal').style.display = 'flex';
    }

    function closeInvModal() {
      document.getElementById('inv-adjust-modal').style.display = 'none';
      _invCurrentProductId = null; _invCurrentProductLabel = '';
    }

    async function confirmInvAdjust() {
      if (!_invCurrentProductId) return;
      const delta  = parseInt(document.getElementById('inv-modal-delta').value, 10);
      const reason = document.getElementById('inv-modal-reason').value;
      if (isNaN(delta) || delta === 0) { alert('Ingresa una cantidad distinta de cero.'); return; }
      const res = await fetch('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: adminHeaders(true),
        body: JSON.stringify({ productId: _invCurrentProductId, deltaQuantity: delta, reason })
      });
      if (res.ok) { closeInvModal(); loadAdminInventory(); }
      else {
        const err = await res.json().catch(() => ({}));
        alert('Error: ' + (err.error || 'No se pudo ajustar el stock'));
      }
    }

    // ── PAGOS ────────────────────────────────────────────────────────────────
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
            <td style="padding:0.75rem;"><code>\${t.reference}</code></td>
            <td style="padding:0.75rem;"><code>\${t.orderId?.slice(0,12)}…</code></td>
            <td style="padding:0.75rem;">\${t.paymentMethod}</td>
            <td style="padding:0.75rem; font-weight:700;">$\${(t.amountInCents/100).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem;"><span class="tag">\${t.status}</span></td>
            <td style="padding:0.75rem; font-size:0.85rem; color:var(--muted);">\${new Date(t.createdAt).toLocaleString('es-CO')}</td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pagos</td></tr>';
      }
    }

    async function submitCodCollection() {
      const orderId = document.getElementById('cod-order-id').value.trim();
      const amount  = parseInt(document.getElementById('cod-amount').value, 10);
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
        document.getElementById('cod-amount').value   = '';
        document.getElementById('cod-receipt').value  = '';
        loadAdminPayments(); loadAdminOrders();
      } else { alert('Error al registrar recaudo'); }
    }

    // Exponer globalmente
    window.loadAdminOrders      = loadAdminOrders;
    window.updateOrderStatus    = updateOrderStatus;
    window.loadAdminInventory   = loadAdminInventory;
    window.openInvModal         = openInvModal;
    window.closeInvModal        = closeInvModal;
    window.confirmInvAdjust     = confirmInvAdjust;
    window.loadAdminPayments    = loadAdminPayments;
    window.submitCodCollection  = submitCodCollection;

    // ── REALTIME POLLER ──────────────────────────────────────────────────────
    let lastNotificationTime = new Date().toISOString();
    async function pollRealtimeNotifications() {
      try {
        const res = await fetch('/api/v1/realtime/notifications?channel=admin&since=' + encodeURIComponent(lastNotificationTime));
        const data = await res.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          lastNotificationTime = data.serverTime || new Date().toISOString();
          const badge = document.getElementById('notification-bell-badge');
          if (badge) { badge.style.display = 'inline-block'; badge.innerText = data.notifications.length; }
        }
      } catch (e) {}
    }
    setInterval(pollRealtimeNotifications, 8000);
  `;
}
