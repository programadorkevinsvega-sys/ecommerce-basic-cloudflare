export function renderPaymentsManagementSection(): string {
  return `
    <section class="payments-screen" aria-labelledby="payments-title">
      <header class="payments-heading">
        <div><h1 id="payments-title">Pagos</h1><p>Consulta transacciones, registra recaudos y concilia las liquidaciones.</p></div>
        <button class="btn-primary" type="button" onclick="loadAdminPayments()">Actualizar</button>
      </header>
      <section class="payments-page-panel" data-payment-panel="collections" aria-labelledby="payments-page-collections">
        <div id="cod-collection-section" class="card payments-page-card">
          <h2 id="payments-page-collections">Recaudos contra entrega</h2>
          <p>Registra el efectivo recibido al entregar un pedido.</p>
          <div class="payments-form-grid">
            <label for="cod-order-id">ID del pedido *</label><input id="cod-order-id" type="text" placeholder="ord-..." />
            <label for="cod-amount">Monto recibido (COP) *</label><input id="cod-amount" data-cop-input inputmode="numeric" autocomplete="off" type="text" placeholder="50.000" />
            <label for="cod-receipt">Recibo / Guía</label><input id="cod-receipt" type="text" placeholder="Guía transportadora" />
            <span></span><button type="button" class="btn-primary" onclick="submitCodCollection()">Registrar recaudo</button>
          </div>
        </div>
      </section>
      <section class="payments-page-panel" data-payment-panel="conciliation" aria-labelledby="payments-page-conciliation" hidden>
        <div class="card payments-page-card">
          <h2 id="payments-page-conciliation">Conciliar liquidación de Wompi</h2>
          <p>Registra el valor real y la referencia del reporte de liquidación. No uses el valor estimado como si fuera el real.</p>
          <div class="payments-form-grid">
            <label for="settlement-order-id">Pedido Wompi aprobado</label><input id="settlement-order-id" />
            <label for="settlement-fee">Comisión real (COP)</label><input id="settlement-fee" data-cop-input type="text" inputmode="numeric" autocomplete="off" placeholder="1.450" />
            <label for="settlement-report-ref">Referencia del reporte</label><input id="settlement-report-ref" maxlength="120" />
            <span></span><button type="button" class="btn-primary" onclick="submitSettlementCost()">Guardar conciliación</button>
          </div>
          <div class="payments-table-scroll"><table class="payments-table"><thead><tr><th>Pedido</th><th>Estimación</th><th>Liquidación real</th><th>Diferencia</th><th>Reporte</th></tr></thead><tbody id="settlement-table-body"></tbody></table></div>
        </div>
      </section>
      <section class="payments-page-panel" data-payment-panel="transactions" aria-labelledby="payments-page-transactions" hidden>
        <div class="card payments-page-card">
          <h2 id="payments-page-transactions">Transacciones recientes</h2>
          <p>Movimientos de Wompi y pagos contra entrega.</p>
          <div class="payments-table-scroll"><table class="payments-table"><thead><tr><th>Referencia</th><th>ID pedido</th><th>Método</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody id="payments-table-body"><tr><td colspan="6">Cargando transacciones…</td></tr></tbody></table></div>
        </div>
      </section>
    </section>
  `;
}
