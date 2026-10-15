import { CarrierIntegrationConfigDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderMiPaqueteConfigSection(config: CarrierIntegrationConfigDto): string {
  return `<section class="card shipping-carrier-config-card" aria-labelledby="mipaquete-title">
    <div class="shipping-section-heading"><div><h2 id="mipaquete-title">MiPaquete</h2><p>Conexión, tarifas, recaudo y condiciones de despacho de esta transportadora.</p></div></div>
    <p id="mipaquete-connection-state" class="shipping-connection-state" role="status">Verificando configuración del proveedor…</p>
    <form id="mipaquete-config-form" class="shipping-carrier-config-form">
      <label>Activar cotizaciones<select id="mp-enabled" required><option value="false" ${config.enabled ? '' : 'selected'}>Desactivado</option><option value="true" ${config.enabled ? 'selected' : ''}>Activado</option></select></label>
      <label>Código DANE de origen<input id="mp-origin" inputmode="numeric" maxlength="8" required value="${config.originDaneCode || ''}" placeholder="05001000" /><small>MiPaquete requiere el código DANE de 8 dígitos.</small></label>
      <label>Valor declarado<select id="mp-declared" required><option value="cost" ${config.declaredValueMode === 'cost' ? 'selected' : ''}>Costo del producto</option><option value="sale_value" ${config.declaredValueMode === 'sale_value' ? 'selected' : ''}>Valor de venta</option></select></label>
      <label>Liquidación del flete COD<select id="mp-cod-payment" required><option value="101" ${config.cashOnDeliveryPaymentType === 101 ? 'selected' : ''}>Pagar con saldo MiPaquete</option><option value="102" ${config.cashOnDeliveryPaymentType === 102 ? 'selected' : ''}>Descontar del recaudo</option></select><small>Define cómo la tienda paga el flete a MiPaquete.</small></label>
      <label>Transportadora<select id="mp-criterion" required><option value="price" ${config.selectionCriterion === 'price' ? 'selected' : ''}>Menor precio</option><option value="time" ${config.selectionCriterion === 'time' ? 'selected' : ''}>Menor tiempo</option><option value="score" ${config.selectionCriterion === 'score' ? 'selected' : ''}>Mejor calificación</option></select></label>
      <label>Recolección en origen<select id="mp-pickup" required><option value="true" ${config.requestPickup === true ? 'selected' : ''}>Solicitar</option><option value="false" ${config.requestPickup === false ? 'selected' : ''}>No solicitar</option></select></label>
      <div class="shipping-carrier-config-actions"><button class="btn-primary" type="submit">Guardar configuración</button><span id="mipaquete-config-message" role="status"></span></div>
    </form>
  </section>
  <section class="card shipping-carrier-config-card"><div class="shipping-section-heading shipping-package-heading"><div><h2>Empaques de MiPaquete</h2><p>El pedido se acomoda en el empaque activo más pequeño compatible. Dimensiones en centímetros y pesos en gramos.</p></div><button type="button" class="shipping-action primary" id="mp-package-create">+ Crear empaque</button></div>
    <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Empaque</th><th>Dimensión interna</th><th>Dimensión externa</th><th>Peso tara / máximo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="mp-package-rows">${(config.packageProfiles || []).map(renderProfileRow).join('') || '<tr><td colspan="6" class="shipping-empty">No hay empaques registrados.</td></tr>'}</tbody></table></div>
  </section>
  <dialog class="shipping-detail-dialog shipping-package-dialog" id="mp-package-dialog"><form id="mp-package-form"><header><div><h2 id="mp-package-title">Crear empaque</h2><p>Registra medidas internas, externas y capacidad de peso.</p></div><button type="button" class="shipping-action" id="mp-package-close" aria-label="Cerrar">×</button></header><input id="mp-package-id" type="hidden"><div class="shipping-package-grid">${profileFields()}</div><label class="mp-package-state">Estado<select id="mp-package-active"><option value="true">Activo</option><option value="false">Inactivo</option></select></label><footer><button type="button" class="shipping-action" id="mp-package-cancel">Cancelar</button><button type="submit" class="btn-primary">Guardar empaque</button></footer></form></dialog>`;
}

function profileFields(): string {
  return [['name','Nombre del empaque','text'],['innerWidthCm','Ancho interno (cm)'],['innerLengthCm','Largo interno (cm)'],['innerHeightCm','Alto interno (cm)'],['outerWidthCm','Ancho externo (cm)'],['outerLengthCm','Largo externo (cm)'],['outerHeightCm','Alto externo (cm)'],['tareWeightGrams','Peso del empaque (g)'],['maxWeightGrams','Peso máximo total (g)']].map(([key,label,type]) => `<label>${label}<input data-mp-package="${key}" type="${type || 'number'}" ${type ? 'maxlength="100"' : 'min="0" step="1"'} required></label>`).join('');
}

function renderProfileRow(profile: CarrierIntegrationConfigDto['packageProfiles'][number]): string {
  const val = (n: number) => `${n} cm`;
  const dim = (a: number,b: number,c: number) => `${val(a)} × ${val(b)} × ${val(c)}`;
  return `<tr data-package-row="${escapeValue(profile.id)}"><td><strong>${escapeValue(profile.name)}</strong></td><td>${dim(profile.innerWidthCm,profile.innerLengthCm,profile.innerHeightCm)}</td><td>${dim(profile.outerWidthCm,profile.outerLengthCm,profile.outerHeightCm)}</td><td>${profile.tareWeightGrams} g / ${profile.maxWeightGrams} g</td><td><span class="shipping-badge ${profile.isActive ? 'active' : 'inactive'}">${profile.isActive ? 'Activo' : 'Inactivo'}</span></td><td><div class="shipping-row-actions"><button class="shipping-action" data-package-action="view">Ver</button><button class="shipping-action" data-package-action="edit">Editar</button><button class="shipping-action" data-package-action="toggle">${profile.isActive ? 'Desactivar' : 'Activar'}</button><button class="shipping-action danger" data-package-action="delete">Eliminar</button></div></td></tr>`;
}

function escapeValue(value: string): string { return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
