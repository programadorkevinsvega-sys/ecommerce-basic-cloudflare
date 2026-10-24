import { renderInventoryAdjustModal } from './renderInventoryAdjustModal.js';

export function renderInventoryManagementSection(): string {
  return `<section class="inventory-screen" aria-labelledby="inventory-title">
    <header class="inventory-heading"><div><h1 id="inventory-title">Inventario</h1><p>Stock en tiempo real por producto. Ajusta entradas, salidas y correcciones.</p></div>
      <div class="inventory-heading-actions"><button class="inventory-primary-button" id="inventory-export" type="button">Exportar página</button></div>
    </header>
    <div id="inventory-message" class="inventory-message" role="status" hidden></div>
    <section class="inventory-kpis" aria-label="Resumen del inventario">
      ${metric('inv-kpi-total', 'SKUs registrados', 'Productos con inventario')}
      ${metric('inv-kpi-available', 'Unidades disponibles', 'Stock menos unidades reservadas')}
      ${metric('inv-kpi-reserved', 'Unidades reservadas', 'Apartadas para pedidos')}
      ${metric('inv-kpi-low', 'Alertas de stock', 'Disponibles por debajo de 10 unidades')}
    </section>
    <div class="inventory-columns">
      <section class="inventory-card inventory-list" aria-label="Stock por producto">
        <div class="inventory-status-tabs" role="group" aria-label="Filtrar por nivel de stock">
          ${filterTab('all', 'Todos')}${filterTab('low', 'Stock bajo')}${filterTab('out', 'Agotado')}
        </div>
        <div class="inventory-search-wrap"><label class="inventory-search">${searchIcon()}<span class="sr-only">Buscar producto o SKU</span><input id="inventory-search" type="search" placeholder="Buscar producto o SKU"></label></div>
        <div id="inventory-empty" class="inventory-empty" role="status" hidden><h2>Ningún producto coincide</h2><p>Cambia el nivel de stock o borra la búsqueda para ver todo el inventario.</p><button class="inventory-primary-button" id="inventory-reset" type="button">Quitar filtros</button></div>
        <div id="inventory-table-region" class="inventory-table-region" role="region" aria-label="Tabla de inventario, desplazable" tabindex="0">
          <table class="inventory-table"><thead><tr><th>Producto</th><th>Stock total · reservado · disponible</th><th class="inventory-align-right">Umbral</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody id="inventory-table-body"><tr><td colspan="5" class="inventory-loading">Carga el inventario para consultar existencias…</td></tr></tbody></table>
        </div>
        <div id="inventory-summary" class="inventory-summary" aria-live="polite">—</div>
        <nav id="inventory-pagination" class="taxonomy-pagination" aria-label="Paginación del inventario"></nav>
      </section>
      <aside class="inventory-card inventory-movement-card" aria-labelledby="inventory-movements-title"><h2 id="inventory-movements-title">Movimientos recientes</h2><p class="inventory-movement-caption">Ajustes registrados en la bitácora administrativa.</p><ul id="inventory-movements" class="inventory-movements" aria-live="polite"><li class="inventory-movement-empty">Cargando movimientos…</li></ul></aside>
    </div>
    ${renderInventoryAdjustModal()}
  </section>`;
}

function metric(id: string, label: string, note: string): string {
  return `<article class="inventory-metric"><span>${label}</span><strong id="${id}">—</strong><small>${note}</small></article>`;
}

function filterTab(level: string, label: string): string {
  return `<button class="inventory-filter-tab${level === 'all' ? ' selected' : ''}" type="button" data-inventory-level="${level}" aria-pressed="${level === 'all'}">${label}<span data-inventory-count="${level}">0</span></button>`;
}

function searchIcon(): string {
  return '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
}
