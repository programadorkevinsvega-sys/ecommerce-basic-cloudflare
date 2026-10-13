export function renderInventoryAdminScript(): string {
  return `
    let _invCurrentProductId = null;
    let _invCurrentProductLabel = '';

    function invStockBadge(available) {
      if (available <= 0) return '<span style="background:#7f1d1d;color:#fca5a5;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;">Sin stock</span>';
      if (available < 10) return '<span style="background:#78350f;color:#fcd34d;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;">Stock bajo</span>';
      return '<span style="background:#14532d;color:#86efac;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:700;">OK</span>';
    }

    async function loadAdminInventory() {
      const tbody = document.getElementById('inventory-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--muted);">Cargando…</td></tr>';
      try {
        // La inicialización de existencias es una escritura: el endpoint la autoriza y audita.
        await fetch('/api/v1/admin/inventory/sync', { method: 'POST', headers: adminHeaders(true), body: '{}' });
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
          const sku = prod ? '<br><small style="color:var(--muted);">' + escapeHtml(prod.sku) + '</small>' : '';
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
      const totalSkus = items.length;
      const totalAvail = items.reduce((s,i) => s + (i.availableQuantity ?? (i.quantity - i.reservedQuantity)), 0);
      const totalReserved = items.reduce((s,i) => s + i.reservedQuantity, 0);
      const lowStock = items.filter(i => (i.availableQuantity ?? (i.quantity - i.reservedQuantity)) < 10).length;
      const el = id => document.getElementById(id);
      if (el('inv-kpi-total')) el('inv-kpi-total').innerText = totalSkus;
      if (el('inv-kpi-available')) el('inv-kpi-available').innerText = totalAvail;
      if (el('inv-kpi-reserved')) el('inv-kpi-reserved').innerText = totalReserved;
      if (el('inv-kpi-low')) el('inv-kpi-low').innerText = lowStock;
    }

    function openInvModal(productId, label) {
      _invCurrentProductId = productId;
      _invCurrentProductLabel = label;
      document.getElementById('inv-modal-product-name').innerText = label;
      document.getElementById('inv-modal-delta').value = '';
      document.getElementById('inv-modal-reason').value = 'manual_adjustment';
      document.getElementById('inv-adjust-modal').style.display = 'flex';
    }

    function closeInvModal() {
      document.getElementById('inv-adjust-modal').style.display = 'none';
      _invCurrentProductId = null;
      _invCurrentProductLabel = '';
    }

    async function confirmInvAdjust() {
      if (!_invCurrentProductId) return;
      const delta = parseInt(document.getElementById('inv-modal-delta').value, 10);
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

    window.loadAdminInventory = loadAdminInventory;
    window.openInvModal = openInvModal;
    window.closeInvModal = closeInvModal;
    window.confirmInvAdjust = confirmInvAdjust;
  `;
}
