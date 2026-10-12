export function renderPhase8AdminScript(): string {
  return `
    async function loadAdminOrders() {
      const token = localStorage.getItem('vega_admin_token');
      const tbody = document.getElementById('orders-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/orders', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!data.success || !data.orders || data.orders.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay pedidos registrados</td></tr>';
          return;
        }
        tbody.innerHTML = data.orders.map(o => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;"><code>\${o.id}</code></td>
            <td style="padding:0.75rem;"><strong>\${escapeHtml(o.customerName)}</strong><br><small style="color:var(--muted);">\${escapeHtml(o.customerPhone)}</small></td>
            <td style="padding:0.75rem; font-weight:700;">$\${(o.totalCents / 100).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem;">\${o.paymentMethod === 'wompi' ? '💳 Wompi' : '💵 Contra Entrega'}</td>
            <td style="padding:0.75rem;"><span class="tag">\${o.status}</span></td>
            <td style="padding:0.75rem;"><span class="tag">\${o.paymentStatus}</span></td>
            <td style="padding:0.75rem; text-align:center;">
              <select onchange="updateOrderStatus('\${o.id}', this.value)" style="padding:0.3rem; border:1px solid var(--border); border-radius:4px; font-size:0.85rem;">
                <option value="">Cambiar...</option>
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
      const token = localStorage.getItem('vega_admin_token');
      await fetch('/api/v1/admin/orders/' + orderId + '/status', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: 'Actualizado desde panel admin' })
      });
      loadAdminOrders();
    }

    async function loadAdminInventory() {
      const token = localStorage.getItem('vega_admin_token');
      const tbody = document.getElementById('inventory-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/inventory', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!data.success || !data.items || data.items.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay registros de inventario</td></tr>';
          return;
        }
        tbody.innerHTML = data.items.map(s => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;"><code>\${s.productId}</code></td>
            <td style="padding:0.75rem; font-weight:700;">\${s.totalQuantity} un.</td>
            <td style="padding:0.75rem; color:#d97706;">\${s.reservedQuantity} un.</td>
            <td style="padding:0.75rem; color:#15803d; font-weight:700;">\${s.availableQuantity} un.</td>
            <td style="padding:0.75rem; text-align:center;">
              <button onclick="adjustStockPrompt('\${s.productId}', 10)" style="padding:0.2rem 0.5rem; margin-right:0.25rem;">+10</button>
              <button onclick="adjustStockPrompt('\${s.productId}', -10)" style="padding:0.2rem 0.5rem;">-10</button>
            </td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar inventario</td></tr>';
      }
    }

    async function adjustStockPrompt(productId, delta) {
      const token = localStorage.getItem('vega_admin_token');
      await fetch('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, deltaQuantity: delta, reason: 'admin_quick_action' })
      });
      loadAdminInventory();
    }

    async function loadAdminPayments() {
      const token = localStorage.getItem('vega_admin_token');
      const tbody = document.getElementById('payments-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/payments', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!data.success || !data.transactions || data.transactions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay transacciones registradas</td></tr>';
          return;
        }
        tbody.innerHTML = data.transactions.map(t => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;"><code>\${t.reference}</code></td>
            <td style="padding:0.75rem;"><code>\${t.orderId}</code></td>
            <td style="padding:0.75rem;">\${t.paymentMethod}</td>
            <td style="padding:0.75rem; font-weight:700;">$\${(t.amountInCents / 100).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem;"><span class="tag">\${t.status}</span></td>
            <td style="padding:0.75rem; font-size:0.85rem; color:var(--muted);">\${new Date(t.createdAt).toLocaleString('es-CO')}</td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar pagos</td></tr>';
      }
    }

    async function submitCodCollection() {
      const token = localStorage.getItem('vega_admin_token');
      const orderId = document.getElementById('cod-order-id').value.trim();
      const amount = parseInt(document.getElementById('cod-amount').value, 10);
      const receipt = document.getElementById('cod-receipt').value.trim();

      if (!orderId || !amount) {
        alert('Por favor indica ID de Pedido y Monto en Centavos');
        return;
      }

      const res = await fetch('/api/v1/admin/payments/cod/collect', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
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

    // Realtime Notifications Poller
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
          data.notifications.forEach(n => {
            console.log('[REALTIME NOTIFICATION]', n.title, n.body);
          });
        }
      } catch (e) {}
    }
    setInterval(pollRealtimeNotifications, 8000);
  `;
}
