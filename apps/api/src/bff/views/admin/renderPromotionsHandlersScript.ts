export function renderPromotionsHandlersScript(): string {
  return `
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

    function viewPromoRuleModal(id) {
      const el = document.getElementById('promo-rule-data-' + id);
      if (!el) return;
      const data = JSON.parse(el.textContent);
      document.getElementById('modalPromoTitle').textContent = '🔍 Detalle: ' + data.name;
      const disc = data.discountType === 'percentage' ? data.discountValue + '%' : '$' + Math.round(data.discountValue / 100).toLocaleString('es-CO') + ' COP';
      document.getElementById('modalPromoBody').innerHTML = '<div>' +
        '<p><strong>ID:</strong> ' + data.id + '</p>' +
        '<p><strong>Nombre:</strong> ' + data.name + '</p>' +
        '<p><strong>Tipo de Descuento:</strong> ' + data.discountType + ' (' + disc + ')</p>' +
        '<p><strong>Alcance:</strong> ' + data.targetType + (data.targetId ? ' (ID: ' + data.targetId + ')' : '') + '</p>' +
        '<p><strong>Compra Mínima:</strong> $' + Math.round(data.minOrderAmountCents / 100).toLocaleString('es-CO') + ' COP</p>' +
        '<p><strong>Vigencia:</strong> Desde ' + data.startsAt.substring(0, 10) + ' hasta ' + data.endsAt.substring(0, 10) + '</p>' +
        '<p><strong>Prioridad:</strong> ' + data.priority + '</p>' +
        '<p><strong>Estado:</strong> ' + (data.isActive ? 'Activo' : 'Inactivo') + '</p>' +
        '</div>';
      document.getElementById('promoDetailsModal').classList.add('active');
    }

    function editPromoRuleModal(id) {
      const el = document.getElementById('promo-rule-data-' + id);
      if (!el) return;
      const data = JSON.parse(el.textContent);
      document.getElementById('prEditId').value = data.id;
      document.getElementById('prName').value = data.name;
      document.getElementById('prDiscountType').value = data.discountType;
      document.getElementById('prDiscountValue').value = data.discountType === 'fixed_amount' ? Math.round(data.discountValue / 100) : data.discountValue;
      document.getElementById('prTargetType').value = data.targetType;
      onPromoTargetTypeChange();
      if (data.targetType === 'product') {
        document.getElementById('prTargetProductSelect').value = data.targetId || '';
      } else if (data.targetType === 'category') {
        document.getElementById('prTargetCategorySelect').value = data.targetId || '';
      }
      document.getElementById('prStartsAt').value = data.startsAt.substring(0, 10);
      document.getElementById('prEndsAt').value = data.endsAt.substring(0, 10);
      document.getElementById('prPriority').value = data.priority;
      document.getElementById('prFormTitle').textContent = 'Editar Regla de Promoción';
      document.getElementById('prSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('prCancelBtn').style.display = 'inline-block';
      document.getElementById('newPromoRuleForm').scrollIntoView({ behavior: 'smooth' });
    }

    function resetPromoRuleForm() {
      document.getElementById('prEditId').value = '';
      document.getElementById('newPromoRuleForm').reset();
      onPromoTargetTypeChange();
      document.getElementById('prFormTitle').textContent = 'Crear Nueva Regla de Promoción';
      document.getElementById('prSubmitBtn').textContent = 'Crear Regla de Promoción';
      document.getElementById('prCancelBtn').style.display = 'none';
    }

    function viewCouponModal(id) {
      const el = document.getElementById('coupon-data-' + id);
      if (!el) return;
      const data = JSON.parse(el.textContent);
      document.getElementById('modalPromoTitle').textContent = '🎟️ Detalle del Cupón: ' + data.code;
      const disc = data.discountType === 'percentage' ? data.discountValue + '%' : '$' + Math.round(data.discountValue / 100).toLocaleString('es-CO') + ' COP';
      document.getElementById('modalPromoBody').innerHTML = '<div>' +
        '<p><strong>Código:</strong> <code style="color:#f59e0b;">' + data.code + '</code></p>' +
        '<p><strong>Descripción:</strong> ' + (data.description || 'Sin descripción') + '</p>' +
        '<p><strong>Descuento:</strong> ' + disc + '</p>' +
        '<p><strong>Alcance:</strong> ' + (data.targetType || 'all') + (data.targetId ? ' (ID: ' + data.targetId + ')' : '') + '</p>' +
        '<p><strong>Compra Mínima:</strong> $' + Math.round(data.minOrderAmountCents / 100).toLocaleString('es-CO') + ' COP</p>' +
        '<p><strong>Usos Actuales:</strong> ' + data.currentUsesCount + (data.maxUsesGlobal ? ' / ' + data.maxUsesGlobal : ' (ilimitado)') + '</p>' +
        '<p><strong>Límite por Cliente:</strong> ' + (data.maxUsesPerCustomer || 1) + '</p>' +
        '<p><strong>Vigencia:</strong> Desde ' + data.startsAt.substring(0, 10) + ' hasta ' + data.endsAt.substring(0, 10) + '</p>' +
        '<p><strong>Estado:</strong> ' + (data.isActive ? 'Activo' : 'Inactivo') + '</p>' +
        '</div>';
      document.getElementById('promoDetailsModal').classList.add('active');
    }

    function editCouponModal(id) {
      const el = document.getElementById('coupon-data-' + id);
      if (!el) return;
      const data = JSON.parse(el.textContent);
      document.getElementById('cpEditId').value = data.id;
      document.getElementById('cpCode').value = data.code;
      document.getElementById('cpDiscountType').value = data.discountType;
      document.getElementById('cpDiscountValue').value = data.discountType === 'fixed_amount' ? Math.round(data.discountValue / 100) : data.discountValue;
      document.getElementById('cpTargetType').value = data.targetType || 'all';
      onCouponTargetTypeChange();
      if (data.targetType === 'product') {
        document.getElementById('cpTargetProductSelect').value = data.targetId || '';
      } else if (data.targetType === 'category') {
        document.getElementById('cpTargetCategorySelect').value = data.targetId || '';
      }
      document.getElementById('cpMinAmount').value = Math.round(data.minOrderAmountCents / 100);
      document.getElementById('cpMaxGlobal').value = data.maxUsesGlobal !== undefined ? data.maxUsesGlobal : '';
      document.getElementById('cpMaxPerCustomer').value = data.maxUsesPerCustomer || 1;
      document.getElementById('cpStartsAt').value = data.startsAt.substring(0, 10);
      document.getElementById('cpEndsAt').value = data.endsAt.substring(0, 10);
      document.getElementById('cpFormTitle').textContent = 'Editar Cupón de Descuento';
      document.getElementById('cpSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('cpCancelBtn').style.display = 'inline-block';
      document.getElementById('newCouponForm').scrollIntoView({ behavior: 'smooth' });
    }

    function resetCouponForm() {
      document.getElementById('cpEditId').value = '';
      document.getElementById('newCouponForm').reset();
      onCouponTargetTypeChange();
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
