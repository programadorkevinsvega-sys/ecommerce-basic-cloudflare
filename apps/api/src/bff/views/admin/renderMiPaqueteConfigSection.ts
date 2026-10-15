import { CarrierIntegrationConfigDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderMiPaqueteConfigSection(config: CarrierIntegrationConfigDto): string {
  const profiles = (config.packageProfiles || []).map(renderProfile).join('');
  return `<section class="card shipping-carrier-config-card" aria-labelledby="mipaquete-title">
    <div class="shipping-section-heading"><div><h2 id="mipaquete-title">Integración MiPaquete</h2><p>Configura origen, embalajes y condiciones de cotización.</p></div></div>
    <p id="mipaquete-connection-state" class="shipping-connection-state" role="status">Verificando configuración del proveedor…</p>
    <form id="mipaquete-config-form" class="shipping-carrier-config-form">
      <label>Activar cotizaciones de MiPaquete<select id="mp-enabled" required><option value="false" ${config.enabled ? '' : 'selected'}>Desactivado</option><option value="true" ${config.enabled ? 'selected' : ''}>Activado</option></select><small>Se exige al menos una caja activa y dimensiones registradas en los productos. Los valores iniciales del catálogo son estimaciones; confírmalos con el empaque real.</small></label>
      <label>Código DANE de origen<input id="mp-origin" inputmode="numeric" maxlength="8" required value="${config.originDaneCode || ''}" placeholder="05001000" /><small>MiPaquete usa el código de 8 dígitos de la localidad.</small></label>
      <fieldset class="shipping-package-profiles"><legend>Cajas y sobres disponibles</legend><p>El sistema empaqueta cada unidad en estas medidas internas. MiPaquete recibe las medidas externas y el peso total, incluido el empaque.</p><div id="mp-package-profiles">${profiles}</div><button type="button" class="shipping-action" onclick="addMiPaqueteProfile()">Agregar tipo de empaque</button></fieldset>
      <label>Valor declarado<select id="mp-declared" required><option value="">Seleccionar</option><option value="cost" ${config.declaredValueMode === 'cost' ? 'selected' : ''}>Costo del producto</option><option value="sale_value" ${config.declaredValueMode === 'sale_value' ? 'selected' : ''}>Valor de venta</option></select><small>Este valor se envía a MiPaquete para asegurar el paquete.</small></label>
      <label>Liquidación del flete COD<select id="mp-cod-payment" required><option value="">Seleccionar</option><option value="101" ${config.cashOnDeliveryPaymentType === 101 ? 'selected' : ''}>Pagar con saldo MiPaquete</option><option value="102" ${config.cashOnDeliveryPaymentType === 102 ? 'selected' : ''}>Descontar del recaudo</option></select><small>Define cómo la tienda paga el flete a MiPaquete; no determina si el comprador paga el envío aparte.</small></label>
      <label>Transportadora<select id="mp-criterion" required><option value="price" ${config.selectionCriterion === 'price' ? 'selected' : ''}>Menor precio</option><option value="time" ${config.selectionCriterion === 'time' ? 'selected' : ''}>Menor tiempo</option><option value="score" ${config.selectionCriterion === 'score' ? 'selected' : ''}>Mejor calificación</option></select></label>
      <label>Recolección en origen<select id="mp-pickup" required><option value="">Seleccionar</option><option value="true" ${config.requestPickup === true ? 'selected' : ''}>Solicitar</option><option value="false" ${config.requestPickup === false ? 'selected' : ''}>No solicitar</option></select></label>
      <div class="shipping-carrier-config-actions"><button class="btn-primary" type="submit">Guardar configuración</button><span id="mipaquete-config-message" role="status"></span></div>
    </form>
  </section>`;
}

function renderProfile(profile: CarrierIntegrationConfigDto['packageProfiles'][number]): string {
  const fields = [['name', 'Nombre'], ['innerWidthCm', 'Ancho interno (cm)'], ['innerLengthCm', 'Largo interno (cm)'],
    ['innerHeightCm', 'Alto interno (cm)'], ['outerWidthCm', 'Ancho externo (cm)'], ['outerLengthCm', 'Largo externo (cm)'],
    ['outerHeightCm', 'Alto externo (cm)'], ['tareWeightGrams', 'Peso de la caja (g)'], ['maxWeightGrams', 'Peso máximo total (g)']];
  const controls = fields.map(([key, label]) => `<label>${label}<input data-profile-field="${key}" ${key === 'name' ? 'type="text" maxlength="100"' : 'type="number" min="0" step="1"'} value="${escapeValue(String(profile[key as keyof typeof profile] ?? ''))}" required /></label>`).join('');
  return `<fieldset class="shipping-package-profile" data-package-profile data-id="${escapeValue(profile.id)}" data-created-at="${escapeValue(profile.createdAt)}"><legend>${escapeValue(profile.name)}</legend><div class="shipping-package-grid">${controls}<label>Estado<select data-profile-field="isActive"><option value="true" ${profile.isActive ? 'selected' : ''}>Activo</option><option value="false" ${profile.isActive ? '' : 'selected'}>Inactivo</option></select></label></div><button type="button" class="shipping-action danger" onclick="this.closest('[data-package-profile]').remove()">Quitar</button></fieldset>`;
}

function escapeValue(value: string): string { return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
