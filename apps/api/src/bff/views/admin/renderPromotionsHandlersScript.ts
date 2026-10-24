export function renderPromotionsHandlersScript(): string {
  return `
    const promotionPages = { rules: 1, coupons: 1 };
    async function loadPromotionPage(kind, page = 1) {
      const endpoint = kind === 'rules' ? 'rules' : 'coupons';
      const result = await fetch('/api/v1/admin/promotions/' + endpoint + '?page=' + page + '&pageSize=25', { cache: 'no-store' }).then(response => response.json());
      if (!result.success) throw new Error(result.error || 'No se pudo cargar la página.');
      promotionPages[kind] = result.page;
      document.getElementById(kind === 'rules' ? 'promotion-rules-body' : 'promotion-coupons-body').innerHTML = result.rowsHtml;
      const nav = document.getElementById(kind === 'rules' ? 'promotion-rules-pagination' : 'promotion-coupons-pagination');
      nav.querySelector('span').textContent = result.total + ' registros · Página ' + result.page;
      nav.querySelector('[data-promo-page="previous"]').disabled = result.page <= 1;
      nav.querySelector('[data-promo-page="next"]').disabled = !result.hasMore;
      nav.querySelector('[data-promo-page="previous"]').onclick = () => loadPromotionPage(kind, result.page - 1);
      nav.querySelector('[data-promo-page="next"]').onclick = () => loadPromotionPage(kind, result.page + 1);
    }
    loadPromotionPage('rules').catch(() => {}); loadPromotionPage('coupons').catch(() => {});
    function parseItemData(btn) {
      try {
        const enc = btn.getAttribute('data-item');
        return JSON.parse(decodeURIComponent(enc));
      } catch (e) {
        console.error('No fue posible interpretar los datos de la promoción');
        return null;
      }
    }

    async function togglePromoRuleStatus(id, isActive) {
      if (!confirm('¿Deseas cambiar el estado de la promoción?')) return;
      const res = await fetch('/api/v1/admin/promotions/rules/' + id + '/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) window.location.reload();
      else alert('Error al actualizar estado');
    }

    async function deletePromoRule(id) {
      if (!confirm('¿Seguro que deseas eliminar esta promoción?')) return;
      const res = await fetch('/api/v1/admin/promotions/rules/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar regla');
    }

    async function toggleCouponStatus(id, isActive) {
      if (!confirm('¿Deseas cambiar el estado del cupón?')) return;
      const res = await fetch('/api/v1/admin/promotions/coupons/' + id + '/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) window.location.reload();
      else alert('Error al actualizar cupón');
    }

    async function deleteCoupon(id) {
      if (!confirm('¿Seguro que deseas eliminar este cupón?')) return;
      const res = await fetch('/api/v1/admin/promotions/coupons/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar cupón');
    }

    function viewPromoRuleModal(btn) {
      const data = parseItemData(btn);
      if (!data) return;
      document.getElementById('modalPromoTitle').textContent = '🔍 Detalle: ' + data.name;
      const disc = data.discountType === 'percentage' ? data.discountValue + '%' : '$' + Math.round(data.discountValue / 100).toLocaleString('es-CO') + ' COP';
      document.getElementById('modalPromoBody').innerHTML = '<div>' +
        '<p style="margin-bottom:0.5rem;"><strong>ID:</strong> ' + escapeHtml(data.id) + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Nombre:</strong> ' + escapeHtml(data.name) + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Tipo de Descuento:</strong> ' + escapeHtml(data.discountType) + ' (' + escapeHtml(disc) + ')</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Alcance:</strong> ' + escapeHtml(data.targetType) + (data.targetId ? ' (ID: ' + escapeHtml(data.targetId) + ')' : '') + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Compra Mínima:</strong> $' + Math.round(data.minOrderAmountCents / 100).toLocaleString('es-CO') + ' COP</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Vigencia:</strong> Desde ' + data.startsAt.substring(0, 10) + ' hasta ' + data.endsAt.substring(0, 10) + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Prioridad:</strong> ' + data.priority + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Estado:</strong> ' + (data.isActive ? 'Activo' : 'Inactivo') + '</p>' +
        '</div>';
      document.getElementById('promoDetailsModal').classList.add('active');
    }

    function editPromoRuleModal(btn) {
      const data = parseItemData(btn);
      if (!data) return;
      document.getElementById('prEditId').value = data.id;
      document.getElementById('prName').value = data.name;
      document.getElementById('prDiscountType').value = data.discountType;
      window.setCopInputMode('prDiscountValue', data.discountType === 'fixed_amount');
      if (data.discountType === 'fixed_amount') window.setCopInputValue('prDiscountValue', Math.round(data.discountValue / 100));
      else document.getElementById('prDiscountValue').value = data.discountValue;
      document.getElementById('prTargetType').value = data.targetType;
      onPromoTargetTypeChange();
      if (data.targetType === 'product') {
        document.getElementById('prTargetProductSelect').value = data.targetId || '';
        onProductSelectChanged('prTargetProductSelect', 'prSelectedProductInfo');
      } else if (data.targetType === 'category') {
        document.getElementById('prTargetCategorySelect').value = data.targetId || '';
      }
      window.setCopInputValue('prMinAmount', Math.round(data.minOrderAmountCents / 100));
      document.getElementById('prStartsAt').value = data.startsAt.substring(0, 10);
      document.getElementById('prEndsAt').value = data.endsAt.substring(0, 10);
      document.getElementById('prPriority').value = data.priority;
      document.getElementById('prFormTitle').textContent = 'Editar Regla de Promoción';
      document.getElementById('prSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('prCancelBtn').style.display = 'inline-block';
      window.openMarketingModal('promotion-rule');
    }

    function resetPromoRuleForm() {
      document.getElementById('prEditId').value = '';
      document.getElementById('newPromoRuleForm').reset();
      onPromoTargetTypeChange();
      document.getElementById('prSelectedProductInfo').textContent = '';
      document.getElementById('prFormTitle').textContent = 'Crear Nueva Regla de Promoción';
      document.getElementById('prSubmitBtn').textContent = 'Crear Regla de Promoción';
      document.getElementById('prCancelBtn').style.display = 'none';
    }

    function viewCouponModal(btn) {
      const data = parseItemData(btn);
      if (!data) return;
      document.getElementById('modalPromoTitle').textContent = '🎟️ Detalle del Cupón: ' + data.code;
      const disc = data.discountType === 'percentage' ? data.discountValue + '%' : '$' + Math.round(data.discountValue / 100).toLocaleString('es-CO') + ' COP';
      document.getElementById('modalPromoBody').innerHTML = '<div>' +
        '<p style="margin-bottom:0.5rem;"><strong>Código:</strong> <code style="color:#f59e0b;">' + escapeHtml(data.code) + '</code></p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Descripción:</strong> ' + escapeHtml(data.description || 'Sin descripción') + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Descuento:</strong> ' + disc + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Alcance:</strong> ' + escapeHtml(data.targetType || 'all') + (data.targetId ? ' (ID: ' + escapeHtml(data.targetId) + ')' : '') + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Compra Mínima:</strong> $' + Math.round(data.minOrderAmountCents / 100).toLocaleString('es-CO') + ' COP</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Usos Actuales:</strong> ' + data.currentUsesCount + (data.maxUsesGlobal ? ' / ' + data.maxUsesGlobal : ' (ilimitado)') + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Límite por Cliente:</strong> ' + (data.maxUsesPerCustomer || 1) + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Vigencia:</strong> Desde ' + data.startsAt.substring(0, 10) + ' hasta ' + data.endsAt.substring(0, 10) + '</p>' +
        '<p style="margin-bottom:0.5rem;"><strong>Estado:</strong> ' + (data.isActive ? 'Activo' : 'Inactivo') + '</p>' +
        '</div>';
      document.getElementById('promoDetailsModal').classList.add('active');
    }

    function editCouponModal(btn) {
      const data = parseItemData(btn);
      if (!data) return;
      document.getElementById('cpEditId').value = data.id;
      document.getElementById('cpCode').value = data.code;
      document.getElementById('cpDiscountType').value = data.discountType;
      window.setCopInputMode('cpDiscountValue', data.discountType === 'fixed_amount');
      if (data.discountType === 'fixed_amount') window.setCopInputValue('cpDiscountValue', Math.round(data.discountValue / 100));
      else document.getElementById('cpDiscountValue').value = data.discountValue;
      document.getElementById('cpTargetType').value = data.targetType || 'all';
      onCouponTargetTypeChange();
      if (data.targetType === 'product') {
        document.getElementById('cpTargetProductSelect').value = data.targetId || '';
        onProductSelectChanged('cpTargetProductSelect', 'cpSelectedProductInfo');
      } else if (data.targetType === 'category') {
        document.getElementById('cpTargetCategorySelect').value = data.targetId || '';
      }
      window.setCopInputValue('cpMinAmount', Math.round(data.minOrderAmountCents / 100));
      document.getElementById('cpMaxGlobal').value = data.maxUsesGlobal !== undefined ? data.maxUsesGlobal : '';
      document.getElementById('cpMaxPerCustomer').value = data.maxUsesPerCustomer || 1;
      document.getElementById('cpStartsAt').value = data.startsAt.substring(0, 10);
      document.getElementById('cpEndsAt').value = data.endsAt.substring(0, 10);
      document.getElementById('cpFormTitle').textContent = 'Editar Cupón de Descuento';
      document.getElementById('cpSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('cpCancelBtn').style.display = 'inline-block';
      window.openMarketingModal('discount-coupon');
    }

    function resetCouponForm() {
      document.getElementById('cpEditId').value = '';
      document.getElementById('newCouponForm').reset();
      onCouponTargetTypeChange();
      document.getElementById('cpSelectedProductInfo').textContent = '';
      document.getElementById('cpFormTitle').textContent = 'Crear Nuevo Cupón de Descuento';
      document.getElementById('cpSubmitBtn').textContent = 'Crear Cupón';
      document.getElementById('cpCancelBtn').style.display = 'none';
    }

    function closePromoModal() {
      document.getElementById('promoDetailsModal').classList.remove('active');
    }

    window.togglePromoRuleStatus = togglePromoRuleStatus;
    window.deletePromoRule = deletePromoRule;
    window.toggleCouponStatus = toggleCouponStatus;
    window.deleteCoupon = deleteCoupon;
    window.viewPromoRuleModal = viewPromoRuleModal;
    window.editPromoRuleModal = editPromoRuleModal;
    window.resetPromoRuleForm = resetPromoRuleForm;
    window.viewCouponModal = viewCouponModal;
    window.editCouponModal = editCouponModal;
    window.resetCouponForm = resetCouponForm;
    window.closePromoModal = closePromoModal;
  `;
}
