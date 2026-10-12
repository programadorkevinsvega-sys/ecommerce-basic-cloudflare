export function renderOrdersManagementSection(): string {
  return `
    <div class="card" style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2>Gestión de Pedidos</h2>
        <button class="btn-primary" onclick="loadAdminOrders()" style="padding:0.4rem 0.8rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.85rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">ID</th>
              <th style="padding:0.75rem;">Cliente</th>
              <th style="padding:0.75rem;">Total</th>
              <th style="padding:0.75rem;">Método</th>
              <th style="padding:0.75rem;">Estado Pedido</th>
              <th style="padding:0.75rem;">Estado Pago</th>
              <th style="padding:0.75rem; text-align:center;">Acciones</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr><td colspan="7" style="padding:1.5rem; text-align:center; color:var(--muted);">Cargando pedidos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
