import { CatalogProductDto, CategoryDto, BrandDto, AttributeDto } from '../../gateways/catalog/CatalogGateway.js';
import { BannerItemDto, AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';
import { StoreSettingsResponse as SettingsDto } from '../../gateways/settings/SettingsGateway.js';
import { CmsPageDto } from '../../gateways/cms/CmsGateway.js';
import { PromotionRuleDto, CouponDto } from '../../gateways/promotions/PromotionsGateway.js';
import { ShippingZoneDto, DivipolaLocationDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderAdminDashboardCss } from './renderAdminDashboardCss.js';
import { renderAdminDashboardScript } from './renderAdminDashboardScript.js';
import { renderStorefrontActionsScript } from './renderStorefrontActionsScript.js';
import { renderProductFormsScript } from './renderProductFormsScript.js';
import { renderStorefrontFormsScript } from './renderStorefrontFormsScript.js';
import { renderCmsFormsScript } from './renderCmsFormsScript.js';
import { renderPromotionsFormsScript } from './renderPromotionsFormsScript.js';
import { renderPromotionsHandlersScript } from './renderPromotionsHandlersScript.js';
import { renderShippingFormsScript } from './renderShippingFormsScript.js';
import { renderCmsEditorToolbarScript } from './renderCmsEditorToolbarScript.js';
import { renderShippingHandlersScript } from './renderShippingHandlersScript.js';
import { renderTaxonomyFormsScript } from './renderTaxonomyFormsScript.js';
import { renderPhase8AdminScript } from './renderPhase8AdminScript.js';
import { renderCatalogManagementSection } from './renderCatalogManagementSection.js';
import { renderProductFormCard } from './renderProductFormCard.js';
import { renderProductTable } from './renderProductTable.js';
import { renderStorefrontManagementSection } from './renderStorefrontManagementSection.js';
import { renderCmsManagementSection } from './renderCmsManagementSection.js';
import { renderPromotionsManagementSection } from './renderPromotionsManagementSection.js';
import { renderShippingManagementSection } from './renderShippingManagementSection.js';
import { renderOrdersManagementSection } from './renderOrdersManagementSection.js';
import { renderInventoryManagementSection } from './renderInventoryManagementSection.js';
import { renderPaymentsManagementSection } from './renderPaymentsManagementSection.js';
import { renderInvoicesManagementSection } from './renderInvoicesManagementSection.js';
import { renderAuditManagementSection } from './renderAuditManagementSection.js';

export interface AdminDashboardProps {
  products: CatalogProductDto[];
  categories: CategoryDto[];
  brands: BrandDto[];
  attributes: AttributeDto[];
  banners: BannerItemDto[];
  announcements: AnnouncementItemDto[];
  cmsPages: CmsPageDto[];
  promotionRules: PromotionRuleDto[];
  coupons: CouponDto[];
  shippingZones: ShippingZoneDto[];
  divipolaLocations: DivipolaLocationDto[];
  settings: SettingsDto;
  adminEmail: string;
}

export function renderAdminDashboardPage(props: AdminDashboardProps): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Administración | Vega Store</title>
  <style>${renderAdminDashboardCss()}</style>
</head>
<body>
  <header>
    <div class="brand">Vega Store — Panel de Control</div>
    <div class="nav-user">
      <span style="position:relative; margin-right:1rem; cursor:pointer;" onclick="switchTab('orders')">
        🔔 <span id="notification-bell-badge" style="display:none; background:#ef4444; color:#fff; border-radius:50%; font-size:0.75rem; padding:0.15rem 0.4rem; font-weight:700;">0</span>
      </span>
      <span>🛡️ ${escapeHtml(props.adminEmail)}</span>
      <button class="btn-logout" id="logoutBtn">Cerrar Sesión</button>
    </div>
  </header>
  <main class="container">
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('products')">Catálogo & Productos</button>
      <button class="tab-btn" onclick="switchTab('orders'); loadAdminOrders();">Pedidos 📦</button>
      <button class="tab-btn" onclick="switchTab('inventory'); loadAdminInventory();">Inventario 📊</button>
      <button class="tab-btn" onclick="switchTab('payments'); loadAdminPayments();">Pagos & Recaudos 💳</button>
      <button class="tab-btn" onclick="switchTab('taxonomies')">Categorías & Marcas</button>
      <button class="tab-btn" onclick="switchTab('storefront')">Banners & Anuncios</button>
      <button class="tab-btn" onclick="switchTab('cms')">Páginas CMS</button>
      <button class="tab-btn" onclick="switchTab('promotions')">Promociones & Cupones</button>
      <button class="tab-btn" onclick="switchTab('shipping')">Envíos & Cobertura</button>
      <button class="tab-btn" onclick="switchTab('invoices'); loadAdminInvoices();">Facturación 🧾</button>
      <button class="tab-btn" onclick="switchTab('audit'); loadAdminAudit();">Auditoría 📜</button>
      <button class="tab-btn" onclick="switchTab('settings')">Configuración</button>
    </div>

    <div id="tab-products" class="tab-content active">
      ${renderProductFormCard(props.shippingZones)}
      ${renderProductTable(props.products)}
    </div>

    <div id="tab-orders" class="tab-content">
      ${renderOrdersManagementSection()}
    </div>

    <div id="tab-inventory" class="tab-content">
      ${renderInventoryManagementSection()}
    </div>

    <div id="tab-payments" class="tab-content">
      ${renderPaymentsManagementSection()}
    </div>

    <div id="tab-invoices" class="tab-content">
      ${renderInvoicesManagementSection()}
    </div>

    <div id="tab-audit" class="tab-content">
      ${renderAuditManagementSection()}
    </div>

    <div id="tab-taxonomies" class="tab-content">
      ${renderCatalogManagementSection(props.categories, props.brands, props.attributes)}
    </div>

    <div id="tab-storefront" class="tab-content">
      ${renderStorefrontManagementSection(props.banners, props.announcements)}
    </div>

    <div id="tab-cms" class="tab-content">
      ${renderCmsManagementSection(props.cmsPages)}
    </div>

    <div id="tab-promotions" class="tab-content">
      ${renderPromotionsManagementSection(props.promotionRules, props.coupons, props.products, props.categories)}
    </div>

    <div id="tab-shipping" class="tab-content">
      ${renderShippingManagementSection(props.shippingZones, props.divipolaLocations)}
    </div>

    <div id="tab-settings" class="tab-content">
      <div class="card">
        <h2>Configuración de la Tienda</h2>
        <form id="settingsForm">
          <div class="form-grid">
            <div><label>Nombre Comercial</label><input type="text" id="sName" value="${escapeHtml(props.settings.storeName)}" required /></div>
            <div><label>Moneda</label><input type="text" id="sCurrency" value="${escapeHtml(props.settings.currency)}" readonly style="opacity:0.6;" /></div>
            <div><label>NIT / Cédula Fiscal</label><input type="text" id="sNit" placeholder="Ej: 900.123.456-7" value="${escapeHtml(props.settings.companyNit || '')}" /></div>
            <div><label>Razón Social / Propietario</label><input type="text" id="sLegal" placeholder="Ej: JNM Tortas S.A.S." value="${escapeHtml(props.settings.companyLegalName || '')}" /></div>
            <div><label>Dirección / Ciudad</label><input type="text" id="sAddress" placeholder="Ej: Calle 123, Medellín, Colombia" value="${escapeHtml(props.settings.companyAddress || '')}" /></div>
            <div><label>IVA (%)</label><input type="number" id="sTax" value="${props.settings.taxRatePercent}" required /></div>
            <div><label>Email de Soporte</label><input type="email" id="sEmail" value="${escapeHtml(props.settings.supportEmail || '')}" /></div>
            <div><label>Teléfono / WhatsApp</label><input type="text" id="sPhone" value="${escapeHtml(props.settings.supportPhone || '')}" /></div>
          </div>
          <button type="submit" class="btn-primary">Guardar Configuración</button>
          <div id="sMsg" class="msg"></div>
        </form>
      </div>
    </div>
  </main>
  <script>
    // Las operaciones same-origin envían automáticamente la cookie HttpOnly.
    window.adminHeaders = function(isJson) {
      const h = {};
      if (isJson) h['Content-Type'] = 'application/json';
      return h;
    };
    function escapeHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }
    window.escapeHtml = escapeHtml;
  </script>
  <script>${renderAdminDashboardScript()}</script>
  <script>${renderStorefrontActionsScript()}</script>
  <script>${renderProductFormsScript()}</script>
  <script>${renderTaxonomyFormsScript()}</script>
  <script>${renderStorefrontFormsScript()}</script>
  <script>${renderCmsEditorToolbarScript()}</script>
  <script>${renderCmsFormsScript()}</script>
  <script>${renderPromotionsFormsScript()}</script>
  <script>${renderPromotionsHandlersScript()}</script>
  <script>${renderShippingFormsScript()}</script>
  <script>${renderShippingHandlersScript()}</script>
  <script>${renderPhase8AdminScript()}</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
