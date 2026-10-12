export function renderPromotionsFormsScript(): string {
  return `
    function filterTargetSelect(searchInputId, selectId) {
      const query = document.getElementById(searchInputId).value.toLowerCase();
      const select = document.getElementById(selectId);
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        const match = opt.text.toLowerCase().includes(query);
        opt.style.display = match ? '' : 'none';
      }
    }

    function onPromoTargetTypeChange() {
      const val = document.getElementById('prTargetType').value;
      const pWrap = document.getElementById('prProductTargetWrapper');
      const cWrap = document.getElementById('prCategoryTargetWrapper');
      if (pWrap) pWrap.style.display = val === 'product' ? 'block' : 'none';
      if (cWrap) cWrap.style.display = val === 'category' ? 'block' : 'none';
    }

    function onCouponTargetTypeChange() {
      const val = document.getElementById('cpTargetType').value;
      const pWrap = document.getElementById('cpProductTargetWrapper');
      const cWrap = document.getElementById('cpCategoryTargetWrapper');
      if (pWrap) pWrap.style.display = val === 'product' ? 'block' : 'none';
      if (cWrap) cWrap.style.display = val === 'category' ? 'block' : 'none';
    }

    document.getElementById('newPromoRuleForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('prMsg');
      const submitBtn = document.getElementById('prSubmitBtn');
      msg.textContent = 'Guardando regla de promoción...';
      msg.className = 'msg';
      submitBtn.disabled = true;

      const editId = document.getElementById('prEditId').value;
      const name = document.getElementById('prName').value.trim();
      const discountType = document.getElementById('prDiscountType').value;
      const rawVal = Number(document.getElementById('prDiscountValue').value);
      const discountValue = discountType === 'fixed_amount' ? Math.round(rawVal * 100) : rawVal;
      const targetType = document.getElementById('prTargetType').value;

      let targetId = undefined;
      if (targetType === 'product') {
        targetId = document.getElementById('prTargetProductSelect').value || undefined;
      } else if (targetType === 'category') {
        targetId = document.getElementById('prTargetCategorySelect').value || undefined;
      }

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

      const url = editId ? '/api/v1/admin/promotions/rules/' + editId : '/api/v1/admin/promotions/rules';
      const method = editId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = editId ? '¡Regla actualizada con éxito!' : '¡Regla creada con éxito!';
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

      const editId = document.getElementById('cpEditId').value;
      const code = document.getElementById('cpCode').value.trim().toUpperCase();
      const discountType = document.getElementById('cpDiscountType').value;
      const rawVal = Number(document.getElementById('cpDiscountValue').value);
      const discountValue = discountType === 'fixed_amount' ? Math.round(rawVal * 100) : rawVal;
      const targetType = document.getElementById('cpTargetType').value;

      let targetId = undefined;
      if (targetType === 'product') {
        targetId = document.getElementById('cpTargetProductSelect').value || undefined;
      } else if (targetType === 'category') {
        targetId = document.getElementById('cpTargetCategorySelect').value || undefined;
      }

      const minAmount = Math.round(Number(document.getElementById('cpMinAmount').value || 0) * 100);
      const maxGlobal = document.getElementById('cpMaxGlobal').value ? Number(document.getElementById('cpMaxGlobal').value) : undefined;
      const maxPerCust = Number(document.getElementById('cpMaxPerCustomer').value) || 1;
      const startsAt = new Date(document.getElementById('cpStartsAt').value + 'T00:00:00Z').toISOString();
      const endsAt = new Date(document.getElementById('cpEndsAt').value + 'T23:59:59Z').toISOString();

      const payload = {
        code,
        discountType,
        discountValue,
        targetType,
        targetId,
        minOrderAmountCents: minAmount,
        maxUsesGlobal: maxGlobal,
        maxUsesPerCustomer: maxPerCust,
        startsAt,
        endsAt
      };

      const url = editId ? '/api/v1/admin/promotions/coupons/' + editId : '/api/v1/admin/promotions/coupons';
      const method = editId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = editId ? '¡Cupón actualizado con éxito!' : '¡Cupón creado con éxito!';
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

    function onProductSelectChanged(selectId, infoId) {
      const sel = document.getElementById(selectId);
      const info = document.getElementById(infoId);
      if (!sel || !info) return;
      const selectedOpt = sel.options[sel.selectedIndex];
      if (selectedOpt && selectedOpt.value) {
        info.textContent = '✓ Producto seleccionado: ' + selectedOpt.text;
      } else {
        info.textContent = '';
      }
    }

    window.filterTargetSelect = filterTargetSelect;
    window.onPromoTargetTypeChange = onPromoTargetTypeChange;
    window.onCouponTargetTypeChange = onCouponTargetTypeChange;
    window.onProductSelectChanged = onProductSelectChanged;
  `;
}
