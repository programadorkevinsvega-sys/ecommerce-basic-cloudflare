export function renderAuditManagementSection(): string {
  return `
    <div class="card" style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h2>Bitácora de Auditoría</h2>
          <p style="color:var(--muted); font-size:0.85rem; margin-top:0.25rem;">Registro inmutable de todas las mutaciones administrativas y eventos críticos del sistema.</p>
        </div>
        <button class="btn-primary" onclick="loadAdminAudit()" style="padding:0.4rem 0.8rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.85rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">Fecha</th>
              <th style="padding:0.75rem;">Actor</th>
              <th style="padding:0.75rem;">Acción</th>
              <th style="padding:0.75rem;">Entidad</th>
              <th style="padding:0.75rem;">Detalles</th>
            </tr>
          </thead>
          <tbody id="audit-table-body">
            <tr><td colspan="5" style="padding:1.5rem; text-align:center; color:var(--muted);">Cargando registros de auditoría...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
