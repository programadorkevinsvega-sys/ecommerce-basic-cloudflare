export function renderInvoicesManagementSection(): string {
  return `<section class="invoices-screen" aria-labelledby="invoices-title">
    <header class="invoices-heading"><div><h1 id="invoices-title">Facturación</h1><p id="invoices-description">Consulta los comprobantes comerciales internos emitidos para tus ventas.</p></div></header>
    <section class="card invoices-list-card" aria-labelledby="invoices-list-title">
      <div class="invoices-section-heading"><div><h2 id="invoices-list-title">Facturas comerciales emitidas</h2><p id="invoices-list-description">Comprobantes internos de ventas; esta lista no equivale por sí sola a facturación electrónica DIAN.</p></div></div>
      <form id="invoices-search-form" class="invoice-search-form" role="search">
        <label id="invoices-search-label" class="invoice-search-label" for="invoices-search">Consultar por ID, número de factura, pedido, cliente o total</label>
        <div class="invoice-search-controls"><input id="invoices-search" class="invoice-search-input" type="search" autocomplete="off" placeholder="ID exacto, FAC-000004, pedido o cliente" /><button id="invoices-search-submit" type="submit" class="btn-primary">Consultar</button></div>
        <small class="invoice-search-help">La consulta se actualiza al escribir. ID, factura y pedido se buscan de forma exacta; cliente y correo, desde el inicio del texto.</small>
        <p id="invoices-search-status" class="invoice-search-status" aria-live="polite"></p>
      </form>
      <div id="invoices-electronic-filter" hidden>
        <label class="invoice-search-label" for="invoices-electronic-status">Estado ante DIAN</label><select id="invoices-electronic-status" class="invoice-search-input"><option value="">Todos</option><option value="pending">Pendiente</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option><option value="not_configured">Sin configurar</option></select>
      </div>
      <div class="invoices-table-scroll"><table class="invoices-table"><thead><tr><th>Factura</th><th>Pedido</th><th>Cliente</th><th>Total</th><th id="invoices-status-heading">Estado de factura</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody id="invoices-table-body"><tr><td colspan="7" class="invoices-empty">Cargando facturas comerciales…</td></tr></tbody></table></div>
      <nav id="invoices-pagination" class="admin-pagination" aria-label="Paginación de facturas"></nav>
    </section>
    <div id="credit-note-modal" class="invoice-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="credit-note-title">
      <button class="invoice-modal-backdrop" type="button" data-invoice-action="close" aria-label="Cerrar nota crédito"></button>
      <section class="invoice-modal-dialog"><header><div><h2 id="credit-note-title">Emitir nota crédito</h2><p id="cn-modal-invoice-num">Factura: #---</p></div><button type="button" class="invoice-modal-close" data-invoice-action="close" aria-label="Cerrar">×</button></header>
        <div class="invoice-modal-field"><label for="cn-concept">Concepto DIAN</label><select id="cn-concept"><option value="1">Devolución parcial de bienes o no aceptación parcial del servicio</option><option value="2">Anulación de factura electrónica</option><option value="3">Rebaja o descuento parcial o total</option><option value="4">Ajuste de precio</option><option value="5">Descuento comercial por pronto pago</option><option value="6">Descuento comercial por volumen</option></select></div>
        <div class="invoice-modal-field"><label for="cn-reason">Detalle del motivo</label><input type="text" id="cn-reason" maxlength="500" placeholder="Describe la causa de la nota crédito" /></div>
        <div class="invoice-modal-field"><label for="cn-amount">Monto de la nota (COP)</label><input type="text" id="cn-amount" data-cop-input inputmode="numeric" autocomplete="off" placeholder="1.728.550" /></div>
        <footer><button type="button" class="invoice-secondary-button" data-invoice-action="close">Cancelar</button><button type="button" class="btn-primary" data-invoice-action="submit-credit-note">Emitir nota crédito</button></footer>
      </section>
    </div>
  </section>`;
}
