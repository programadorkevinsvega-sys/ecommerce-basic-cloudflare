import type { AdminDashboardProps } from './AdminDashboardProps.js';
import { renderProductFormCard } from './renderProductFormCard.js';
import { renderProductTable } from './renderProductTable.js';
import { renderOrdersManagementSection } from './renderOrdersManagementSection.js';
import { renderInventoryManagementSection } from './renderInventoryManagementSection.js';
import { renderPaymentsManagementSection } from './renderPaymentsManagementSection.js';
import { renderInvoicesManagementSection } from './renderInvoicesManagementSection.js';
import { renderAuditManagementSection } from './renderAuditManagementSection.js';
import { renderCatalogManagementSection } from './renderCatalogManagementSection.js';
import { renderStorefrontManagementSection } from './renderStorefrontManagementSection.js';
import { renderCmsManagementSection } from './renderCmsManagementSection.js';
import { renderPromotionsManagementSection } from './renderPromotionsManagementSection.js';
import { renderShippingManagementSection } from './renderShippingManagementSection.js';
import { renderOrderTrackingAdminSection } from './renderOrderTrackingAdminSection.js';
import { renderBlogManagementSection } from './renderBlogManagementSection.js';
import { renderAdminReviewsSection } from './renderAdminReviewsSection.js';
import { renderMenuManagementSection } from './renderMenuManagementSection.js';

export function renderAdminLegacyTabs(props: AdminDashboardProps): string {
  return `    <div id="tab-products" class="tab-content active">
      ${renderProductTable(props.products)}
      ${renderProductFormCard(props.shippingZones, props.settings.taxRatePercent, props.brands, props.products.map((product) => product.brand || ''), props.attributes, props.productTags || [], props.blogPosts || [])}
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
      ${renderCatalogManagementSection(props.categories, props.brands, props.attributes, props.suppliers, props.variants, props.products, props.collections, props.productTags || [])}
    </div>

    <div id="tab-storefront" class="tab-content">
      <header class="marketing-page-heading"><h1 class="marketing-page-title">Banners Hero Promocionales</h1><p class="marketing-page-description">Campañas visuales con CTA para la tienda.</p></header>
      ${renderStorefrontManagementSection(props.banners, props.announcements, props.marketingDestinations || [])}
    </div>

    <div id="tab-cms" class="tab-content">
      ${renderCmsManagementSection(props.cmsPages)}
    </div>

    <div id="tab-menus" class="tab-content">${renderMenuManagementSection()}</div>

    <div id="tab-blog" class="tab-content">
      ${renderBlogManagementSection()}
    </div>

    <div id="tab-reviews" class="tab-content">
      ${renderAdminReviewsSection(props.reviewCanCreate, props.reviewCanEdit, props.reviewCanDelete)}
    </div>

    <div id="tab-promotions" class="tab-content">
      <header class="marketing-page-heading"><h1 class="marketing-page-title">Regla de Promoción</h1><p class="marketing-page-description">Descuentos automáticos aplicados según las reglas configuradas.</p></header>
      ${renderPromotionsManagementSection(props.promotionRules, props.coupons, props.products, props.categories)}
    </div>

    <div id="tab-shipping" class="tab-content">
      ${renderShippingManagementSection(props.shippingZones, props.divipolaLocations, props.shippingCarrierConfig)}
      ${renderOrderTrackingAdminSection()}
    </div>

    <div id="tab-settings" class="tab-content">
      <section class="settings-screen">
        <header class="settings-heading"><span class="settings-eyebrow">SISTEMA</span><h1>Configuración</h1><p>Administra la identidad, contacto y datos comerciales de tu tienda.</p></header>
        <div class="settings-card">
        <div class="settings-card-heading"><h2>Datos de la tienda</h2><p>Estos datos se muestran en el sitio y en los documentos comerciales.</p></div>
        <form id="settingsForm">
          <div class="form-grid">
            <div><label>Nombre Comercial</label><input type="text" id="sName" value="${escapeHtml(props.settings.storeName)}" required /></div>
            <div><label>Texto de derechos reservados</label><input type="text" id="sFooterCopyright" maxlength="160" placeholder="Todos los derechos reservados." value="${escapeHtml(props.settings.footerCopyrightText || 'Todos los derechos reservados.')}" /><small>El año del footer se actualiza automáticamente.</small></div>
            <div><label>Moneda</label><input type="text" id="sCurrency" value="${escapeHtml(props.settings.currency)}" readonly style="opacity:0.6;" /></div>
            <div><label>NIT / Cédula Fiscal</label><input type="text" id="sNit" placeholder="Ej: 900.123.456-7" value="${escapeHtml(props.settings.companyNit || '')}" /></div>
            <div><label>Razón Social / Propietario</label><input type="text" id="sLegal" placeholder="Ej: JNM Tortas S.A.S." value="${escapeHtml(props.settings.companyLegalName || '')}" /></div>
            <div><label>Dirección</label><input type="text" id="sAddress" placeholder="Ej: Calle 123 #45-67, local 2" value="${escapeHtml(props.settings.companyAddress || '')}" /></div>
            <div><label>Ciudad de la tienda</label><input type="text" id="sCity" placeholder="Ej: Medellín" value="${escapeHtml(props.settings.companyCity || '')}" /></div>
            <div><label>País</label><input type="text" id="sCountry" placeholder="Ej: Colombia" value="${escapeHtml(props.settings.companyCountry || '')}" /></div>
            <div><label>IVA (%)</label><input type="number" id="sTax" value="${props.settings.taxRatePercent}" required /></div>
            <div><label>Email de Soporte</label><input type="email" id="sEmail" value="${escapeHtml(props.settings.supportEmail || '')}" /></div>
            <div><label>Teléfono / WhatsApp</label><input type="text" id="sPhone" value="${escapeHtml(props.settings.supportPhone || '')}" /></div>
            <div><label>Instagram (URL)</label><input type="url" id="sInstagram" placeholder="https://www.instagram.com/tu_tienda/" value="${escapeHtml(props.settings.socialInstagramUrl || '')}" /></div>
            <div><label>TikTok (URL)</label><input type="url" id="sTiktok" placeholder="https://www.tiktok.com/@tu_tienda" value="${escapeHtml(props.settings.socialTiktokUrl || '')}" /></div>
            <div><label>Facebook (URL)</label><input type="url" id="sFacebook" placeholder="https://www.facebook.com/tu_tienda" value="${escapeHtml(props.settings.socialFacebookUrl || '')}" /></div>
          </div>
          <p class="settings-help">Los enlaces sociales deben ser HTTPS y pertenecer a Instagram, TikTok o Facebook. Déjalos vacíos para ocultar sus iconos.</p>
          <div class="settings-actions"><button type="submit" class="btn-primary">Guardar Configuración</button></div>
          <div id="sMsg" class="msg"></div>
        </form>
        </div>
      </section>
    </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
