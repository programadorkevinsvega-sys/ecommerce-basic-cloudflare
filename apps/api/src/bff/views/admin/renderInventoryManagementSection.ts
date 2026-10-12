export function renderInventoryManagementSection(): string {
  return `
    <div class="card" style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2>Control de Inventario y Stock</h2>
        <button class="btn-primary" onclick="loadAdminInventory()" style="padding:0.4rem 0.8rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.85rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">ID Producto</th>
              <th style="padding:0.75rem;">Stock Total</th>
              <th style="padding:0.75rem;">Reservado</th>
              <th style="padding:0.75rem;">Disponible</th>
              <th style="padding:0.75rem; text-align:center;">Ajuste Rápido</th>
            </tr>
          </thead>
          <tbody id="inventory-table-body">
            <tr><td colspan="5" style="padding:1.5rem; text-align:center; color:var(--muted);">Cargando inventario...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
