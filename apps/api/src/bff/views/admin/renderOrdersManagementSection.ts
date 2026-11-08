import { renderAdminOrderDetailModal } from './renderAdminOrderDetailModal.js';

export function renderOrdersManagementSection(): string {
  return `<section class="orders-screen" aria-labelledby="orders-title">
    <header class="orders-heading"><div><h1 id="orders-title">Pedidos</h1><p>Consulta los artículos comprados y la dirección de entrega, y gestiona el estado de envío y de pago.</p></div>
      <div class="orders-heading-actions"><button class="orders-primary-button" id="orders-export" type="button">Exportar pedidos</button></div>
    </header>
    <section class="orders-card" aria-label="Lista de pedidos">
      <div class="orders-status-tabs" role="group" aria-label="Filtrar por estado del pedido">
        ${statusTab('all', 'Todos')}${statusTab('placed', 'Recibidos')}${statusTab('confirmed', 'Confirmados')}${statusTab('prepared', 'Preparados')}${statusTab('shipped', 'Enviados')}${statusTab('delivered', 'Entregados')}${statusTab('cancelled', 'Cancelados')}
      </div>
      <div class="orders-filters">
        <label class="orders-search">${icon('search')}<span class="sr-only">Buscar por pedido, cliente o teléfono</span><input id="orders-search" type="search" placeholder="Buscar pedido, cliente o teléfono"></label>
        <label class="orders-select-label" for="orders-method-filter">Método<select id="orders-method-filter"><option value="all">Todos</option><option value="wompi">Wompi</option><option value="cod">Contra entrega</option></select></label>
        <label class="orders-select-label" for="orders-payment-filter">Pago<select id="orders-payment-filter"><option value="all">Todos</option><option value="approved">Aprobado</option><option value="pending">Pendiente</option></select></label>
      </div>
      <div id="orders-empty" class="orders-empty" role="status" hidden><h2>Ningún pedido coincide</h2><p>Prueba con otro estado o quita la búsqueda para ver los pedidos.</p><button class="orders-primary-button" id="orders-reset-filters" type="button">Quitar filtros</button></div>
      <div id="orders-table-region" class="orders-table-region" role="region" aria-label="Tabla de pedidos, desplazable" tabindex="0">
        <table class="orders-table"><thead><tr><th>Pedido</th><th>Cliente</th><th class="orders-align-right">Total</th><th>Método</th><th>Estado</th><th>Pago</th><th>Acciones</th></tr></thead>
        <tbody id="orders-table-body"><tr><td colspan="7" class="orders-loading">Cargando pedidos…</td></tr></tbody></table>
      </div>
      <nav id="orders-pagination" class="admin-pagination" aria-label="Paginación de pedidos"></nav>
      <div id="orders-summary" class="orders-summary" aria-live="polite"><span>Esperando pedidos…</span><span>Total mostrado <strong>—</strong></span></div>
    </section>
    ${renderAdminOrderDetailModal()}
  </section>`;
}

function statusTab(status: string, label: string): string {
  return `<button class="order-filter-tab${status === 'all' ? ' selected' : ''}" type="button" data-orders-status="${status}" aria-pressed="${status === 'all'}">${label}</button>`;
}

function icon(name: 'refresh' | 'search'): string {
  return name === 'refresh'
    ? '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3L20 9 M20 4v5h-5 M20 12a8 8 0 0 1-14 5.3L4 15 M4 20v-5h5"/></svg>'
    : '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
}
