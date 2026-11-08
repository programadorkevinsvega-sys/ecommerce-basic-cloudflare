import type { CategoryDto } from '../../gateways/catalog/CatalogGateway.js';
import type { ProductAdminListItem } from '../../../modules/catalog/domain/ports/ProductAdminListItem.js';
import type { AnnouncementItemDto, BannerItemDto } from '../../gateways/storefront/StorefrontGateway.js';

interface AdminSummaryProps {
  products: ProductAdminListItem[];
  categories: CategoryDto[];
  banners: BannerItemDto[];
  announcements: AnnouncementItemDto[];
}

export function renderAdminSummarySection(props: AdminSummaryProps): string {
  const expiringBanners = props.banners.filter((banner) => isBannerLive(banner) && banner.endsAt && Date.parse(banner.endsAt) < Date.now() + 3 * 86400000).length;
  return `<section id="tab-summary" class="tab-content admin-summary active" aria-labelledby="summary-title">
    <header class="summary-heading"><div class="summary-title-group"><h1 id="summary-title">Resumen</h1><span class="summary-sample-label">Datos operativos</span><p id="summary-date-caption">Pedidos disponibles · últimos 30 días</p></div>
      <div class="summary-toolbar">      <label class="summary-search"><span class="sr-only">Buscar pedido, cliente o ciudad</span><input id="summary-search" type="search" placeholder="Buscar pedido, cliente o ciudad" oninput="filterAdminSummary()" /></label>
        <label class="summary-range-label"><span class="sr-only">Rango del resumen</span><select id="summary-range" onchange="filterAdminSummary()"><option value="30">Últimos 30 días</option><option value="7">Últimos 7 días</option><option value="90">Últimos 90 días</option></select></label>
        <button class="summary-icon-button" type="button" aria-label="Notificaciones" onclick="switchTab('orders'); loadAdminOrders()"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span id="notification-bell-badge" class="notification-badge" style="display:none">0</span></button>
        <button class="summary-export-button" type="button" onclick="exportAdminSummary()">Exportar informe</button>
      </div>
    </header>
    <section class="summary-metrics" aria-label="Indicadores de ventas">
      ${metricCard('Ventas pagadas (COP)', 'summary-sales', 'Suma de pedidos pagados en la muestra')}
      ${metricCard('Pedidos', 'summary-orders-count', 'Pedidos dentro del periodo seleccionado')}
      ${metricCard('Ticket promedio (COP)', 'summary-average-ticket', 'Promedio de pedidos con pago aprobado')}
      ${metricCard('Pedidos pagados', 'summary-paid-rate', 'Con pago aprobado o recaudo confirmado')}
    </section>
    <div class="summary-analytics-grid">
      <section class="summary-panel summary-chart-panel" aria-labelledby="summary-chart-title">
        <div class="summary-panel-heading"><div><h2 id="summary-chart-title">Ventas diarias</h2><p>Pesos colombianos (COP), por día</p></div><strong id="summary-daily-average" class="summary-chart-average">—</strong></div>
        <div id="summary-chart" class="summary-chart" role="img" aria-label="Gráfico de ventas por día"><p class="summary-empty">Cargando ventas…</p></div>
      </section>
      <section class="summary-panel summary-status-panel" aria-labelledby="summary-status-title"><h2 id="summary-status-title">Pedidos por estado</h2><p id="summary-status-total" class="summary-status-caption">En el periodo</p><div id="summary-status-list" class="summary-status-list"></div></section>
    </div>
    <div class="summary-bottom-grid">
      <section class="summary-panel summary-orders" aria-labelledby="summary-orders-title">
        <div class="summary-panel-heading"><div><h2 id="summary-orders-title">Pedidos recientes</h2><p>Pedidos disponibles para tu cuenta · máximo 100</p></div><button type="button" class="summary-link-button" onclick="switchTab('orders'); loadAdminOrders()">Ver todos <span aria-hidden="true">→</span></button></div>
        <div class="summary-table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Ciudad</th><th>Medio de pago</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody id="summary-orders-body"><tr><td colspan="6" class="summary-empty">Cargando pedidos autorizados…</td></tr></tbody></table></div>
      </section>
      <aside class="summary-panel summary-attention" aria-labelledby="summary-attention-title"><h2 id="summary-attention-title">Requiere atención</h2><p>Elementos que puedes revisar ahora.</p><div id="summary-attention-list" data-expiring-banners="${expiringBanners}"><p class="summary-empty">Cargando alertas…</p></div>
      </aside>
    </div>
  </section>`;
}

function metricCard(label: string, valueId: string, note: string): string {
  return `<article class="summary-metric"><p>${escapeHtml(label)}</p><strong id="${valueId}">—</strong><small>${escapeHtml(note)}</small></article>`;
}

function isBannerLive(banner: BannerItemDto): boolean {
  const now = Date.now();
  return banner.isActive && (!banner.startsAt || Date.parse(banner.startsAt) <= now) && (!banner.endsAt || Date.parse(banner.endsAt) >= now);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
