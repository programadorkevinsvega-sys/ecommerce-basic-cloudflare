export function renderInventoryAdminScript(): string {
  return `
    window._adminInventoryItems = [];
    window._adminInventoryProducts = {};
    async function loadAdminInventory() {
      const body = document.getElementById('inventory-table-body');
      if (!body) return false;
      body.innerHTML = '<tr><td colspan="5" class="inventory-loading">Cargando inventario…</td></tr>';
      clearInventoryMessage();
      try {
        await fetch('/api/v1/admin/inventory/sync', { method: 'POST', headers: adminHeaders(true), body: '{}' });
        const [inventoryResponse, productsResponse] = await Promise.all([
          fetch('/api/v1/admin/inventory', { headers: adminHeaders() }),
          fetch('/api/v1/products?limit=200')
        ]);
        const inventory = await inventoryResponse.json();
        const products = productsResponse.ok ? await productsResponse.json() : { data: [] };
        if (!inventoryResponse.ok || !inventory.success || !Array.isArray(inventory.items)) throw new Error(inventory.error || 'No fue posible cargar el inventario.');
        window._adminInventoryItems = inventory.items;
        window._adminInventoryProducts = Object.fromEntries((products.data || []).map(product => [product.id, product]));
        window.renderAdminInventoryView();
        loadRecentInventoryMovements();
        return true;
      } catch (error) {
        body.innerHTML = '<tr><td colspan="5" class="inventory-loading">' + escapeHtml(error.message || 'Error al cargar inventario') + '</td></tr>';
        showInventoryMessage(error.message || 'Error al cargar inventario', true);
        return false;
      }
    }

    async function loadRecentInventoryMovements() {
      const list = document.getElementById('inventory-movements');
      if (!list) return;
      try {
        const response = await fetch('/api/v1/admin/audit', { headers: adminHeaders() });
        if (response.status === 403) throw new Error('Tu sesión no tiene permiso para ver la bitácora.');
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.logs)) throw new Error('No se pudo consultar la bitácora.');
        const movements = data.logs.filter(isCompletedInventoryAdjustment).slice(0, 5);
        list.innerHTML = movements.length ? movements.map(renderInventoryMovement).join('') : '<li class="inventory-movement-empty">No hay ajustes recientes registrados en la bitácora.</li>';
      } catch (error) {
        list.innerHTML = '<li class="inventory-movement-empty">' + escapeHtml(error.message || 'Historial no disponible') + '</li>';
      }
    }

    function isCompletedInventoryAdjustment(log) {
      return log.action === 'admin.api.mutation.completed' && log.entityId === 'POST /api/v1/admin/inventory/adjust' &&
        Number(log.changes?.status) < 400 && Number.isSafeInteger(log.changes?.fields?.quantity?.after);
    }

    function renderInventoryMovement(log) {
      const fields = log.changes.fields;
      const previous = Number(fields.quantity.before || 0);
      const current = Number(fields.quantity.after);
      const delta = current - previous;
      const color = delta >= 0 ? ['#e6f4ec', '#136b3e'] : ['#eef0f4', '#3e4656'];
      const date = new Date(log.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
      return '<li><span class="inventory-movement-kind" style="background:' + color[0] + ';color:' + color[1] + '">Ajuste</span>' +
        '<span class="inventory-movement-copy"><strong>Ajuste de inventario</strong><small>Stock: ' + previous + ' → ' + current + ' uds · ' + escapeHtml(date) + '</small></span>' +
        '<span class="inventory-movement-delta">' + (delta > 0 ? '+' : '') + delta + '</span></li>';
    }

    function showInventoryMessage(message, isError) {
      const element = document.getElementById('inventory-message');
      if (!element) return;
      element.hidden = false;
      element.classList.toggle('error', Boolean(isError));
      element.textContent = message;
    }

    function clearInventoryMessage() {
      const element = document.getElementById('inventory-message');
      if (element) { element.hidden = true; element.textContent = ''; }
    }

    document.getElementById('inventory-refresh')?.addEventListener('click', loadAdminInventory);
    document.getElementById('inventory-export')?.addEventListener('click', exportAdminInventory);
    window.loadAdminInventory = loadAdminInventory;
  `;
}
