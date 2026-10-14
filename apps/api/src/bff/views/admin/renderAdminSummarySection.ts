import type { CatalogProductDto, CategoryDto } from '../../gateways/catalog/CatalogGateway.js';
import type { AnnouncementItemDto, BannerItemDto } from '../../gateways/storefront/StorefrontGateway.js';

interface AdminSummaryProps {
  products: CatalogProductDto[];
  categories: CategoryDto[];
  banners: BannerItemDto[];
  announcements: AnnouncementItemDto[];
}

export function renderAdminSummarySection(props: AdminSummaryProps): string {
  const published = props.products.filter((product) => product.status === 'published').length;
  const liveBanners = props.banners.filter(isBannerLive).length;
  const liveAnnouncements = props.announcements.filter((item) => item.isActive).length;
  const metrics = [
    ['Productos consultados', props.products.length, 'Datos cargados para este panel'],
    ['Productos publicados', published, 'Dentro de la lista consultada'],
    ['Categorías', props.categories.length, 'Disponibles en esta vista'],
    ['Banners y avisos activos', liveBanners + liveAnnouncements, 'Según su estado y vigencia'],
  ];
  return `<section id="tab-summary" class="tab-content admin-summary active" aria-labelledby="summary-title">
    <header class="summary-heading"><div><p class="summary-eyebrow">VEGA STORE · ADMINISTRACIÓN</p><h1 id="summary-title">Resumen</h1><p>Vista general del catálogo y la operación de tu tienda.</p></div>
      <button class="summary-icon-button" type="button" aria-label="Notificaciones" onclick="switchTab('orders'); loadAdminOrders()"><span aria-hidden="true">♧</span><span id="notification-bell-badge" class="notification-badge" style="display:none">0</span></button>
    </header>
    <section class="summary-metrics" aria-label="Indicadores del panel">${metrics.map(([label, value, note]) => metricCard(String(label), Number(value), String(note))).join('')}</section>
    <div class="summary-columns">
      <section class="summary-panel summary-orders" aria-labelledby="summary-orders-title">
        <div class="summary-panel-heading"><div><h2 id="summary-orders-title">Pedidos recientes</h2><p>Últimos pedidos disponibles para tu cuenta.</p></div><button type="button" class="summary-link-button" onclick="switchTab('orders'); loadAdminOrders()">Ver todos <span aria-hidden="true">→</span></button></div>
        <div class="summary-table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Ciudad</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody id="summary-orders-body"><tr><td colspan="6" class="summary-empty">Cargando pedidos autorizados…</td></tr></tbody></table></div>
      </section>
      <aside class="summary-panel summary-shortcuts" aria-labelledby="summary-shortcuts-title"><h2 id="summary-shortcuts-title">Accesos rápidos</h2><p>Continúa con las tareas habituales.</p>
        ${shortcut('＋', 'Crear o editar productos', 'products')}${shortcut('▦', 'Revisar inventario', 'inventory', 'loadAdminInventory()')}${shortcut('◇', 'Gestionar pagos', 'payments', 'loadAdminPayments()')}${shortcut('▧', 'Administrar banners', 'storefront')}
      </aside>
    </div>
  </section>`;
}

function metricCard(label: string, value: number, note: string): string {
  return `<article class="summary-metric"><p>${escapeHtml(label)}</p><strong>${value.toLocaleString('es-CO')}</strong><small>${escapeHtml(note)}</small></article>`;
}

function shortcut(icon: string, label: string, tab: string, extra = ''): string {
  return `<button type="button" class="summary-shortcut" onclick="switchTab('${tab}')${extra ? `; ${extra}` : ''}"><span aria-hidden="true">${icon}</span><strong>${escapeHtml(label)}</strong><span aria-hidden="true">→</span></button>`;
}

function isBannerLive(banner: BannerItemDto): boolean {
  const now = Date.now();
  return banner.isActive && (!banner.startsAt || Date.parse(banner.startsAt) <= now) && (!banner.endsAt || Date.parse(banner.endsAt) >= now);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
