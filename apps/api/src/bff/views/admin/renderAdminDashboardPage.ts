import { CatalogProductDto, CategoryDto, BrandDto, AttributeDto } from '../../gateways/catalog/CatalogGateway.js';
import { BannerItemDto, AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';
import { StoreSettingsResponse as SettingsDto } from '../../gateways/settings/SettingsGateway.js';
import { renderAdminDashboardCss } from './renderAdminDashboardCss.js';
import { renderAdminDashboardScript } from './renderAdminDashboardScript.js';
import { renderAdminFormsScript } from './renderAdminFormsScript.js';
import { renderCatalogManagementSection } from './renderCatalogManagementSection.js';
import { renderProductTable } from './renderProductTable.js';
import { renderStorefrontManagementSection } from './renderStorefrontManagementSection.js';

export interface AdminDashboardProps {
  products: CatalogProductDto[];
  categories: CategoryDto[];
  brands: BrandDto[];
  attributes: AttributeDto[];
  banners: BannerItemDto[];
  announcements: AnnouncementItemDto[];
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
      <span>🛡️ ${escapeHtml(props.adminEmail)}</span>
      <button class="btn-logout" id="logoutBtn">Cerrar Sesión</button>
    </div>
  </header>
  <main class="container">
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('products')">Catálogo & Productos</button>
      <button class="tab-btn" onclick="switchTab('taxonomies')">Categorías & Marcas</button>
      <button class="tab-btn" onclick="switchTab('storefront')">Banners & Anuncios</button>
      <button class="tab-btn" onclick="switchTab('settings')">Configuración</button>
    </div>

    <div id="tab-products" class="tab-content active">
      <div class="card">
        <h2>Crear Nuevo Producto</h2>
        <form id="newProductForm">
          <div class="form-grid">
            <div><label>Nombre</label><input type="text" id="pName" required placeholder="Ej. Camiseta Negra" /></div>
            <div><label>Slug / Handle</label><input type="text" id="pSlug" required placeholder="camiseta-negra" /></div>
            <div><label>SKU</label><input type="text" id="pSku" required placeholder="TSHIRT-001" /></div>
            <div><label>Precio en COP</label><input type="number" id="pPrice" required placeholder="80000" /></div>
            <div><label>Stock</label><input type="number" id="pStock" required value="10" /></div>
            <div>
              <label>Condición</label>
              <select id="pCondition"><option value="new">Nuevo</option><option value="used">Usado</option><option value="refurbished">Reacondicionado</option></select>
            </div>
            <div><label>Marca / Fabricante</label><input type="text" id="pBrand" placeholder="Vega Clothing" /></div>
            <div><label>Tipo de Producto</label><input type="text" id="pType" placeholder="Ropa / Camisetas" /></div>
            <div><label>Código de Barras (GTIN)</label><input type="text" id="pGtin" placeholder="7701234567890" /></div>
            <div><label>Etiquetas (separadas por coma)</label><input type="text" id="pTags" placeholder="verano, algodon, basico" /></div>
            <div>
              <label>Contra Entrega</label>
              <select id="pCod"><option value="true">Sí (Permitido)</option><option value="false">No (Anticipado)</option></select>
            </div>
            <div>
              <label>Alcance de Envío</label>
              <select id="pScope"><option value="national">Nacional</option><option value="local">Local</option></select>
            </div>
            <div>
              <label>Modalidad de Venta</label>
              <select id="pSaleMode"><option value="both" selected>Contado y Crédito</option><option value="cash">Solo Contado</option><option value="credit">Solo Crédito</option></select>
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <label>Descripción</label>
            <textarea id="pDesc" rows="2" required placeholder="Descripción detallada del producto..."></textarea>
          </div>
          <div style="margin-bottom: 1rem;">
            <label>Especificaciones Técnicas (JSON)</label>
            <textarea id="pSpecs" rows="2" placeholder='{"material": "100% Algodón", "talla": "M"}'></textarea>
          </div>

          <div style="border-top: 1px solid #334155; padding-top: 1rem; margin-top: 1rem;">
            <h3>Optimización para Motores de Búsqueda (SEO)</h3>
            <div class="form-grid" style="margin-top: 0.75rem;">
              <div>
                <label>Título SEO <span id="titleCount" class="char-count">0/70 car.</span></label>
                <input type="text" id="pSeoTitle" placeholder="Vacío usa el nombre del producto" />
              </div>
              <div><label>URL Canónica</label><input type="url" id="pCanonical" placeholder="https://ejemplo.com/productos/..." /></div>
            </div>
            <div style="margin-bottom: 0.75rem;">
              <label>Meta Descripción SEO <span id="descCount" class="char-count">0/160 car.</span></label>
              <textarea id="pSeoDesc" rows="2" placeholder="Vacío usa el inicio de la descripción del producto"></textarea>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="pNoindex" style="width: auto;" /> Ocultar de motores de búsqueda (noindex)
              </label>
            </div>

            <label>Vista previa de Google (SERP Preview):</label>
            <div class="serp-card">
              <div id="serpTitle" class="serp-title">Título del Producto</div>
              <div id="serpUrl" class="serp-url">https://tienda.com/productos/producto-slug</div>
              <div id="serpDesc" class="serp-desc">Descripción del producto...</div>
            </div>
          </div>

          <div style="margin-top: 1.5rem;">
            <button type="submit" class="btn-primary">Guardar Producto</button>
            <div id="pMsg" class="msg"></div>
          </div>
        </form>
      </div>

      ${renderProductTable(props.products)}
    </div>

    <div id="tab-taxonomies" class="tab-content">
      ${renderCatalogManagementSection(props.categories, props.brands, props.attributes)}
    </div>

    <div id="tab-storefront" class="tab-content">
      ${renderStorefrontManagementSection(props.banners, props.announcements)}
    </div>


    <div id="tab-settings" class="tab-content">
      <div class="card">
        <h2>Configuración de la Tienda</h2>
        <form id="settingsForm">
          <div class="form-grid">
            <div><label>Nombre</label><input type="text" id="sName" value="${escapeHtml(props.settings.storeName)}" required /></div>
            <div><label>Moneda</label><input type="text" id="sCurrency" value="${escapeHtml(props.settings.currency)}" readonly style="opacity:0.6;" /></div>
            <div><label>IVA (%)</label><input type="number" id="sTax" value="${props.settings.taxRatePercent}" required /></div>
            <div><label>Email</label><input type="email" id="sEmail" value="${escapeHtml(props.settings.supportEmail || '')}" /></div>
            <div><label>Teléfono</label><input type="text" id="sPhone" value="${escapeHtml(props.settings.supportPhone || '')}" /></div>
          </div>
          <button type="submit" class="btn-primary">Guardar Configuración</button>
          <div id="sMsg" class="msg"></div>
        </form>
      </div>
    </div>
  </main>
  <script>${renderAdminDashboardScript()}</script>
  <script>${renderAdminFormsScript()}</script>
</body>
</html>`;
}


function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
