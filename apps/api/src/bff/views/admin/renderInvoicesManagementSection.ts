export function renderInvoicesManagementSection(): string {
  return `
    <div class="card" style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h2>Gestión de Facturación</h2>
          <p style="color:var(--muted); font-size:0.85rem; margin-top:0.25rem;">Facturas comerciales inmutables emitidas automáticamente, numeradas consecutivamente y almacenadas en R2.</p>
        </div>
        <button class="btn-primary" onclick="loadAdminInvoices()" style="padding:0.4rem 0.8rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.85rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">Factura #</th>
              <th style="padding:0.75rem;">Pedido ID</th>
              <th style="padding:0.75rem;">Cliente</th>
              <th style="padding:0.75rem;">Total</th>
              <th style="padding:0.75rem;">Estado</th>
              <th style="padding:0.75rem;">Fecha</th>
              <th style="padding:0.75rem; text-align:center;">Acciones</th>
            </tr>
          </thead>
          <tbody id="invoices-table-body">
            <tr><td colspan="7" style="padding:1.5rem; text-align:center; color:var(--muted);">Cargando facturas...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nota Crédito -->
    <div id="credit-note-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:1000; align-items:center; justify-content:center;">
      <div style="background:var(--card-bg, #1e293b); color:var(--text, #f8fafc); border:1px solid var(--border, #334155); border-radius:10px; padding:1.75rem; width:450px; max-width:92%;">
        <h3 style="margin-top:0;">Emitir Nota Crédito</h3>
        <p id="cn-modal-invoice-num" style="color:#38bdf8; font-weight:700;">Factura: #---</p>
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-size:0.85rem; margin-bottom:0.3rem;">Motivo de la nota crédito:</label>
          <input type="text" id="cn-reason" placeholder="Ej. Devolución de producto o corrección" style="width:100%; padding:0.5rem; border:1px solid var(--border); border-radius:5px; background:transparent; color:inherit;" />
        </div>
        <div style="margin-bottom:1.5rem;">
          <label style="display:block; font-size:0.85rem; margin-bottom:0.3rem;">Monto en Centavos COP:</label>
          <input type="number" id="cn-amount" placeholder="Ej. 172855000" style="width:100%; padding:0.5rem; border:1px solid var(--border); border-radius:5px; background:transparent; color:inherit;" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button onclick="closeCreditNoteModal()" style="padding:0.4rem 0.8rem; background:transparent; border:1px solid var(--border); border-radius:5px; color:inherit; cursor:pointer;">Cancelar</button>
          <button onclick="submitCreditNote()" class="btn-primary" style="padding:0.4rem 0.8rem;">Emitir Nota Crédito</button>
        </div>
      </div>
    </div>
  `;
}
