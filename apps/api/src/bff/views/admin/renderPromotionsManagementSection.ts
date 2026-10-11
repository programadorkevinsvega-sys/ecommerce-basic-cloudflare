import { PromotionRuleDto, CouponDto } from '../../gateways/promotions/PromotionsGateway.js';

export function renderPromotionsManagementSection(
  rules: PromotionRuleDto[],
  coupons: CouponDto[]
): string {
  const ruleRows = rules.map((r) => {
    const isAct = r.isActive;
    const discountLabel = r.discountType === 'percentage'
      ? `${r.discountValue}%`
      : `$${Math.round(r.discountValue / 100).toLocaleString('es-CO')} COP`;

    const targetLabel = r.targetType === 'all'
      ? 'Todos los productos'
      : r.targetType === 'product'
      ? `Producto (${escapeHtml(r.targetId || '')})`
      : `Categoría (${escapeHtml(r.targetId || '')})`;

    const toggleAction = isAct
      ? `<button class="btn-action btn-action-hide" onclick="togglePromoRuleStatus('${r.id}', false)">Desactivar</button>`
      : `<button class="btn-action btn-action-publish" onclick="togglePromoRuleStatus('${r.id}', true)">Activar</button>`;

    return `
      <tr>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
          ${escapeHtml(r.name)}
          <div style="font-size:0.75rem; color:#94a3b8;">${targetLabel} | Prioridad: ${r.priority}</div>
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:700; color:#38bdf8;">${discountLabel}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-size:0.8rem; color:#cbd5e1;">${r.startsAt.substring(0, 10)} al ${r.endsAt.substring(0, 10)}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">
          ${isAct ? '<span class="badge badge-published">Activa</span>' : '<span class="badge badge-draft">Inactiva</span>'}
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deletePromoRule('${r.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  const couponRows = coupons.map((c) => {
    const isAct = c.isActive;
    const discountLabel = c.discountType === 'percentage'
      ? `${c.discountValue}%`
      : `$${Math.round(c.discountValue / 100).toLocaleString('es-CO')} COP`;

    const toggleAction = isAct
      ? `<button class="btn-action btn-action-hide" onclick="toggleCouponStatus('${c.id}', false)">Desactivar</button>`
      : `<button class="btn-action btn-action-publish" onclick="toggleCouponStatus('${c.id}', true)">Activar</button>`;

    const usesLabel = c.maxUsesGlobal ? `${c.currentUsesCount} / ${c.maxUsesGlobal}` : `${c.currentUsesCount} (ilimitado)`;

    return `
      <tr>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:700;">
          <code style="background:#0f172a; padding:0.2rem 0.4rem; border-radius:4px; color:#f59e0b;">${escapeHtml(c.code)}</code>
          <div style="font-size:0.75rem; color:#94a3b8; font-weight:normal;">${escapeHtml(c.description || 'Sin descripción')}</div>
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:700; color:#38bdf8;">${discountLabel}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-size:0.85rem;">${usesLabel}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">
          ${isAct ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteCoupon('${c.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <h2>Reglas de Promoción Automáticas (${rules.length})</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Descuentos automáticos aplicados en catálogo y detalle de productos por fecha y alcance.
      </p>
      <form id="newPromoRuleForm" style="margin-bottom: 1.5rem;">
        <div class="form-grid">
          <div><label>Nombre de la Promoción</label><input type="text" id="prName" required placeholder="Ej. Cyber Promo 20%" /></div>
          <div>
            <label>Tipo de Descuento</label>
            <select id="prDiscountType"><option value="percentage">Porcentaje (%)</option><option value="fixed_amount">Monto Fijo (COP)</option></select>
          </div>
          <div><label>Valor del Descuento</label><input type="number" id="prDiscountValue" required placeholder="Ej. 20 (para 20%) o 15000 (en COP)" /></div>
          <div>
            <label>Alcance del Descuento</label>
            <select id="prTargetType"><option value="all">Todo el Catálogo</option><option value="product">Producto Específico</option><option value="category">Categoría</option></select>
          </div>
          <div><label>ID Objetivo (Opcional)</label><input type="text" id="prTargetId" placeholder="ID de producto o categoría" /></div>
          <div><label>Fecha Inicio (YYYY-MM-DD)</label><input type="date" id="prStartsAt" required /></div>
          <div><label>Fecha Fin (YYYY-MM-DD)</label><input type="date" id="prEndsAt" required /></div>
          <div><label>Prioridad (Mayor = se aplica antes)</label><input type="number" id="prPriority" value="10" /></div>
        </div>
        <button type="submit" class="btn-primary" id="prSubmitBtn">Crear Regla de Promoción</button>
        <div id="prMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Nombre y Alcance</th><th>Descuento</th><th>Vigencia</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${ruleRows || '<tr><td colspan="5" style="text-align:center; padding:1rem; color:#94a3b8;">No hay promociones automáticas configuradas</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Cupones de Descuento (${coupons.length})</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Códigos canjeables al momento de pagar o en el carrito con límites de uso por cliente.
      </p>
      <form id="newCouponForm" style="margin-bottom: 1.5rem;">
        <div class="form-grid">
          <div><label>Código del Cupón</label><input type="text" id="cpCode" required placeholder="EJ: BIENVENIDO10" style="text-transform:uppercase;" /></div>
          <div>
            <label>Tipo de Descuento</label>
            <select id="cpDiscountType"><option value="percentage">Porcentaje (%)</option><option value="fixed_amount">Monto Fijo (COP)</option></select>
          </div>
          <div><label>Valor del Descuento</label><input type="number" id="cpDiscountValue" required placeholder="Ej. 10 (%) o 20000 (COP)" /></div>
          <div><label>Compra Mínima en COP</label><input type="number" id="cpMinAmount" value="0" placeholder="0" /></div>
          <div><label>Límite Usos Global (Vacío = Ilimitado)</label><input type="number" id="cpMaxGlobal" placeholder="100" /></div>
          <div><label>Límite por Cliente</label><input type="number" id="cpMaxPerCustomer" value="1" /></div>
          <div><label>Fecha Inicio</label><input type="date" id="cpStartsAt" required /></div>
          <div><label>Fecha Fin</label><input type="date" id="cpEndsAt" required /></div>
        </div>
        <button type="submit" class="btn-primary" id="cpSubmitBtn">Crear Cupón</button>
        <div id="cpMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Código</th><th>Descuento</th><th>Usos</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${couponRows || '<tr><td colspan="5" style="text-align:center; padding:1rem; color:#94a3b8;">No hay cupones creados</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
