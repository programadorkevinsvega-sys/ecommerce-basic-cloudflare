export function renderOrderTrackingAdminSection(): string {
  return `<section class="order-tracking-admin" data-shipping-panel="tracking" hidden aria-labelledby="order-tracking-admin-title">
    <header class="shipping-heading"><div><h1 id="order-tracking-admin-title">Seguimiento de pedidos</h1><p>Actualiza la preparación y la información de envío que verá el cliente.</p></div></header>
    <section class="card tracking-admin-card">
      <div class="tracking-admin-filters"><label>Buscar pedido o cliente<input id="tracking-admin-query" type="search" placeholder="Número de pedido, nombre o correo" /></label>
      <label>Estado<select id="tracking-admin-status"><option value="">Todos</option><option value="confirmed">Confirmado</option><option value="prepared">Preparado</option><option value="shipped">Enviado</option><option value="delivered">Entregado</option></select></label>
      <button class="shipping-action primary" type="button" onclick="loadAdminOrderTracking(1)">Buscar</button></div>
      <div class="shipping-table-scroll"><table class="shipping-table tracking-admin-table"><thead><tr><th>Pedido / Cliente</th><th>Estado</th><th>Transportadora / Guía</th><th>Entrega estimada</th><th>Acciones</th></tr></thead><tbody id="order-tracking-admin-body"><tr><td colspan="5" class="shipping-empty">Carga el seguimiento de pedidos.</td></tr></tbody></table></div>
      <nav class="admin-pagination" id="order-tracking-admin-pagination" aria-label="Paginación de seguimiento de pedidos"><button class="admin-page-button" type="button" data-page-direction="previous" disabled>Anterior</button><span>Página 1</span><button class="admin-page-button" type="button" data-page-direction="next" disabled>Siguiente</button></nav>
    </section>
    <dialog id="order-tracking-edit-dialog" class="shipping-detail-dialog tracking-admin-dialog" aria-labelledby="tracking-edit-title">
      <form id="order-tracking-edit-form"><header><div><h2 id="tracking-edit-title">Actualizar seguimiento</h2><p id="tracking-edit-customer"></p></div><button class="shipping-modal-close" type="button" onclick="closeOrderTrackingEditor()" aria-label="Cerrar">×</button></header>
        <input id="tracking-edit-order-id" type="hidden" />
        <label>Transportadora<input id="tracking-edit-carrier" maxlength="100" placeholder="Ej. Coordinadora" /></label>
        <label>Número de guía<input id="tracking-edit-number" maxlength="120" placeholder="Número de guía" /></label>
        <label>Enlace de seguimiento<input id="tracking-edit-url" type="url" placeholder="https://…" /></label>
        <label>Fecha estimada de entrega<input id="tracking-edit-date" type="date" /></label>
        <section class="tracking-admin-timeline"><h3>Historial del pedido</h3><ol id="tracking-edit-timeline"></ol></section>
        <label>Estado actual<select id="tracking-edit-status" onchange="updateOrderTrackingStatusActionState()"><option value="placed">Recibido</option><option value="confirmed">Confirmado</option><option value="prepared">Preparado</option><option value="shipped">Enviado</option><option value="delivered">Entregado</option><option value="cancelled">Cancelado</option></select></label>
        <label>Nota del cambio (opcional)<input id="tracking-edit-status-note" maxlength="300" /></label>
        <button id="tracking-edit-status-submit" class="shipping-action" type="button" onclick="saveOrderTrackingStatus()">Actualizar estado</button>
        <p id="tracking-edit-message" role="status"></p><footer><button class="shipping-action" type="button" onclick="closeOrderTrackingEditor()">Cancelar</button><button class="shipping-action primary" type="submit">Guardar seguimiento</button></footer>
      </form>
    </dialog>
  </section>`;
}
