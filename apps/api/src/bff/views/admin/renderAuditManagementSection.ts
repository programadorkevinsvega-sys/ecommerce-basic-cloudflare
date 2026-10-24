export function renderAuditManagementSection(): string {
  return `
    <section class="audit-screen">
      <header class="audit-heading">
        <div><span class="audit-eyebrow">SISTEMA</span><h1>Auditoría</h1>
          <p>Consulta el registro de acciones administrativas y eventos críticos.</p></div>
      </header>
      <div class="audit-card">
        <div class="audit-table-scroll"><table class="audit-table">
          <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Detalles</th></tr></thead>
          <tbody id="audit-table-body"><tr><td colspan="5" class="audit-empty">Cargando auditorías…</td></tr></tbody>
        </table></div>
        <footer class="audit-pagination" aria-label="Paginación de auditorías">
          <button id="audit-page-previous" class="audit-page-button" onclick="changeAuditPage(-1)" disabled>Anterior</button>
          <span id="audit-page-label" aria-live="polite">Página 1</span>
          <button id="audit-page-next" class="audit-page-button" onclick="changeAuditPage(1)" disabled>Siguiente</button>
        </footer>
      </div>
      <dialog id="audit-detail-dialog" class="audit-detail-dialog" aria-labelledby="audit-detail-title">
        <header><h2 id="audit-detail-title">Detalle de auditoría</h2><form method="dialog"><button class="audit-detail-close">Cerrar</button></form></header>
        <pre id="audit-detail-content"></pre>
      </dialog>
    </section>
  `;
}
