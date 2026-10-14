export function renderInventoryListScript(): string {
  return `
    let activeInventoryLevel = 'all';
    const INVENTORY_ALERT_LIMIT = 10;
    function availableStock(stock) { return Number(stock.availableQuantity ?? (stock.quantity - stock.reservedQuantity)); }
    function inventoryLevel(stock) { const available = availableStock(stock); return available <= 0 ? 'out' : available < INVENTORY_ALERT_LIMIT ? 'low' : 'ok'; }
    function filteredInventory() {
      const query = (document.getElementById('inventory-search')?.value || '').trim().toLowerCase();
      return (window._adminInventoryItems || []).filter(stock => {
        const product = window._adminInventoryProducts[stock.productId] || {};
        const matchesText = !query || [product.name, product.sku, product.brand].join(' ').toLowerCase().includes(query);
        const level = inventoryLevel(stock);
        return matchesText && (activeInventoryLevel === 'all' || activeInventoryLevel === level);
      });
    }

    function renderAdminInventoryView() {
      const items = window._adminInventoryItems || [];
      const availableTotal = items.reduce((sum, item) => sum + availableStock(item), 0);
      const reservedTotal = items.reduce((sum, item) => sum + Number(item.reservedQuantity || 0), 0);
      const lowCount = items.filter(item => availableStock(item) < INVENTORY_ALERT_LIMIT).length;
      document.getElementById('inv-kpi-total').textContent = items.length.toLocaleString('es-CO');
      document.getElementById('inv-kpi-available').textContent = availableTotal.toLocaleString('es-CO');
      document.getElementById('inv-kpi-reserved').textContent = reservedTotal.toLocaleString('es-CO');
      document.getElementById('inv-kpi-low').textContent = lowCount.toLocaleString('es-CO');
      document.querySelectorAll('[data-inventory-count]').forEach(node => {
        const level = node.dataset.inventoryCount;
        node.textContent = String(level === 'all' ? items.length : items.filter(item => inventoryLevel(item) === level).length);
      });
      const visible = filteredInventory();
      const body = document.getElementById('inventory-table-body');
      const region = document.getElementById('inventory-table-region');
      const empty = document.getElementById('inventory-empty');
      region.hidden = visible.length === 0;
      empty.hidden = visible.length !== 0;
      body.innerHTML = visible.map(renderInventoryRow).join('');
      document.getElementById('inventory-summary').textContent = 'Mostrando ' + visible.length + ' de ' + items.length + ' productos cargados.';
    }

    function renderInventoryRow(stock) {
      const product = window._adminInventoryProducts[stock.productId] || {};
      const name = product.name || 'Producto ' + String(stock.productId).slice(0, 8);
      const sku = product.sku || stock.productId;
      const available = availableStock(stock);
      const level = inventoryLevel(stock);
      const state = level === 'out' ? ['Agotado', '#fbe9e7', '#a8231b', '#c0392b'] : level === 'low' ? ['Stock bajo', '#fcf1dc', '#7a4f00', '#c58a12'] : ['En stock', '#e6f4ec', '#136b3e', '#2e8b5a'];
      const barWidth = Math.max(0, Math.min(100, Math.round(available / (INVENTORY_ALERT_LIMIT * 3) * 100)));
      return '<tr><td><div class="inventory-product"><strong>' + escapeHtml(name) + '</strong><small><code>' + escapeHtml(sku) + '</code>' + (product.brand ? ' · ' + escapeHtml(product.brand) : '') + '</small></div></td>' +
        '<td><div class="inventory-stock-cell"><strong>' + Number(stock.quantity) + ' uds</strong><small>Reservado ' + Number(stock.reservedQuantity) + ' · Disponible ' + available + '</small><span class="inventory-stock-meter" aria-label="' + available + ' unidades disponibles"><span style="width:' + barWidth + '%;background:' + state[3] + '"></span></span></div></td>' +
        '<td class="inventory-threshold">&lt; ' + INVENTORY_ALERT_LIMIT + ' uds</td><td><span class="inventory-badge" style="background:' + state[1] + ';color:' + state[2] + '">' + state[0] + '</span></td>' +
        '<td><button class="inventory-secondary-button" type="button" data-inventory-adjust="' + escapeHtml(stock.productId) + '" aria-haspopup="dialog">Ajustar<span class="sr-only"> stock de ' + escapeHtml(name) + '</span></button></td></tr>';
    }

    function exportAdminInventory() {
      const rows = [['Producto', 'SKU', 'Stock total', 'Reservado', 'Disponible', 'Estado', 'Actualizado']];
      filteredInventory().forEach(stock => {
        const product = window._adminInventoryProducts[stock.productId] || {};
        rows.push([product.name || stock.productId, product.sku || stock.productId, stock.quantity, stock.reservedQuantity, availableStock(stock), inventoryLevel(stock), stock.updatedAt].map(csvInventoryCell));
      });
      const blob = new Blob(['\ufeff' + rows.map(row => row.join(',')).join('\\r\\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'inventario.csv'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function csvInventoryCell(value) {
      let text = String(value ?? '');
      if (/^[=+@\\t\\r-]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }

    document.querySelectorAll('[data-inventory-level]').forEach(button => button.addEventListener('click', () => {
      activeInventoryLevel = button.dataset.inventoryLevel;
      document.querySelectorAll('[data-inventory-level]').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('selected', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });
      renderAdminInventoryView();
    }));
    document.getElementById('inventory-search')?.addEventListener('input', renderAdminInventoryView);
    document.getElementById('inventory-reset')?.addEventListener('click', () => {
      activeInventoryLevel = 'all';
      document.getElementById('inventory-search').value = '';
      document.querySelector('[data-inventory-level="all"]')?.click();
    });
    window.renderAdminInventoryView = renderAdminInventoryView;
  `;
}
