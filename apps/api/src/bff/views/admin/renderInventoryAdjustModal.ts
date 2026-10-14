export function renderInventoryAdjustModal(): string {
  return `<div id="inv-adjust-modal" class="inventory-modal" hidden>
    <button class="inventory-modal-backdrop" type="button" data-inventory-modal-close aria-label="Cerrar ajuste"></button>
    <section class="inventory-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-adjust-title" tabindex="-1">
      <header class="inventory-modal-heading"><div><h2 id="inventory-adjust-title">Ajustar stock</h2><p id="inv-modal-product-name"></p><small id="inv-modal-product-meta"></small></div>
        <button class="inventory-modal-close" type="button" data-inventory-modal-close aria-label="Cerrar">${closeIcon()}</button>
      </header>
      <form id="inventory-adjust-form" class="inventory-adjust-form" novalidate>
        <fieldset class="inventory-movement-types"><legend>Tipo de movimiento</legend>
          ${movementType('entry', 'Entrada', 'Suma unidades al inventario')}${movementType('exit', 'Salida', 'Resta unidades del inventario')}${movementType('correction', 'Corrección', 'Fija el stock contado')}
        </fieldset>
        <div class="inventory-modal-fields"><div class="inventory-modal-field"><label id="inv-qty-label" for="inv-adjust-quantity">Cantidad de unidades</label><input id="inv-adjust-quantity" type="number" inputmode="numeric" min="0" step="1" aria-describedby="inv-qty-help" aria-invalid="false"><small id="inv-qty-help">Ingresa un entero mayor a cero.</small></div>
          <div class="inventory-modal-field"><label for="inv-adjust-reason">Motivo</label><select id="inv-adjust-reason"></select></div>
        </div>
        <div class="inventory-modal-field"><label for="inv-adjust-note">Nota <span>(opcional)</span></label><input id="inv-adjust-note" type="text" maxlength="120" placeholder="Proveedor, factura o detalle"><small>La nota se guardará junto al motivo del movimiento.</small></div>
        <dl id="inv-adjust-preview" class="inventory-adjust-preview" aria-live="polite"><div><dt>Stock actual</dt><dd id="inv-preview-current">—</dd></div><div><dt>Movimiento</dt><dd id="inv-preview-delta">—</dd></div><div class="inventory-preview-total"><dt>Stock nuevo</dt><dd id="inv-preview-new">—</dd></div></dl>
        <p id="inv-adjust-error" class="inventory-adjust-error" role="alert" hidden></p>
        <footer class="inventory-modal-actions"><button class="inventory-secondary-button" type="button" data-inventory-modal-close>Cancelar</button><button id="inv-adjust-submit" class="inventory-primary-button" type="submit" disabled>Registrar movimiento</button></footer>
      </form>
    </section>
  </div>`;
}

function movementType(value: string, label: string, description: string): string {
  return `<label class="inventory-type-option" for="inv-type-${value}"><input id="inv-type-${value}" type="radio" name="inventory-movement-type" value="${value}"${value === 'entry' ? ' checked' : ''}><span><strong>${label}</strong><small>${description}</small></span></label>`;
}

function closeIcon(): string {
  return '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12 M18 6L6 18"/></svg>';
}
