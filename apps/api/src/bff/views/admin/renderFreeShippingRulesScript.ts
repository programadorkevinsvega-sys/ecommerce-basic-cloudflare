export function renderFreeShippingRulesScript(): string {
  return `
    let freeShippingPage = 1;
    let freeShippingTargetPage = 1;
    const freeShippingRules = new Map();
    const freeShippingFmt = value => '$' + (Number(value || 0) / 100).toLocaleString('es-CO');
    window.loadFreeShippingRules = async page => {
      freeShippingPage = Math.max(1, page);
      const body = document.getElementById('free-shipping-rules-body');
      if (!body) return;
      body.innerHTML = '<tr><td colspan="6">Cargando reglas…</td></tr>';
      try {
        const response = await fetch('/api/v1/admin/shipping/free-shipping-rules?page=' + freeShippingPage);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudieron cargar las reglas.');
        freeShippingRules.clear();
        const items = Array.isArray(result.items) ? result.items : [];
        items.forEach(item => freeShippingRules.set(item.id, item));
        body.innerHTML = items.length ? items.map(rule => {
          return '<tr><td><strong>' + escapeHtml(rule.name) + '</strong></td><td>' + escapeHtml(rule.targetName) + '</td><td>' + freeShippingFmt(rule.minOrderAmountCents) + '</td><td>' + new Date(rule.startsAt).toLocaleDateString('es-CO') + ' – ' + new Date(rule.endsAt).toLocaleDateString('es-CO') + '</td><td>' + (rule.isActive ? 'Activa' : 'Inactiva') + '</td><td class="admin-actions"><button class="btn-action btn-action-view" data-free-shipping-action="view" data-rule-id="' + escapeHtml(rule.id) + '">Ver</button><button class="btn-action btn-action-edit" data-free-shipping-action="edit" data-rule-id="' + escapeHtml(rule.id) + '">Editar</button><button class="btn-action btn-action-hide" data-free-shipping-action="toggle" data-rule-id="' + escapeHtml(rule.id) + '">' + (rule.isActive ? 'Desactivar' : 'Activar') + '</button><button class="btn-action btn-action-delete" data-free-shipping-action="delete" data-rule-id="' + escapeHtml(rule.id) + '">Eliminar</button></td></tr>';
        }).join('') : '<tr><td colspan="6">No hay reglas de envío gratis.</td></tr>';
        body.querySelectorAll('[data-free-shipping-action]').forEach(button => {
          button.addEventListener('click', () => {
            const action = button.dataset.freeShippingAction;
            const id = button.dataset.ruleId;
            if (action === 'view') viewFreeShippingRule(id);
            if (action === 'edit') editFreeShippingRule(id);
            if (action === 'toggle') toggleFreeShippingRule(id);
            if (action === 'delete') deleteFreeShippingRule(id);
          });
        });
        document.getElementById('free-shipping-page-label').textContent = (result.total ? (freeShippingPage - 1) * 10 + 1 + '–' + Math.min(freeShippingPage * 10, result.total) + ' de ' + result.total : '0 registros') + ' · Página ' + freeShippingPage;
        document.getElementById('free-shipping-prev').disabled = freeShippingPage <= 1;
        document.getElementById('free-shipping-next').disabled = !result.hasMore;
      } catch (error) { body.innerHTML = '<tr><td colspan="6">' + escapeHtml(error.message) + '</td></tr>'; }
    };
    window.openFreeShippingRuleModal = () => { resetFreeShippingRuleForm(); document.getElementById('free-shipping-rule-modal').showModal(); };
    window.closeFreeShippingRuleModal = () => document.getElementById('free-shipping-rule-modal').close();
    function resetFreeShippingRuleForm() {
      const form = document.getElementById('free-shipping-rule-form'); if (!form) return;
      form.reset(); document.getElementById('fs-rule-id').value = ''; document.getElementById('fs-rule-active').checked = true;
      document.getElementById('fs-rule-target-type').value = 'all'; updateFreeShippingTarget();
      const now = new Date(); const end = new Date(now.getTime() + 30 * 86400000);
      document.getElementById('fs-rule-start').value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById('fs-rule-end').value = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById('free-shipping-form-title').textContent = 'Crear regla de envío gratis';
    }
    async function updateFreeShippingTarget(selectedId, page = 1) {
      const type = document.getElementById('fs-rule-target-type').value;
      freeShippingTargetPage = page;
      const wrap = document.getElementById('fs-rule-target-wrap'); wrap.hidden = type === 'all';
      document.getElementById('fs-rule-target').disabled = type === 'all';
      if (type === 'all') return;
      const query = document.getElementById('fs-rule-target-search').value;
      const response = await fetch('/api/v1/admin/shipping/free-shipping-targets?type=' + type + '&page=' + page + '&q=' + encodeURIComponent(query) + (selectedId ? '&id=' + encodeURIComponent(selectedId) : ''));
      const result = await response.json();
      document.getElementById('fs-rule-target').innerHTML = '<option value="">Selecciona un destino</option>' + result.items.map(item => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name + (item.detail ? ' · ' + item.detail : '')) + '</option>').join('');
      document.getElementById('fs-target-page').textContent = 'Página ' + page;
      document.getElementById('fs-target-prev').disabled = page <= 1;
      document.getElementById('fs-target-next').disabled = !result.hasMore;
    }
    document.getElementById('fs-rule-target-type')?.addEventListener('change', updateFreeShippingTarget);
    document.getElementById('fs-rule-target-search')?.addEventListener('input', () => updateFreeShippingTarget(null, 1));
    document.getElementById('fs-target-prev')?.addEventListener('click', () => updateFreeShippingTarget(null, freeShippingTargetPage - 1));
    document.getElementById('fs-target-next')?.addEventListener('click', () => updateFreeShippingTarget(null, freeShippingTargetPage + 1));
    window.viewFreeShippingRule = id => { const r = freeShippingRules.get(id); if (r) alert(r.name + '\\nAlcance: ' + r.targetType + (r.targetId ? '\\nDestino: ' + r.targetId : '') + '\\nMínimo: ' + freeShippingFmt(r.minOrderAmountCents) + '\\nVigencia: ' + r.startsAt + ' – ' + r.endsAt); };
    window.editFreeShippingRule = id => {
      const r = freeShippingRules.get(id); if (!r) return;
      document.getElementById('fs-rule-id').value = r.id; document.getElementById('fs-rule-name').value = r.name;
      document.getElementById('fs-rule-target-type').value = r.targetType; document.getElementById('fs-rule-minimum').value = Math.round(r.minOrderAmountCents / 100);
      const start = new Date(r.startsAt); const end = new Date(r.endsAt);
      document.getElementById('fs-rule-start').value = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16); document.getElementById('fs-rule-end').value = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById('fs-rule-priority').value = r.priority; document.getElementById('fs-rule-active').checked = r.isActive;
      updateFreeShippingTarget(r.targetId).then(() => { document.getElementById('fs-rule-target').value = r.targetId || ''; });
      document.getElementById('free-shipping-form-title').textContent = 'Editar regla de envío gratis'; document.getElementById('free-shipping-rule-modal').showModal();
    };
    window.toggleFreeShippingRule = async id => {
      const r = freeShippingRules.get(id); if (!r) return;
      const response = await fetch('/api/v1/admin/shipping/free-shipping-rules/' + id + '/status', { method: 'PATCH', headers: adminHeaders(true), body: JSON.stringify({ isActive: !r.isActive }) });
      if (response.ok) loadFreeShippingRules(freeShippingPage); else alert('No fue posible actualizar la regla.');
    };
    window.deleteFreeShippingRule = async id => {
      if (!confirm('¿Eliminar esta regla de envío gratis?')) return;
      const response = await fetch('/api/v1/admin/shipping/free-shipping-rules/' + id, { method: 'DELETE' });
      if (response.ok) loadFreeShippingRules(freeShippingPage); else alert('No fue posible eliminar la regla.');
    };
    document.getElementById('free-shipping-rule-form')?.addEventListener('submit', async event => {
      event.preventDefault(); const id = document.getElementById('fs-rule-id').value;
      const targetType = document.getElementById('fs-rule-target-type').value;
      const body = { name: document.getElementById('fs-rule-name').value.trim(), targetType, targetId: targetType === 'all' ? null : document.getElementById('fs-rule-target').value,
        minOrderAmountCents: Number(document.getElementById('fs-rule-minimum').value) * 100, startsAt: new Date(document.getElementById('fs-rule-start').value).toISOString(), endsAt: new Date(document.getElementById('fs-rule-end').value).toISOString(),
        isActive: document.getElementById('fs-rule-active').checked, priority: Number(document.getElementById('fs-rule-priority').value) };
      const response = await fetch('/api/v1/admin/shipping/free-shipping-rules' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', headers: adminHeaders(true), body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) { document.getElementById('fs-rule-message').textContent = result.error || 'No se pudo guardar.'; return; }
      closeFreeShippingRuleModal(); loadFreeShippingRules(1);
    });
  `;
}
