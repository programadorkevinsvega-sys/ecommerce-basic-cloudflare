import { PromotionRuleDto, CouponDto } from '../../gateways/promotions/PromotionsGateway.js';
import { CatalogProductDto, CategoryDto } from '../../gateways/catalog/CatalogGateway.js';
import { renderPromotionRulesTableRows, renderCouponsTableRows } from './renderPromotionsTableRows.js';

export function renderPromotionsManagementSection(
  rules: PromotionRuleDto[],
  coupons: CouponDto[],
  products: CatalogProductDto[] = [],
  categories: CategoryDto[] = []
): string {
  const productMap = new Map<string, string>();
  products.forEach((p) => productMap.set(p.id, `${p.name} (${p.sku})`));

  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const productOptions = products.map((p) =>
    `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} [SKU: ${escapeHtml(p.sku)}]</option>`
  ).join('');

  const categoryOptions = categories.map((c) =>
    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`
  ).join('');

  return `
    <div class="card" data-marketing-page="promotion-rule">
      <h2 id="prFormTitle">Crear Nueva Regla de Promoción</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Descuentos automáticos por producto y compra mínima. Un anuncio de envío gratis no modifica las tarifas de transporte.
      </p>
      <form id="newPromoRuleForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="prEditId" value="" />
        <div class="form-grid">
          <div><label>Nombre de la Promoción</label><input type="text" id="prName" required placeholder="Ej. Cyber Promo 20%" /></div>
          <div>
            <label>Tipo de Descuento</label>
            <select id="prDiscountType"><option value="percentage">Porcentaje (%)</option><option value="fixed_amount">Monto Fijo (COP)</option></select>
          </div>
          <div><label>Valor del Descuento</label><input type="text" id="prDiscountValue" data-cop-input data-cop-type-select="prDiscountType" inputmode="decimal" required placeholder="20 (%) o 15.000 COP" /></div>
          <div><label>Compra mínima (COP)</label><input type="text" id="prMinAmount" data-cop-input inputmode="numeric" value="0" placeholder="0" /><small>El descuento se aplica cuando el subtotal del carrito alcance este valor.</small></div>
          <div>
            <label>Alcance del Descuento</label>
            <select id="prTargetType" onchange="onPromoTargetTypeChange()">
              <option value="all">Todo el Catálogo</option>
              <option value="product">Producto Específico</option>
              <option value="category">Categoría</option>
            </select>
          </div>
          <div id="prProductTargetWrapper" style="display:none;">
            <label>Producto Objetivo (Escribe para filtrar o selecciona)</label>
            <input type="text" id="prProductSearch" placeholder="🔍 Escribe para buscar..." oninput="filterTargetSelect('prProductSearch', 'prTargetProductSelect')" style="margin-bottom:0.25rem;" />
            <select id="prTargetProductSelect" onchange="onProductSelectChanged('prTargetProductSelect', 'prSelectedProductInfo')">
              <option value="">-- Selecciona un producto --</option>
              ${productOptions}
            </select>
            <div id="prSelectedProductInfo" style="font-size:0.8rem; color:#38bdf8; margin-top:0.25rem; font-weight:600;"></div>
          </div>
          <div id="prCategoryTargetWrapper" style="display:none;">
            <label>Categoría Objetivo</label>
            <select id="prTargetCategorySelect"><option value="">-- Selecciona una categoría --</option>${categoryOptions}</select>
          </div>
          <div><label>Fecha Inicio (YYYY-MM-DD)</label><input type="date" id="prStartsAt" required /></div>
          <div><label>Fecha Fin (YYYY-MM-DD)</label><input type="date" id="prEndsAt" required /></div>
          <div><label>Prioridad (Mayor = se aplica antes)</label><input type="number" id="prPriority" value="10" /></div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button type="submit" class="btn-primary" id="prSubmitBtn">Crear Regla de Promoción</button>
          <button type="button" class="btn-action btn-action-hide" id="prCancelBtn" style="display:none;" onclick="resetPromoRuleForm()">Cancelar Edición</button>
        </div>
        <div id="prMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Nombre y Alcance</th><th>Descuento</th><th>Vigencia</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${renderPromotionRulesTableRows(rules, productMap, categoryMap)}</tbody>
      </table>
    </div>

    <div class="card" data-marketing-page="discount-coupon">
      <h2 id="cpFormTitle">Crear Nuevo Cupón de Descuento</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Códigos canjeables al pagar o en carrito. Pueden ser para todo el catálogo, un producto específico o una categoría.
      </p>
      <form id="newCouponForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="cpEditId" value="" />
        <div class="form-grid">
          <div><label>Código del Cupón</label><input type="text" id="cpCode" required placeholder="EJ: BIENVENIDO10" style="text-transform:uppercase;" /></div>
          <div>
            <label>Tipo de Descuento</label>
            <select id="cpDiscountType"><option value="percentage">Porcentaje (%)</option><option value="fixed_amount">Monto Fijo (COP)</option></select>
          </div>
          <div><label>Valor del Descuento</label><input type="text" id="cpDiscountValue" data-cop-input data-cop-type-select="cpDiscountType" inputmode="decimal" required placeholder="10 (%) o 20.000 COP" /></div>
          <div>
            <label>Alcance del Cupón</label>
            <select id="cpTargetType" onchange="onCouponTargetTypeChange()">
              <option value="all">General (Todo el Catálogo)</option>
              <option value="product">Producto Específico</option>
              <option value="category">Categoría Específica</option>
            </select>
          </div>
          <div id="cpProductTargetWrapper" style="display:none;">
            <label>Producto Objetivo (Escribe para filtrar o selecciona)</label>
            <input type="text" id="cpProductSearch" placeholder="🔍 Escribe para buscar..." oninput="filterTargetSelect('cpProductSearch', 'cpTargetProductSelect')" style="margin-bottom:0.25rem;" />
            <select id="cpTargetProductSelect" onchange="onProductSelectChanged('cpTargetProductSelect', 'cpSelectedProductInfo')">
              <option value="">-- Selecciona un producto --</option>
              ${productOptions}
            </select>
            <div id="cpSelectedProductInfo" style="font-size:0.8rem; color:#38bdf8; margin-top:0.25rem; font-weight:600;"></div>
          </div>
          <div id="cpCategoryTargetWrapper" style="display:none;">
            <label>Categoría Objetivo</label>
            <select id="cpTargetCategorySelect"><option value="">-- Selecciona una categoría --</option>${categoryOptions}</select>
          </div>
          <div><label>Compra Mínima (COP)</label><input type="text" id="cpMinAmount" data-cop-input inputmode="numeric" value="0" placeholder="0" /></div>
          <div><label>Límite Usos Global (Vacío = Ilimitado)</label><input type="number" id="cpMaxGlobal" placeholder="100" /></div>
          <div><label>Límite por Cliente</label><input type="number" id="cpMaxPerCustomer" value="1" /></div>
          <div><label>Fecha Inicio</label><input type="date" id="cpStartsAt" required /></div>
          <div><label>Fecha Fin</label><input type="date" id="cpEndsAt" required /></div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button type="submit" class="btn-primary" id="cpSubmitBtn">Crear Cupón</button>
          <button type="button" class="btn-action btn-action-hide" id="cpCancelBtn" style="display:none;" onclick="resetCouponForm()">Cancelar Edición</button>
        </div>
        <div id="cpMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Código y Alcance</th><th>Descuento</th><th>Usos</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${renderCouponsTableRows(coupons, productMap, categoryMap)}</tbody>
      </table>
    </div>

    <section class="card" data-marketing-page="free-shipping" hidden>
      <div class="admin-section-heading"><div><h2>Reglas de envío gratis</h2><p>Asigna el beneficio a todo el catálogo, productos, categorías o colecciones.</p></div><button class="btn-primary" type="button" onclick="openFreeShippingRuleModal()">+ Crear regla</button></div>
      <div class="table-responsive"><table data-server-pagination="true"><thead><tr><th>Regla</th><th>Alcance</th><th>Compra mínima</th><th>Vigencia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="free-shipping-rules-body"><tr><td colspan="6">Cargando reglas…</td></tr></tbody></table></div>
      <nav class="admin-pagination" aria-label="Paginación de reglas de envío gratis"><button class="admin-page-button" id="free-shipping-prev" type="button" onclick="loadFreeShippingRules(freeShippingPage-1)">Anterior</button><span id="free-shipping-page-label">Página 1</span><button class="admin-page-button" id="free-shipping-next" type="button" onclick="loadFreeShippingRules(freeShippingPage+1)">Siguiente</button></nav>
      <dialog id="free-shipping-rule-modal" class="marketing-modal" aria-labelledby="free-shipping-form-title"><form id="free-shipping-rule-form"><header class="marketing-modal-heading"><h2 id="free-shipping-form-title">Crear regla de envío gratis</h2><button class="marketing-modal-close" type="button" onclick="closeFreeShippingRuleModal()">×</button></header><input type="hidden" id="fs-rule-id"><div class="form-grid">
        <div><label for="fs-rule-name">Nombre</label><input id="fs-rule-name" required maxlength="120"></div>
        <div><label for="fs-rule-target-type">Aplicar a</label><select id="fs-rule-target-type"><option value="all">Todo el catálogo</option><option value="product">Producto específico</option><option value="category">Categoría</option><option value="collection">Colección</option></select></div>
        <div id="fs-rule-target-wrap" hidden><label for="fs-rule-target-search">Buscar destino</label><input id="fs-rule-target-search" type="search" placeholder="Nombre o SKU"><select id="fs-rule-target" size="5" required></select><div class="admin-pagination"><button class="admin-page-button" id="fs-target-prev" type="button">Anterior</button><span id="fs-target-page">Página 1</span><button class="admin-page-button" id="fs-target-next" type="button">Siguiente</button></div></div>
        <div><label for="fs-rule-minimum">Compra mínima (COP)</label><input id="fs-rule-minimum" type="number" min="0" step="1000" value="0" required></div>
        <div><label for="fs-rule-start">Válida desde</label><input id="fs-rule-start" type="datetime-local" required></div>
        <div><label for="fs-rule-end">Válida hasta</label><input id="fs-rule-end" type="datetime-local" required></div>
        <div><label for="fs-rule-priority">Prioridad</label><input id="fs-rule-priority" type="number" min="0" max="10000" value="10"></div>
        <label><input id="fs-rule-active" type="checkbox" checked> Regla activa</label>
      </div><footer class="marketing-modal-actions"><button class="btn-primary" type="submit">Guardar regla</button><button class="btn-secondary" type="button" onclick="closeFreeShippingRuleModal()">Cancelar</button><span id="fs-rule-message" role="status"></span></footer></form></dialog>
    </section>

    <!-- Modales para Ver Detalle -->
    <div id="promoDetailsModal" class="modal-overlay">
      <div class="modal-content">
        <button class="modal-close" onclick="closePromoModal()">&times;</button>
        <h2 id="modalPromoTitle" style="color:#38bdf8; margin-bottom:1rem;">Detalle de Promoción</h2>
        <div id="modalPromoBody" style="line-height:1.6; font-size:0.9rem; color:#cbd5e1;"></div>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
