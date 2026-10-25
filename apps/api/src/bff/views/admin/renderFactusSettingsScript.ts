export function renderFactusSettingsScript(): string {
  return `
    (() => {
      const get = (id) => document.getElementById(id);
      const notice = (id, text, ok = false) => { const el = get(id); el.textContent = text; el.style.background = ok ? '#065f46' : '#334155'; el.style.display = 'block'; };
      const headers = (json = false) => window.adminHeaders ? window.adminHeaders(json) : (json ? { 'Content-Type': 'application/json' } : {});
      const request = async (url, init = {}) => {
        const response = await fetch(url, { ...init, headers: { ...headers(Boolean(init.body)), ...init.headers }, cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación con Factus');
        return data;
      };
      const rangeUrl = '/api/v1/admin/factus/numbering-ranges';
      const selected = (range) => range.documentCode === '21' ? get('factusInvoiceRange') : get('factusCreditRange');
      const label = (range) => [range.prefix, range.documentName, range.current + '/' + range.to,
        range.resolutionNumber ? 'Resolución ' + range.resolutionNumber : '', range.endDate ? 'Vence ' + range.endDate : ''].filter(Boolean).join(' · ');

      get('saveFactusSettings')?.addEventListener('click', async (event) => {
        const button = event.currentTarget; button.disabled = true;
        notice('factusSettingsMessage', 'Guardando configuración de Factus…');
        try {
          await request('/api/v1/settings', { method: 'PATCH', body: JSON.stringify({ factusMode: get('factusMode').value,
            factusNumberingRangeId: get('factusInvoiceRange').value.trim(), factusCreditNoteNumberingRangeId: get('factusCreditRange').value.trim() }) });
          notice('factusSettingsMessage', 'Configuración Factus guardada.', true);
        } catch (error) { notice('factusSettingsMessage', error.message); }
        finally { button.disabled = false; }
      });

      get('loadFactusRanges')?.addEventListener('click', async () => {
        if (get('factusMode').value === 'disabled') return notice('factusSettingsMessage', 'Selecciona y guarda Pruebas o Producción antes de consultar.');
        const button = get('loadFactusRanges'); button.disabled = true;
        try {
          const { ranges } = await request(rangeUrl);
          for (const code of ['21', '22']) {
            const list = get(code === '21' ? 'factusInvoiceRanges' : 'factusCreditRanges'); list.replaceChildren();
            ranges.filter((range) => range.documentCode === code).forEach((range) => { const option = document.createElement('option'); option.value = range.id; option.label = label(range); list.append(option); });
          }
          notice('factusSettingsMessage', 'Rangos activos consultados. Selecciona el ID correspondiente y guarda.', true);
        } catch (error) { notice('factusSettingsMessage', error.message); }
        finally { button.disabled = false; }
      });

      const render = (ranges) => {
        const rows = get('factusRangesRows'); rows.replaceChildren();
        if (!ranges.length) { rows.innerHTML = '<tr><td colspan="6">Factus no devolvió rangos para estos filtros.</td></tr>'; return; }
        ranges.forEach((range) => rows.append(rangeRow(range)));
        for (const range of ranges.filter((item) => item.isActive && !item.deletedAt)) {
          const list = get(range.documentCode === '21' ? 'factusInvoiceRanges' : 'factusCreditRanges');
          if (!Array.from(list.options).some((option) => option.value === range.id)) {
            const option = document.createElement('option'); option.value = range.id; option.label = label(range); list.append(option);
          }
        }
      };

      const rangeRow = (range) => {
        const row = document.createElement('tr');
        const status = range.deletedAt ? 'Eliminado' : range.isExpired ? 'Vencido' : range.isActive ? 'Activo' : 'Inactivo';
        const details = [range.resolutionNumber || 'Sin resolución', [range.startDate, range.endDate].filter(Boolean).join(' – ') || 'Vigencia sin datos'].join(' · ');
        [range.id + ' · ' + range.documentName, range.prefix, range.current + ' / ' + range.to, details, status].forEach((text) => { const cell = document.createElement('td'); cell.textContent = text; row.append(cell); });
        const actions = document.createElement('td');
        addAction(actions, 'Ver', 'view', range.id);
        if (range.deletedAt) addAction(actions, 'Restaurar', 'restore', range.id);
        else { addAction(actions, range.isActive ? 'Desactivar' : 'Activar', 'toggle', range.id); addAction(actions, 'Cambiar consecutivo', 'current', range.id); addAction(actions, 'Eliminar', 'delete', range.id); }
        row.append(actions); return row;
      };
      const addAction = (cell, text, action, id) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-secondary'; button.textContent = text; button.dataset.action = action; button.dataset.id = id; cell.append(button); };

      const loadRanges = async () => {
        const params = new URLSearchParams({ status: get('factusRangeStatus').value });
        if (get('factusRangeDocument').value) params.set('document', get('factusRangeDocument').value);
        notice('factusRangesMessage', 'Consultando rangos en Factus…');
        const { ranges } = await request(rangeUrl + '?' + params);
        render(ranges); notice('factusRangesMessage', ranges.length + ' rango(s) consultado(s).', true);
      };
      get('refreshFactusRanges')?.addEventListener('click', () => loadRanges().catch((error) => notice('factusRangesMessage', error.message)));
      get('factusRangeStatus')?.addEventListener('change', () => loadRanges().catch((error) => notice('factusRangesMessage', error.message)));
      get('factusRangeDocument')?.addEventListener('change', () => loadRanges().catch((error) => notice('factusRangesMessage', error.message)));

      get('factusRangesRows')?.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]'); if (!button) return;
        const { action, id } = button.dataset; button.disabled = true;
        try {
          if (action === 'view') { const { range } = await request(rangeUrl + '/' + encodeURIComponent(id)); window.alert(JSON.stringify(range, null, 2)); return; }
          if (action === 'toggle' && !window.confirm('¿Cambiar el estado de este rango en Factus?')) return;
          if (action === 'delete' && window.prompt('Para eliminar el rango, escribe su ID:') !== id) return;
          if (action === 'restore' && !window.confirm('¿Restaurar este rango eliminado en Factus?')) return;
          if (action === 'current') {
            const value = window.prompt('Escribe el próximo consecutivo que debe emitir Factus:');
            if (value === null || !/^\\d+$/.test(value)) return;
            await request(rangeUrl + '/' + id + '/current', { method: 'PATCH', body: JSON.stringify({ current: Number(value) }) });
          } else if (action === 'toggle') await request(rangeUrl + '/' + id + '/status', { method: 'PATCH' });
          else if (action === 'delete') await request(rangeUrl + '/' + id, { method: 'DELETE' });
          else if (action === 'restore') await request(rangeUrl + '/' + id + '/restore', { method: 'PUT' });
          await loadRanges();
        } catch (error) { notice('factusRangesMessage', error.message); }
        finally { button.disabled = false; }
      });

      get('factusCreateDocument')?.addEventListener('change', () => { get('factusCreateResolutionField').hidden = get('factusCreateDocument').value === '22'; });
      get('factusRangeCreateForm')?.addEventListener('submit', async (event) => {
        event.preventDefault(); const button = event.submitter; button.disabled = true;
        const documentCode = get('factusCreateDocument').value;
        const body = { documentCode, prefix: get('factusCreatePrefix').value.trim().toUpperCase(), current: Number(get('factusCreateCurrent').value),
          resolutionNumber: get('factusCreateResolution').value.trim() || undefined };
        try {
          const { range } = await request(rangeUrl, { method: 'POST', body: JSON.stringify(body) });
          selected(range).value = range.id;
          notice('factusRangesMessage', 'Rango ' + range.id + ' creado. Se seleccionó para facturación; guarda la configuración para aplicarlo.', true);
          await loadRanges();
        } catch (error) { notice('factusRangesMessage', error.message); }
        finally { button.disabled = false; }
      });

      get('refreshFactusDianRanges')?.addEventListener('click', async (event) => {
        const button = event.currentTarget; button.disabled = true;
        try {
          const { ranges } = await request(rangeUrl + '/associated'); const tbody = get('factusDianRows'); tbody.replaceChildren();
          ranges.forEach((range) => { const row = document.createElement('tr');
            [range.prefix, range.from, range.to, range.resolution_number, [range.start_date, range.end_date].filter(Boolean).join(' – ')].forEach((value) => { const cell = document.createElement('td'); cell.textContent = value == null ? '—' : String(value); row.append(cell); }); tbody.append(row); });
          if (!ranges.length) tbody.innerHTML = '<tr><td colspan="5">No hay rangos asociados devueltos por Factus.</td></tr>';
        } catch (error) { notice('factusRangesMessage', error.message); }
        finally { button.disabled = false; }
      });
    })();
  `;
}
