export function renderPaymentsManagementSection(): string {
  return `
    <section class="payments-screen" aria-labelledby="payments-title">
      <header class="payments-heading">
        <div><h1 id="payments-title">Pagos</h1><p>Consulta transacciones, registra recaudos y concilia las liquidaciones.</p></div>
        <button class="btn-primary" type="button" onclick="loadAdminPayments()">Actualizar</button>
      </header>
      <section class="payments-page-panel" data-payment-panel="collections" aria-labelledby="payments-page-collections">
        <div id="cod-collection-section" class="card payments-page-card">
          <header class="payments-card-heading"><div><h2 id="payments-page-collections">Recaudos contra entrega</h2><p>Consulta los recaudos registrados y crea uno al confirmar la entrega.</p></div><button type="button" class="btn-primary" onclick="openCodCollectionForm()">Crear nuevo recaudo</button></header>
          <div class="payments-table-scroll"><table class="payments-table"><thead><tr><th>Pedido</th><th>Recibo / guía</th><th>Monto recibido</th><th>Fecha</th><th>Registrado por</th></tr></thead><tbody id="cod-collections-table-body"><tr><td colspan="5">Cargando recaudos…</td></tr></tbody></table></div>
        </div>
      </section>
      <section class="payments-page-panel" data-payment-panel="conciliation" aria-labelledby="payments-page-conciliation" hidden>
        <div class="card payments-page-card">
          <header class="payments-card-heading"><div><h2 id="payments-page-conciliation">Conciliaciones de Wompi</h2><p>Consulta las liquidaciones registradas y compara la comisión real con la estimada.</p></div><button type="button" class="btn-primary" onclick="openSettlementForm()">Crear conciliación</button></header>
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
      <div id="cod-collection-modal" class="payments-modal" hidden>
        <button class="payments-modal-backdrop" type="button" onclick="closeCodCollectionForm()" aria-label="Cerrar formulario de recaudo"></button>
        <section class="payments-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="cod-modal-title" tabindex="-1">
          <header><div><h2 id="cod-modal-title">Crear nuevo recaudo</h2><p>Registra el efectivo recibido para un pedido contra entrega.</p></div><button class="payments-modal-close" type="button" onclick="closeCodCollectionForm()" aria-label="Cerrar">×</button></header>
          <form class="payments-modal-form" onsubmit="event.preventDefault(); submitCodCollection()">
            <div class="payments-modal-field"><label for="cod-order-id">ID del pedido *</label><input id="cod-order-id" type="text" placeholder="ord-..." required /></div>
            <div class="payments-modal-field"><label for="cod-amount">Monto recibido (COP) *</label><input id="cod-amount" data-cop-input inputmode="numeric" autocomplete="off" type="text" placeholder="50.000" required /></div>
            <div class="payments-modal-field"><label for="cod-receipt">Recibo / guía</label><input id="cod-receipt" type="text" placeholder="Guía transportadora" /></div>
            <footer><button type="button" class="payments-secondary-button" onclick="closeCodCollectionForm()">Cancelar</button><button type="submit" class="btn-primary">Registrar recaudo</button></footer>
          </form>
        </section>
      </div>
      <div id="settlement-modal" class="payments-modal" hidden>
        <button class="payments-modal-backdrop" type="button" onclick="closeSettlementForm()" aria-label="Cerrar formulario de conciliación"></button>
        <section class="payments-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="settlement-modal-title" tabindex="-1">
          <header><div><h2 id="settlement-modal-title">Crear conciliación</h2><p>Usa los datos reales del reporte de liquidación de Wompi.</p></div><button class="payments-modal-close" type="button" onclick="closeSettlementForm()" aria-label="Cerrar">×</button></header>
          <form class="payments-modal-form" onsubmit="event.preventDefault(); submitSettlementCost()">
            <div class="payments-modal-field"><label for="settlement-order-id">Pedido Wompi aprobado *</label><input id="settlement-order-id" required /></div>
            <div class="payments-modal-field"><label for="settlement-fee">Comisión real (COP) *</label><input id="settlement-fee" data-cop-input type="text" inputmode="numeric" autocomplete="off" placeholder="1.450" required /></div>
            <div class="payments-modal-field"><label for="settlement-report-ref">Referencia del reporte *</label><input id="settlement-report-ref" maxlength="120" required /></div>
            <footer><button type="button" class="payments-secondary-button" onclick="closeSettlementForm()">Cancelar</button><button type="submit" class="btn-primary">Guardar conciliación</button></footer>
          </form>
        </section>
      </div>
    </section>
  `;
}
