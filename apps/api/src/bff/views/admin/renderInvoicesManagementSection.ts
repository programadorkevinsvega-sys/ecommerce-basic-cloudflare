export function renderInvoicesManagementSection(): string {
  return `<section class="invoices-screen" aria-labelledby="invoices-title">
    <header class="invoices-heading"><div><h1 id="invoices-title">Facturación</h1><p>Consulta documentos comerciales inmutables emitidos para tus pedidos.</p></div></header>
    <section class="card invoices-list-card" aria-labelledby="invoices-list-title">
      <div class="invoices-section-heading"><div><h2 id="invoices-list-title">Facturas emitidas</h2><p>Numeración consecutiva y documentos almacenados de forma segura.</p></div></div>
      <label class="invoice-search-label" for="invoices-search">Buscar por factura, pedido, cliente o total</label><input id="invoices-search" class="invoice-search-input" type="search" placeholder="Ej. FAC-000004, correo, pedido o 120.265" oninput="filterAdminInvoices()" />
      <div class="invoices-table-scroll"><table class="invoices-table"><thead><tr><th>Factura</th><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody id="invoices-table-body"><tr><td colspan="7" class="invoices-empty">Cargando facturas…</td></tr></tbody></table></div>
      <nav id="invoices-pagination" class="admin-pagination" aria-label="Paginación de facturas"></nav>
    </section>
    <div id="credit-note-modal" class="invoice-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="credit-note-title">
      <button class="invoice-modal-backdrop" type="button" aria-label="Cerrar nota crédito" onclick="closeCreditNoteModal()"></button>
      <section class="invoice-modal-dialog"><header><div><h2 id="credit-note-title">Emitir nota crédito</h2><p id="cn-modal-invoice-num">Factura: #---</p></div><button type="button" class="invoice-modal-close" aria-label="Cerrar" onclick="closeCreditNoteModal()">×</button></header>
        <div class="invoice-modal-field"><label for="cn-reason">Motivo</label><input type="text" id="cn-reason" placeholder="Devolución de producto o corrección" /></div>
        <div class="invoice-modal-field"><label for="cn-amount">Monto de la nota (COP)</label><input type="text" id="cn-amount" data-cop-input inputmode="numeric" autocomplete="off" placeholder="1.728.550" /></div>
        <footer><button type="button" class="invoice-secondary-button" onclick="closeCreditNoteModal()">Cancelar</button><button type="button" class="btn-primary" onclick="submitCreditNote()">Emitir nota crédito</button></footer>
      </section>
    </div>
  </section>`;
}
