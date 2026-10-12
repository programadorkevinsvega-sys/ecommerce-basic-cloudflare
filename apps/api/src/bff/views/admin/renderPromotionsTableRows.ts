import { PromotionRuleDto, CouponDto } from '../../gateways/promotions/PromotionsGateway.js';

export function renderPromotionRulesTableRows(rules: PromotionRuleDto[], productMap: Map<string, string>, categoryMap: Map<string, string>): string {
  if (rules.length === 0) {
    return '<tr><td colspan="5" style="text-align:center; padding:1rem; color:#94a3b8;">No hay promociones automáticas configuradas</td></tr>';
  }

  return rules.map((r) => {
    const isAct = r.isActive;
    const discountLabel = r.discountType === 'percentage'
      ? `${r.discountValue}%`
      : `$${Math.round(r.discountValue / 100).toLocaleString('es-CO')} COP`;

    let targetLabel = 'Todos los productos';
    if (r.targetType === 'product' && r.targetId) {
      targetLabel = `Producto: ${escapeHtml(productMap.get(r.targetId) || r.targetId)}`;
    } else if (r.targetType === 'category' && r.targetId) {
      targetLabel = `Categoría: ${escapeHtml(categoryMap.get(r.targetId) || r.targetId)}`;
    }

    const toggleAction = isAct
      ? `<button class="btn-action btn-action-hide" onclick="togglePromoRuleStatus('${r.id}', false)">Desactivar</button>`
      : `<button class="btn-action btn-action-publish" onclick="togglePromoRuleStatus('${r.id}', true)">Activar</button>`;

    const encData = encodeURIComponent(JSON.stringify(r));

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
          <button class="btn-action btn-action-view" data-item="${encData}" onclick="viewPromoRuleModal(this)">Ver</button>
          <button class="btn-action btn-action-edit" data-item="${encData}" onclick="editPromoRuleModal(this)">Editar</button>
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deletePromoRule('${r.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

export function renderCouponsTableRows(coupons: CouponDto[], productMap: Map<string, string>, categoryMap: Map<string, string>): string {
  if (coupons.length === 0) {
    return '<tr><td colspan="5" style="text-align:center; padding:1rem; color:#94a3b8;">No hay cupones creados</td></tr>';
  }

  return coupons.map((c) => {
    const isAct = c.isActive;
    const discountLabel = c.discountType === 'percentage'
      ? `${c.discountValue}%`
      : `$${Math.round(c.discountValue / 100).toLocaleString('es-CO')} COP`;

    let targetLabel = 'General (Todo el catálogo)';
    if (c.targetType === 'product' && c.targetId) {
      targetLabel = `Producto: ${escapeHtml(productMap.get(c.targetId) || c.targetId)}`;
    } else if (c.targetType === 'category' && c.targetId) {
      targetLabel = `Categoría: ${escapeHtml(categoryMap.get(c.targetId) || c.targetId)}`;
    }

    const toggleAction = isAct
      ? `<button class="btn-action btn-action-hide" onclick="toggleCouponStatus('${c.id}', false)">Desactivar</button>`
      : `<button class="btn-action btn-action-publish" onclick="toggleCouponStatus('${c.id}', true)">Activar</button>`;

    const usesLabel = c.maxUsesGlobal ? `${c.currentUsesCount} / ${c.maxUsesGlobal}` : `${c.currentUsesCount} (ilimitado)`;
    const encData = encodeURIComponent(JSON.stringify(c));

    return `
      <tr>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:700;">
          <code style="background:#0f172a; padding:0.2rem 0.4rem; border-radius:4px; color:#f59e0b;">${escapeHtml(c.code)}</code>
          <div style="font-size:0.75rem; color:#94a3b8; font-weight:normal;">${escapeHtml(c.description || 'Sin descripción')}</div>
          <div style="font-size:0.72rem; color:#38bdf8; font-weight:normal;">${targetLabel}</div>
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:700; color:#38bdf8;">${discountLabel}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-size:0.85rem;">${usesLabel}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">
          ${isAct ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
          <button class="btn-action btn-action-view" data-item="${encData}" onclick="viewCouponModal(this)">Ver</button>
          <button class="btn-action btn-action-edit" data-item="${encData}" onclick="editCouponModal(this)">Editar</button>
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteCoupon('${c.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
