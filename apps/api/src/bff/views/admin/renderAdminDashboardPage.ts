import type { AdminDashboardProps } from './AdminDashboardProps.js';
import { renderAdminDashboardCss } from './renderAdminDashboardCss.js';
import { renderInventoryDashboardCss } from './renderInventoryDashboardCss.js';
import { renderPaymentsDashboardCss } from './renderPaymentsDashboardCss.js';
import { renderShippingInvoicesDashboardCss } from './renderShippingInvoicesDashboardCss.js';
import { renderProductsDashboardCss } from './renderProductsDashboardCss.js';
import { renderTaxonomyDashboardCss } from './renderTaxonomyDashboardCss.js';
import { renderCmsDashboardCss } from './renderCmsDashboardCss.js';
import { renderAdminDashboardScript } from './renderAdminDashboardScript.js';
import { renderAdminSidebar } from './renderAdminSidebar.js';
import { renderAdminSummarySection } from './renderAdminSummarySection.js';
import { renderAdminSummaryScript } from './renderAdminSummaryScript.js';
import { renderAdminLegacyTabs } from './renderAdminLegacyTabs.js';
import { renderCopInputScript } from './renderCopInputScript.js';
import { renderStorefrontActionsScript } from './renderStorefrontActionsScript.js';
import { renderProductFormsScript } from './renderProductFormsScript.js';
import { renderProductListScript } from './renderProductListScript.js';
import { renderProductPricingScript } from './renderProductPricingScript.js';
import { renderStorefrontFormsScript } from './renderStorefrontFormsScript.js';
import { renderCmsFormsScript } from './renderCmsFormsScript.js';
import { renderPromotionsFormsScript } from './renderPromotionsFormsScript.js';
import { renderPromotionsHandlersScript } from './renderPromotionsHandlersScript.js';
import { renderShippingFormsScript } from './renderShippingFormsScript.js';
import { renderFreeShippingRulesScript } from './renderFreeShippingRulesScript.js';
import { renderMiPaqueteConfigScript } from './renderMiPaqueteConfigScript.js';
import { renderCmsEditorToolbarScript } from './renderCmsEditorToolbarScript.js';
import { renderShippingHandlersScript } from './renderShippingHandlersScript.js';
import { renderTaxonomyFormsScript } from './renderTaxonomyFormsScript.js';
import { renderTaxonomyActionsScript } from './renderTaxonomyActionsScript.js';
import { renderCollectionFormScript } from './renderCollectionFormScript.js';
import { renderBrandImageScript } from './renderBrandImageScript.js';
import { renderPhase8AdminScript } from './renderPhase8AdminScript.js';
import { renderProductPriceMigrationScript } from './renderProductPriceMigrationScript.js';
import { renderMarketingNavigationScript } from './renderMarketingNavigationScript.js';
import { renderAdminActionTokensCss } from './renderAdminActionTokensCss.js';
import { renderMarketingDashboardCss } from './renderMarketingDashboardCss.js';
import { renderSystemDashboardCss } from './renderSystemDashboardCss.js';
import { renderAdminPaginationCss } from './renderAdminPaginationCss.js';
import { renderAdminPaginationScript } from './renderAdminPaginationScript.js';
import { renderBlogDashboardCss } from './renderBlogDashboardCss.js';
import { renderBlogAdminScript } from './renderBlogAdminScript.js';
import { renderAdminReviewsCss } from './renderAdminReviewsCss.js';
import { renderAdminReviewsScript } from './renderAdminReviewsScript.js';
import { renderMenuAdminCss } from './renderMenuAdminCss.js';
import { renderMenuAdminScript } from './renderMenuAdminScript.js';
import { renderOrderTrackingAdminScript } from './renderOrderTrackingAdminScript.js';
import { renderOrderTrackingAdminCss } from './renderOrderTrackingAdminCss.js';
import { renderAdminNavigationStateScript } from './renderAdminNavigationStateScript.js';
import { renderProductEditorialFieldsScript } from './renderProductEditorialFieldsScript.js';

export function renderAdminDashboardPage(props: AdminDashboardProps): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Administración | Vega Store</title>
  <style>${renderAdminDashboardCss()}${renderInventoryDashboardCss()}${renderPaymentsDashboardCss()}${renderShippingInvoicesDashboardCss()}${renderProductsDashboardCss()}${renderTaxonomyDashboardCss()}${renderCmsDashboardCss()}${renderBlogDashboardCss()}${renderAdminReviewsCss()}${renderMenuAdminCss()}${renderMarketingDashboardCss()}${renderSystemDashboardCss()}${renderAdminPaginationCss()}${renderAdminActionTokensCss()}${renderOrderTrackingAdminCss()}</style>
</head>
<body>
  <a class="skip-link" href="#admin-main">Saltar al contenido</a>
  <div class="admin-shell">
    ${renderAdminSidebar(props.adminEmail)}
    <main id="admin-main" class="admin-main" tabindex="-1">
      <header class="admin-topbar"><div><p>VEGA STORE · ADMINISTRACIÓN</p><h1>Panel de administración</h1></div><span>Sesión: ${escapeHtml(props.adminEmail)}</span></header>
      ${renderAdminSummarySection(props)}
      <div id="admin-legacy-tabs" class="admin-legacy-pane" hidden>
        ${renderAdminLegacyTabs(props)}
      </div>
    </main>
  </div>
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
  <script>${renderAdminPaginationScript()}</script>
  <script>${renderCopInputScript()}</script>
  <script>${renderAdminNavigationStateScript()}</script>
  <script>${renderProductPricingScript()}</script>
  <script>${renderProductEditorialFieldsScript()}</script>
  <script>${renderAdminDashboardScript()}</script>
  <script>${renderAdminSummaryScript()}</script>
  <script>${renderStorefrontActionsScript()}</script>
  <script>${renderProductFormsScript()}</script>
  ${renderProductListScript()}
  <script>${renderProductPriceMigrationScript()}</script>
  <script>${renderTaxonomyFormsScript()}</script>
  <script>${renderTaxonomyActionsScript()}</script>
  <script>${renderCollectionFormScript()}</script>
  <script>${renderBrandImageScript()}</script>
  <script>${renderMarketingNavigationScript()}</script>
  <script>${renderStorefrontFormsScript()}</script>
  <script>${renderCmsEditorToolbarScript()}</script>
  <script>${renderCmsFormsScript()}</script>
  <script>${renderBlogAdminScript()}</script>
  <script>${renderMenuAdminScript()}</script>
  <script>${renderAdminReviewsScript()}</script>
  <script>${renderPromotionsFormsScript()}</script>
  <script>${renderPromotionsHandlersScript()}</script>
  <script>${renderShippingFormsScript()}</script>
  <script>${renderFreeShippingRulesScript()}</script>
  <script>${renderMiPaqueteConfigScript()}</script>
  <script>${renderOrderTrackingAdminScript()}</script>
  <script>${renderShippingHandlersScript()}</script>
  <script>${renderPhase8AdminScript()}</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
