export function renderPaymentsManagementSection(): string {
  return `
    <div class="card" style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2>Pagos & Recaudos Contra Entrega</h2>
        <button class="btn-primary" onclick="loadAdminPayments()" style="padding:0.4rem 0.8rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>

      <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px;">
        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Registrar Recaudo Contra Entrega (Efectivo)</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; align-items: flex-end;">
          <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:0.2rem;">ID Pedido *</label>
            <input type="text" id="cod-order-id" placeholder="ord-..." style="width:100%; padding:0.4rem; border:1px solid var(--border); border-radius:4px;" />
          </div>
          <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:0.2rem;">Monto recibido en pesos (COP) *</label>
            <input type="text" id="cod-amount" data-cop-input inputmode="numeric" autocomplete="off" placeholder="50.000" style="width:100%; padding:0.4rem; border:1px solid var(--border); border-radius:4px;" />
          </div>
          <div>
            <label style="font-size:0.8rem; display:block; margin-bottom:0.2rem;">Recibo / Guía</label>
            <input type="text" id="cod-receipt" placeholder="Guía transportadora" style="width:100%; padding:0.4rem; border:1px solid var(--border); border-radius:4px;" />
          </div>
          <button type="button" class="btn-primary" onclick="submitCodCollection()" style="padding:0.5rem 1rem;">Registrar</button>
        </div>
      </div>

      <div style="margin-bottom:1.5rem; padding:1rem; background:var(--bg); border:1px solid var(--border); border-radius:6px;">
        <h3 style="font-size:1rem; margin-bottom:.5rem;">Conciliar comisión liquidada por Wompi</h3>
        <p>Registra el valor real y la referencia del reporte de liquidación del comercio. No uses el valor estimado como si fuera el real.</p>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:.75rem; align-items:end;">
          <label>Pedido Wompi aprobado<input id="settlement-order-id" /></label>
          <label>Comisión real (COP)<input id="settlement-fee" data-cop-input type="text" inputmode="numeric" autocomplete="off" placeholder="1.450" /></label>
          <label>Referencia del reporte<input id="settlement-report-ref" maxlength="120" /></label>
          <button type="button" class="btn-primary" onclick="submitSettlementCost()">Guardar</button>
        </div>
        <table style="width:100%; margin-top:1rem"><thead><tr><th>Pedido</th><th>Estimación</th><th>Liquidación real</th><th>Diferencia</th><th>Reporte</th></tr></thead><tbody id="settlement-table-body"></tbody></table>
      </div>

      <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Transacciones Recientes (Wompi & COD)</h3>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.85rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">Referencia</th>
              <th style="padding:0.75rem;">ID Pedido</th>
              <th style="padding:0.75rem;">Método</th>
              <th style="padding:0.75rem;">Monto</th>
              <th style="padding:0.75rem;">Estado</th>
              <th style="padding:0.75rem;">Fecha</th>
            </tr>
          </thead>
          <tbody id="payments-table-body">
            <tr><td colspan="6" style="padding:1.5rem; text-align:center; color:var(--muted);">Cargando transacciones...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
