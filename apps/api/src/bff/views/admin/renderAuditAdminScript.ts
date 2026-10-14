export function renderAuditAdminScript(): string {
  return `
    let auditCurrentPage = 1;
    let auditCurrentLogs = [];

    async function loadAdminAudit(page = auditCurrentPage) {
      const tbody = document.getElementById('audit-table-body');
      if (!tbody) return;
      auditCurrentPage = Math.max(1, Number(page) || 1);
      tbody.innerHTML = '<tr><td colspan="5" class="audit-empty">Cargando auditorías…</td></tr>';
      try {
        const res = await fetch('/api/v1/admin/audit?page=' + auditCurrentPage, { headers: adminHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error('No fue posible consultar la bitácora');
        if (!data.logs || data.logs.length === 0) {
          auditCurrentLogs = [];
          tbody.innerHTML = '<tr><td colspan="5" class="audit-empty">No hay eventos en esta página</td></tr>';
          updateAuditPagination(false);
          return;
        }

        auditCurrentLogs = data.logs;
        tbody.innerHTML = data.logs.map((l, index) => \`
          <tr>
            <td>\${escapeHtml(new Date(l.createdAt).toLocaleString('es-CO'))}</td>
            <td><strong>\${escapeHtml(l.actorId)}</strong><small>\${escapeHtml(l.actorType)}</small></td>
            <td><span class="audit-action">\${escapeHtml(l.action)}</span></td>
            <td><code>\${escapeHtml(l.entityType)}:\${escapeHtml(l.entityId)}</code></td>
            <td class="audit-changes">
              \${l.changes ? \`<div class="audit-changes-preview">\${escapeHtml(JSON.stringify(l.changes))}</div><button class="audit-detail-button" type="button" onclick="showAuditDetails(\${index})">Ver detalle</button>\` : '--'}
            </td>
          </tr>
        \`).join('');
        auditCurrentPage = data.page || auditCurrentPage;
        updateAuditPagination(Boolean(data.hasMore));
      } catch {
        tbody.innerHTML = '<tr><td colspan="5" class="audit-empty error">Error al cargar bitácora</td></tr>';
        updateAuditPagination(false);
      }
    }

    function updateAuditPagination(hasMore) {
      const label = document.getElementById('audit-page-label');
      const previous = document.getElementById('audit-page-previous');
      const next = document.getElementById('audit-page-next');
      if (label) label.textContent = 'Página ' + auditCurrentPage;
      if (previous) previous.disabled = auditCurrentPage <= 1;
      if (next) next.disabled = !hasMore;
    }

    function changeAuditPage(delta) { loadAdminAudit(auditCurrentPage + delta); }
    function showAuditDetails(index) {
      const log = auditCurrentLogs[index];
      const dialog = document.getElementById('audit-detail-dialog');
      const content = document.getElementById('audit-detail-content');
      const title = document.getElementById('audit-detail-title');
      if (!log || !dialog || !content || !title) return;
      title.textContent = 'Detalle: ' + String(log.action || 'Auditoría');
      content.textContent = JSON.stringify(log.changes, null, 2);
      dialog.showModal();
    }
    window.loadAdminAudit = loadAdminAudit;
    window.changeAuditPage = changeAuditPage;
    window.showAuditDetails = showAuditDetails;
  `;
}
