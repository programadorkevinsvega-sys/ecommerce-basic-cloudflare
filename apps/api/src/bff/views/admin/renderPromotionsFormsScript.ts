export function renderPromotionsFormsScript(): string {
  return `
    document.getElementById('newPromoRuleForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('prMsg');
      const submitBtn = document.getElementById('prSubmitBtn');
      msg.textContent = 'Guardando regla de promoción...';
      msg.className = 'msg';
      submitBtn.disabled = true;

      const name = document.getElementById('prName').value.trim();
      const discountType = document.getElementById('prDiscountType').value;
      const rawVal = Number(document.getElementById('prDiscountValue').value);
      const discountValue = discountType === 'fixed_amount' ? Math.round(rawVal * 100) : rawVal;
      const targetType = document.getElementById('prTargetType').value;
      const targetId = document.getElementById('prTargetId').value.trim() || undefined;
      const startsAt = new Date(document.getElementById('prStartsAt').value + 'T00:00:00Z').toISOString();
      const endsAt = new Date(document.getElementById('prEndsAt').value + 'T23:59:59Z').toISOString();
      const priority = Number(document.getElementById('prPriority').value) || 0;

      const payload = {
        name,
        discountType,
        discountValue,
        targetType,
        targetId,
        startsAt,
        endsAt,
        priority
      };

      try {
        const res = await fetch('/api/v1/admin/promotions/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = '¡Regla de promoción creada con éxito!';
          msg.className = 'msg success';
          setTimeout(() => window.location.reload(), 1000);
        } else {
          msg.textContent = data.error || 'Error al guardar regla';
          msg.className = 'msg error';
          submitBtn.disabled = false;
        }
      } catch {
        msg.textContent = 'Error de conexión';
        msg.className = 'msg error';
        submitBtn.disabled = false;
      }
    });

    document.getElementById('newCouponForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('cpMsg');
      const submitBtn = document.getElementById('cpSubmitBtn');
      msg.textContent = 'Guardando cupón...';
      msg.className = 'msg';
      submitBtn.disabled = true;

      const code = document.getElementById('cpCode').value.trim().toUpperCase();
      const discountType = document.getElementById('cpDiscountType').value;
      const rawVal = Number(document.getElementById('cpDiscountValue').value);
      const discountValue = discountType === 'fixed_amount' ? Math.round(rawVal * 100) : rawVal;
      const minAmount = Math.round(Number(document.getElementById('cpMinAmount').value || 0) * 100);
      const maxGlobal = document.getElementById('cpMaxGlobal').value ? Number(document.getElementById('cpMaxGlobal').value) : undefined;
      const maxPerCust = Number(document.getElementById('cpMaxPerCustomer').value) || 1;
      const startsAt = new Date(document.getElementById('cpStartsAt').value + 'T00:00:00Z').toISOString();
      const endsAt = new Date(document.getElementById('cpEndsAt').value + 'T23:59:59Z').toISOString();

      const payload = {
        code,
        discountType,
        discountValue,
        minOrderAmountCents: minAmount,
        maxUsesGlobal: maxGlobal,
        maxUsesPerCustomer: maxPerCust,
        startsAt,
        endsAt
      };

      try {
        const res = await fetch('/api/v1/admin/promotions/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = '¡Cupón creado con éxito!';
          msg.className = 'msg success';
          setTimeout(() => window.location.reload(), 1000);
        } else {
          msg.textContent = data.error || 'Error al guardar cupón';
          msg.className = 'msg error';
          submitBtn.disabled = false;
        }
      } catch {
        msg.textContent = 'Error de conexión';
        msg.className = 'msg error';
        submitBtn.disabled = false;
      }
    });

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

    window.togglePromoRuleStatus = togglePromoRuleStatus;
    window.deletePromoRule = deletePromoRule;
    window.toggleCouponStatus = toggleCouponStatus;
    window.deleteCoupon = deleteCoupon;
  `;
}
