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
  </section>`;
}
