export function renderFactusSettingsScript(): string {
  return `
    (() => {
      const button = document.getElementById('loadFactusRanges');
      const save = document.getElementById('saveFactusSettings');
      const message = document.getElementById('factusSettingsMessage');
      const mode = document.getElementById('factusMode');
      if (!button || !save || !message || !mode) return;

      const show = (text, ok = false) => {
        message.textContent = text;
        message.style.background = ok ? '#065f46' : '#334155';
        message.style.display = 'block';
      };
      const setOptions = (id, ranges) => {
        const list = document.getElementById(id);
        list.replaceChildren();
        ranges.forEach((range) => {
          const option = document.createElement('option');
          option.value = range.id;
          option.label = [range.prefix, range.documentName, range.current + '/' + range.to,
            range.resolutionNumber ? 'Resolución ' + range.resolutionNumber : '',
            range.endDate ? 'Vence ' + range.endDate : '', range.isExpired ? 'Vencido' : ''].filter(Boolean).join(' · ');
          list.append(option);
        });
      };

      button.addEventListener('click', async () => {
        if (mode.value === 'disabled') {
          show('Selecciona Pruebas o Producción, guarda la configuración y luego consulta sus rangos.');
          return;
        }
        button.disabled = true;
        show('Consultando rangos activos en Factus…');
        try {
          const response = await fetch('/api/v1/admin/factus/numbering-ranges', { cache: 'no-store' });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || 'No se pudieron consultar los rangos');
          const invoiceRanges = data.ranges.filter((range) => range.documentCode === '21');
          const creditRanges = data.ranges.filter((range) => range.documentCode === '22');
          setOptions('factusInvoiceRanges', invoiceRanges);
          setOptions('factusCreditRanges', creditRanges);
          show('Factus respondió: ' + invoiceRanges.length + ' rango(s) de factura y ' + creditRanges.length + ' de nota crédito. Selecciona el ID y guarda.', true);
        } catch (error) {
          show(error.message || 'No se pudieron consultar los rangos');
        } finally { button.disabled = false; }
      });

      save.addEventListener('click', async () => {
        save.disabled = true;
        show('Guardando configuración de Factus…');
        try {
          const response = await fetch('/api/v1/settings', {
            method: 'PATCH', headers: window.adminHeaders ? window.adminHeaders(true) : { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factusMode: mode.value,
              factusNumberingRangeId: document.getElementById('factusInvoiceRange').value.trim(),
              factusCreditNoteNumberingRangeId: document.getElementById('factusCreditRange').value.trim() })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || 'No se pudo guardar Factus');
          show('Configuración Factus guardada.', true);
        } catch (error) { show(error.message || 'No se pudo guardar Factus'); }
        finally { save.disabled = false; }
      });
    })();
  `;
}
