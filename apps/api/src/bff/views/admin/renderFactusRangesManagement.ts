export function renderFactusRangesManagement(): string {
  return `<section class="settings-card" id="factusRangesManager">
    <div class="settings-card-heading"><h2>Administrar rangos Factus</h2><p>Consulta, crea y gestiona rangos de facturación y notas crédito en el entorno seleccionado.</p></div>
    <p class="settings-help">Los rangos deben corresponder a autorizaciones DIAN reales. Cambiar el consecutivo afecta la próxima numeración; eliminar un rango usado lo envía a papelera en Factus.</p>
    <div class="settings-actions">
      <label>Documento <select id="factusRangeDocument"><option value="">Facturas y notas crédito</option><option value="21">Factura electrónica</option><option value="22">Nota crédito</option></select></label>
      <label>Estado <select id="factusRangeStatus"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="with_deleted">Todos, incluidos eliminados</option><option value="deleted">Eliminados</option></select></label>
      <button type="button" class="btn-secondary" id="refreshFactusRanges">Consultar rangos</button>
      <button type="button" class="btn-secondary" id="refreshFactusDianRanges">Rangos asociados a DIAN</button>
    </div>
    <div id="factusRangesMessage" class="msg" role="status"></div>
    <div class="table-wrap"><table><thead><tr><th>ID / Documento</th><th>Prefijo</th><th>Consecutivo</th><th>Resolución / Vigencia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="factusRangesRows"><tr><td colspan="6">Consulta Factus para cargar rangos.</td></tr></tbody></table></div>
    <details class="settings-details"><summary>Crear rango autorizado</summary>
      <form id="factusRangeCreateForm" class="form-grid">
        <label>Tipo de documento<select id="factusCreateDocument"><option value="21">Factura electrónica</option><option value="22">Nota crédito</option></select></label>
        <label>Prefijo DIAN<input id="factusCreatePrefix" maxlength="4" required placeholder="Ej. FEV" /></label>
        <label>Próximo consecutivo<input id="factusCreateCurrent" type="number" min="1" step="1" required value="1" /></label>
        <label id="factusCreateResolutionField">Número de resolución DIAN<input id="factusCreateResolution" maxlength="50" placeholder="Número autorizado" /></label>
        <p class="settings-help">Usa el prefijo y la resolución que Factus muestra para el software; el consecutivo debe ser el siguiente disponible. Factus asigna el ID interno.</p>
        <button type="submit" class="btn-primary">Crear rango en Factus</button>
      </form>
    </details>
    <details class="settings-details"><summary>Rangos asociados al software en DIAN</summary><div class="table-wrap"><table><thead><tr><th>Prefijo</th><th>Desde</th><th>Hasta</th><th>Resolución</th><th>Vigencia</th></tr></thead><tbody id="factusDianRows"><tr><td colspan="5">Presiona “Rangos asociados a DIAN” para consultar.</td></tr></tbody></table></div></details>
  </section>`;
}
