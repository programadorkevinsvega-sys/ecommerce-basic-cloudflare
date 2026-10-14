export function renderAdminPaginationScript(): string {
  return `
    const adminTablePages = Object.create(null);
    const adminStaticRows = new WeakMap();
    window.paginateAdminTable = function(key, tbody, rows, renderRow, colspan, emptyMessage) {
      if (!tbody) return;
      const pageSize = 10;
      const total = rows.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const state = adminTablePages[key] || (adminTablePages[key] = { page: 1 });
      state.page = Math.min(Math.max(1, state.page), pageCount);
      const start = (state.page - 1) * pageSize;
      const pageRows = rows.slice(start, start + pageSize);
      tbody.innerHTML = pageRows.length ? pageRows.map(renderRow).join('') : '<tr><td colspan="' + colspan + '" class="admin-pagination-empty">' + escapeHtml(emptyMessage || 'No hay registros para mostrar.') + '</td></tr>';

      const table = tbody.closest('table');
      if (!table) return;
      let footer = document.getElementById('admin-pagination-' + key);
      if (!footer) {
        footer = document.createElement('nav');
        footer.id = 'admin-pagination-' + key;
        footer.className = 'admin-pagination';
        footer.setAttribute('aria-label', 'Paginación de resultados');
        table.after(footer);
      }
      const from = total ? start + 1 : 0;
      const to = Math.min(start + pageSize, total);
      footer.innerHTML = '<button type="button" class="admin-page-button" data-page="previous">Anterior</button><span aria-live="polite">' + from + '–' + to + ' de ' + total + ' · Página ' + state.page + ' de ' + pageCount + '</span><button type="button" class="admin-page-button" data-page="next">Siguiente</button>';
      const previous = footer.querySelector('[data-page="previous"]');
      const next = footer.querySelector('[data-page="next"]');
      previous.disabled = state.page <= 1;
      next.disabled = state.page >= pageCount;
      previous.onclick = () => { state.page--; window.paginateAdminTable(key, tbody, rows, renderRow, colspan, emptyMessage); document.querySelector('#admin-pagination-' + key + ' [data-page="' + (state.page <= 1 ? 'next' : 'previous') + '"]')?.focus(); };
      next.onclick = () => { state.page++; window.paginateAdminTable(key, tbody, rows, renderRow, colspan, emptyMessage); document.querySelector('#admin-pagination-' + key + ' [data-page="' + (state.page >= pageCount ? 'previous' : 'next') + '"]')?.focus(); };
    };
    window.resetAdminTablePage = (key) => { if (adminTablePages[key]) adminTablePages[key].page = 1; };
    window.getStaticAdminTableRows = (tbody) => adminStaticRows.get(tbody) || [];

    function initializeStaticAdminTables() {
      const tables = document.querySelectorAll('[data-marketing-page] table');
      tables.forEach((table, index) => {
        const tbody = table.querySelector('tbody');
        if (!tbody || tbody.dataset.paginationReady) return;
        tbody.dataset.paginationReady = 'true';
        const originalRows = Array.from(tbody.rows);
        const emptyRow = originalRows.length === 1 && originalRows[0].querySelector('td[colspan]') ? originalRows[0].outerHTML : '';
        const rows = emptyRow ? [] : originalRows.map((row) => row.outerHTML);
        const key = table.id || 'static-table-' + index;
        adminStaticRows.set(tbody, rows);
        tbody.dataset.paginationKey = key;
        window.paginateAdminTable(key, tbody, rows, (row) => row, table.querySelectorAll('thead th').length || 1, emptyRow ? originalRows[0].innerText.trim() : 'No hay registros para mostrar.');
      });
    }
    initializeStaticAdminTables();
  `;
}
