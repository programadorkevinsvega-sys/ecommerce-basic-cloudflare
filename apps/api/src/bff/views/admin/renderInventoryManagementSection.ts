export function renderInventoryManagementSection(): string {
  return `
    <!-- Modal: Ajuste de Stock -->
    <div id="inv-adjust-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:1000; align-items:center; justify-content:center;">
      <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:1.5rem; width:100%; max-width:420px; margin:1rem;">
        <h3 style="margin-bottom:1rem; color:#f8fafc;">Ajustar Stock</h3>
        <p id="inv-modal-product-name" style="font-weight:600; color:#94a3b8; margin-bottom:1rem; font-size:0.9rem;"></p>
        <div style="margin-bottom:0.75rem;">
          <label style="display:block; font-size:0.85rem; color:#cbd5e1; margin-bottom:0.3rem;">Cantidad (positivo = ingreso, negativo = salida)</label>
          <input id="inv-modal-delta" type="number" placeholder="Ej: 50 o -10"
            style="width:100%; padding:0.6rem; background:#0f172a; border:1px solid #475569; border-radius:6px; color:#fff; font-size:1rem;" />
        </div>
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-size:0.85rem; color:#cbd5e1; margin-bottom:0.3rem;">Razón del ajuste</label>
          <select id="inv-modal-reason" style="width:100%; padding:0.6rem; background:#0f172a; border:1px solid #475569; border-radius:6px; color:#fff; font-size:0.9rem;">
            <option value="manual_adjustment">Ajuste manual</option>
            <option value="restock">Reabastecimiento</option>
            <option value="damage">Merma / Daño</option>
            <option value="return">Devolución de cliente</option>
            <option value="correction">Corrección de conteo</option>
          </select>
        </div>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
          <button onclick="closeInvModal()" style="padding:0.5rem 1rem; background:#334155; border:none; border-radius:6px; color:#cbd5e1; cursor:pointer;">Cancelar</button>
          <button onclick="confirmInvAdjust()" style="padding:0.5rem 1rem; background:#2563eb; border:none; border-radius:6px; color:#fff; font-weight:600; cursor:pointer;">Confirmar</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:2rem;">
      <!-- Cabecera -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h2 style="margin:0 0 0.25rem;">📊 Control de Inventario</h2>
          <p style="margin:0; font-size:0.85rem; color:var(--muted);">Stock en tiempo real por producto. Ajusta entradas, salidas y correcciones.</p>
        </div>
        <button class="btn-primary" onclick="loadAdminInventory()" style="padding:0.4rem 0.9rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>

      <!-- KPI Cards -->
      <div id="inv-kpi-row" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div style="background:#0f172a; border:1px solid #1e3a5f; border-radius:8px; padding:1rem; text-align:center;">
          <div id="inv-kpi-total" style="font-size:1.8rem; font-weight:800; color:#60a5fa;">—</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:0.25rem;">SKUs con stock</div>
        </div>
        <div style="background:#0f172a; border:1px solid #14532d; border-radius:8px; padding:1rem; text-align:center;">
          <div id="inv-kpi-available" style="font-size:1.8rem; font-weight:800; color:#4ade80;">—</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:0.25rem;">Unidades disponibles</div>
        </div>
        <div style="background:#0f172a; border:1px solid #7c2d12; border-radius:8px; padding:1rem; text-align:center;">
          <div id="inv-kpi-reserved" style="font-size:1.8rem; font-weight:800; color:#fb923c;">—</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:0.25rem;">Unidades reservadas</div>
        </div>
        <div style="background:#0f172a; border:1px solid #7f1d1d; border-radius:8px; padding:1rem; text-align:center;">
          <div id="inv-kpi-low" style="font-size:1.8rem; font-weight:800; color:#f87171;">—</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:0.25rem;">Stock bajo (&lt;10 u.)</div>
        </div>
      </div>

      <!-- Tabla de inventario -->
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.78rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">Producto / SKU</th>
              <th style="padding:0.75rem; text-align:center;">Estado</th>
              <th style="padding:0.75rem; text-align:right;">Total</th>
              <th style="padding:0.75rem; text-align:right;">Reservado</th>
              <th style="padding:0.75rem; text-align:right;">Disponible</th>
              <th style="padding:0.75rem; text-align:center;">Ajuste</th>
            </tr>
          </thead>
          <tbody id="inventory-table-body">
            <tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--muted);">Cargando inventario...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
