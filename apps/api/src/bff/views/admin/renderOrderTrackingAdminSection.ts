export function renderOrderTrackingAdminSection(): string {
  return `<section class="order-tracking-admin" data-shipping-panel="tracking" hidden aria-labelledby="order-tracking-admin-title">
    <header class="shipping-heading"><div><h1 id="order-tracking-admin-title">Seguimiento de pedidos</h1><p>Actualiza la preparación y la información de envío que verá el cliente.</p></div></header>
    <section class="card tracking-admin-card">
      <div class="tracking-admin-filters"><label>Buscar pedido o cliente<input id="tracking-admin-query" type="search" placeholder="Número de pedido, nombre o correo" /></label>
      <label>Estado<select id="tracking-admin-status"><option value="">Todos</option><option value="confirmed">Confirmado</option><option value="prepared">Preparado</option><option value="shipped">Enviado</option><option value="delivered">Entregado</option></select></label>
      <button class="shipping-action primary" type="button" data-tracking-action="search">Buscar</button></div>
      <div class="shipping-table-scroll"><table class="shipping-table tracking-admin-table"><thead><tr><th>Pedido / Cliente</th><th>Estado</th><th>Transportadora / Guía</th><th>Entrega estimada</th><th>Acciones</th></tr></thead><tbody id="order-tracking-admin-body"><tr><td colspan="5" class="shipping-empty">Carga el seguimiento de pedidos.</td></tr></tbody></table></div>
      <nav class="admin-pagination" id="order-tracking-admin-pagination" aria-label="Paginación de seguimiento de pedidos"><button class="admin-page-button" type="button" data-page-direction="previous" disabled>Anterior</button><span>Página 1</span><button class="admin-page-button" type="button" data-page-direction="next" disabled>Siguiente</button></nav>
    </section>
    <dialog id="order-tracking-edit-dialog" class="shipping-detail-dialog tracking-admin-dialog" aria-labelledby="tracking-edit-title">
      <form id="order-tracking-edit-form"><header><div><h2 id="tracking-edit-title">Actualizar seguimiento</h2><p id="tracking-edit-customer"></p></div><button class="shipping-modal-close" type="button" data-tracking-action="close" aria-label="Cerrar">×</button></header>
        <input id="tracking-edit-order-id" type="hidden" />
        <section class="tracking-admin-block tracking-order-status"><h3>Estado del pedido</h3><p>Este estado describe la preparación y entrega del pedido; no indica si MiPaquete ya confirmó una guía.</p>
          <section class="tracking-admin-timeline"><h4>Historial del pedido</h4><ol id="tracking-edit-timeline"></ol></section>
          <label>Estado del pedido<select id="tracking-edit-status"><option value="placed">Recibido</option><option value="confirmed">Confirmado</option><option value="prepared">Preparado</option><option value="shipped">Enviado</option><option value="delivered">Entregado</option><option value="cancelled">Cancelado</option></select></label>
          <label>Nota del cambio (opcional)<input id="tracking-edit-status-note" maxlength="300" /></label>
          <button id="tracking-edit-status-submit" class="shipping-action" type="button" data-tracking-action="save-status">Actualizar estado del pedido</button>
          <p id="tracking-order-message" role="status"></p>
        </section>
        <section class="tracking-admin-block tracking-shipment-status"><h3>Guía y estado del envío</h3><p>Estado independiente del pedido, informado por MiPaquete. Una guía pendiente no debe generarse de nuevo.</p>
          <p class="tracking-shipment-state"><strong>Estado de la guía:</strong> <span id="tracking-shipment-status">Consultando…</span></p>
          <p id="tracking-shipment-provider-status" class="tracking-provider-hint" role="status"></p>
          <label>Transportadora<input id="tracking-edit-carrier" maxlength="100" placeholder="Se completa con la respuesta de MiPaquete" /></label>
          <label>Número de guía<input id="tracking-edit-number" maxlength="120" placeholder="Se completa cuando MiPaquete confirma la guía" /></label>
          <label>PDF de la guía<input id="tracking-edit-url" type="url" placeholder="Enlace del PDF devuelto por MiPaquete" /></label>
          <label>Fecha estimada de entrega (opcional)<input id="tracking-edit-date" type="date" /><small>Completa una fecha exacta solo si el proveedor la informa.</small></label>
          <p id="tracking-shipment-message" role="status"></p>
          <div class="tracking-shipment-actions"><button class="shipping-action" type="button" data-tracking-action="create-guide">Generar guía MiPaquete</button><button class="shipping-action primary" type="submit">Guardar datos de guía</button></div>
        </section>
        <footer><button class="shipping-action" type="button" data-tracking-action="close">Cerrar</button></footer>
      </form>
    </dialog>
  </section>`;
}
