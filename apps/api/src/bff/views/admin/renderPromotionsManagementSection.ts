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
    <div class="card">
      <h2 id="prFormTitle">Crear Nueva Regla de Promoción</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Descuentos automáticos aplicados en catálogo y detalle de productos por fecha y alcance.
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

    <div class="card">
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
