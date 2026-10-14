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

export function renderAdminLegacyTabs(props: AdminDashboardProps): string {
  return `    <div id="tab-products" class="tab-content active">
      ${renderProductFormCard(props.shippingZones, props.settings.taxRatePercent)}
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
          <p style="color:#94a3b8;font-size:.8rem;">Los enlaces sociales deben ser HTTPS y pertenecer a Instagram, TikTok o Facebook. Déjalos vacíos para ocultar sus iconos.</p>
          <button type="submit" class="btn-primary">Guardar Configuración</button>
          <div id="sMsg" class="msg"></div>
        </form>
      </div>
    </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
