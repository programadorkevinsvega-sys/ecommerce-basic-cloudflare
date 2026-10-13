export function renderAuditAdminScript(): string {
  return `
    async function loadAdminAudit() {
      const tbody = document.getElementById('audit-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/audit', { headers: adminHeaders() });
        const data = await res.json();
        if (!data.success || !data.logs || data.logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay eventos de auditoría registrados</td></tr>';
          return;
        }

        tbody.innerHTML = data.logs.map(l => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem; font-size:0.85rem; color:var(--muted);">\${escapeHtml(new Date(l.createdAt).toLocaleString('es-CO'))}</td>
            <td style="padding:0.75rem;"><strong>\${escapeHtml(l.actorId)}</strong> <small style="color:var(--muted);">(\${escapeHtml(l.actorType)})</small></td>
            <td style="padding:0.75rem;"><span class="tag" style="background:#0284c7; color:#fff;">\${escapeHtml(l.action)}</span></td>
            <td style="padding:0.75rem;"><code>\${escapeHtml(l.entityType)}:\${escapeHtml(l.entityId)}</code></td>
            <td style="padding:0.75rem; font-size:0.8rem; font-family:monospace; color:var(--muted);">
              \${l.changes ? escapeHtml(JSON.stringify(l.changes)) : '--'}
            </td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar bitácora</td></tr>';
      }
    }

    window.loadAdminAudit = loadAdminAudit;
  `;
}
