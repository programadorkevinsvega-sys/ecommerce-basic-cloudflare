import { CartDto } from '../gateways/cart/CartGateway.js';
import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ShippingZoneDto } from '../gateways/shipping/ShippingGateway.js';
import { getCheckoutScript } from './getCheckoutScript.js';
import { getCheckoutLocationScript } from './getCheckoutLocationScript.js';
import { getCheckoutDraftScript } from './getCheckoutDraftScript.js';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function renderCheckoutPage(cart: CartDto, productsMap: Map<string, CatalogProductDto>, zones: ShippingZoneDto[], taxRatePercent = 19): string {
  const subtotalCents = cart.items.reduce((total, item) => total + item.subtotalCents, 0);
  const taxCents = Math.round(subtotalCents * taxRatePercent / 100);
  const cartItems = cart.items.map((item) => {
    const product = productsMap.get(item.productId);
    return { productId: item.productId, productName: product?.name ?? 'Producto', productSku: product?.sku ?? item.productId.slice(0, 8), quantity: item.quantity, unitPriceCents: item.unitPriceCents };
  });
  const itemsJson = JSON.stringify(cartItems);
  const rows = cart.items.map((item) => renderCheckoutItem(item, productsMap.get(item.productId))).join('');
  const zoneOptions = zones.map((zone) => `<option value="${escapeHtml(zone.id)}" data-rate="${zone.priceInCents}" data-cod="${zone.allowsCashOnDelivery}" data-min-days="${zone.minEstimatedDays}" data-max-days="${zone.maxEstimatedDays}" data-locations="${escapeHtml(JSON.stringify(zone.locations))}">${escapeHtml(zone.name)} · ${zone.priceInCents === 0 ? 'Envío gratis' : formatPrice(zone.priceInCents)}</option>`).join('');
  return `<section class="checkout-page" aria-labelledby="checkout-title">
    <nav class="checkout-steps" aria-label="Progreso de la compra"><ol><li class="checkout-step checkout-step-done"><span class="checkout-step-number" aria-hidden="true">✓</span>Carrito<span class="checkout-sr-only"> (completado)</span></li><li class="checkout-step-line" aria-hidden="true"></li><li class="checkout-step checkout-step-current" aria-current="step"><span class="checkout-step-number" aria-hidden="true">2</span>Datos y pago</li><li class="checkout-step-line" aria-hidden="true"></li><li class="checkout-step"><span class="checkout-step-number" aria-hidden="true">3</span>Confirmación</li></ol></nav>
    <h1 class="checkout-title" id="checkout-title">Finalizar compra</h1><p class="checkout-draft-note">Tus datos se conservan temporalmente en esta pestaña durante 2 horas y se borran al crear el pedido.</p>
    <div class="checkout-columns"><form id="checkout-form" class="checkout-form" novalidate><p class="checkout-required-note">Los campos marcados con * son obligatorios.</p>
      ${renderContactFields()}
      ${renderAddressFields(zoneOptions)}
      ${renderPaymentFields()}
      <div><button type="button" id="btn-submit-order" class="checkout-submit" onclick="submitOrder()" disabled><span id="checkout-cta-label">Pagar ${formatPrice(subtotalCents + taxCents)}</span><span aria-hidden="true">→</span></button><p id="checkout-submit-note" class="checkout-submit-note" aria-live="polite">Selecciona una zona para validar cobertura y envío.</p><p id="checkout-error" class="checkout-error" role="alert" hidden></p><p class="checkout-terms">Tus datos se usan para gestionar y confirmar este pedido.</p></div>
    </form>
    ${renderCheckoutSummary(rows, subtotalCents, taxCents, taxRatePercent)}
    </div><footer class="checkout-footer"><span><strong>VEGA STORE</strong> · © ${new Date().getFullYear()} · Colombia</span><span>Compra segura · Precios en COP</span></footer>
  </section>${getCheckoutLocationScript()}${getCheckoutScript(itemsJson, subtotalCents, taxRatePercent)}${getCheckoutDraftScript()}`;
}

function renderContactFields(): string {
  return `<fieldset class="checkout-card"><legend><span>1.</span> Datos de contacto</legend><div class="checkout-fields">
    <div class="checkout-field"><label for="cust-name">Nombre completo *</label><input id="cust-name" type="text" autocomplete="name" required placeholder="Como aparece en tu documento"></div>
    <div class="checkout-field"><label for="cust-phone">Teléfono o WhatsApp *</label><input id="cust-phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="300 123 4567"><small>Lo usamos para coordinar la entrega.</small></div>
    <div class="checkout-field"><label for="cust-email">Correo electrónico *</label><input id="cust-email" type="email" autocomplete="email" required placeholder="nombre@correo.com"><small>Aquí recibirás la confirmación del pedido.</small></div>
    <div class="checkout-field"><label for="cust-tax-id">Cédula o NIT *</label><input id="cust-tax-id" type="text" inputmode="numeric" autocomplete="off" required placeholder="Solo números, sin puntos"></div>
  </div></fieldset>`;
}

function renderAddressFields(zoneOptions: string): string {
  return `<fieldset class="checkout-card"><legend><span>2.</span> Dirección de entrega</legend><div class="checkout-fields">
    <div class="checkout-field checkout-field-full"><label for="dest-zone">Zona de envío *</label><select id="dest-zone" required><option value="">Selecciona tu zona o municipio</option>${zoneOptions}</select></div>
    <div class="checkout-field"><label for="addr-dept">Departamento *</label><input id="addr-dept" type="text" autocomplete="address-level1" readonly required></div>
    <div class="checkout-field"><label for="addr-city">Ciudad o municipio *</label><input id="addr-city" type="text" autocomplete="off" required placeholder="Escribe tu municipio, por ejemplo Medellín"><div id="addr-city-suggestions" class="checkout-location-suggestions" role="listbox" aria-label="Municipios disponibles" hidden></div><input id="addr-dane-code" type="hidden"><input id="addr-municipality" type="hidden"><small id="addr-city-help" role="status" aria-live="polite">Selecciona primero tu zona y luego el municipio sugerido para verificar la cobertura.</small></div>
    <div class="checkout-field checkout-field-full"><label for="addr-line">Dirección *</label><input id="addr-line" type="text" autocomplete="street-address" required placeholder="Calle, carrera, edificio, apartamento"></div>
  </div><div id="policy-alert" class="checkout-policy" role="status" aria-live="polite" data-state="idle"><span aria-hidden="true">ⓘ</span><span>Selecciona tu zona para consultar cobertura, costo y tiempo estimado de entrega.</span></div></fieldset>`;
}

function renderPaymentFields(): string {
  return `<fieldset class="checkout-card"><legend><span>3.</span> Método de pago</legend><div class="checkout-payment-options">
    <label class="checkout-payment-option" for="radio-wompi"><input id="radio-wompi" type="radio" name="payment-method" value="wompi" checked><span><strong>Pago en línea</strong><small>Tarjeta débito o crédito, PSE, Nequi y Bancolombia.</small><em>Pago seguro a través de Wompi.</em></span></label>
    <label class="checkout-payment-option" id="cod-label" for="radio-cod"><input id="radio-cod" type="radio" name="payment-method" value="cash_on_delivery" disabled><span><strong>Pago contra entrega</strong><small>Paga en efectivo cuando recibas tu pedido.</small></span></label>
  </div></fieldset>`;
}

function renderCheckoutItem(item: CartDto['items'][number], product?: CatalogProductDto): string {
  const image = product?.mediaIds[0] ? `<img src="/media/${escapeHtml(product.mediaIds[0])}" alt="" loading="lazy">` : '<span aria-hidden="true">▧</span>';
  return `<li class="checkout-item"><span class="checkout-item-image">${image}</span><span class="checkout-item-name">${escapeHtml(product?.name ?? 'Producto')}<small>Cantidad: ${item.quantity}</small></span><span class="checkout-item-price">${formatPrice(item.subtotalCents)}</span></li>`;
}

function renderCheckoutSummary(rows: string, subtotal: number, tax: number, taxRate: number): string {
  return `<aside class="checkout-summary" aria-labelledby="checkout-summary-title"><h2 id="checkout-summary-title">Resumen del pedido</h2><ul class="checkout-items">${rows}</ul><dl class="checkout-totals">
    <div class="checkout-total-row"><dt>Productos</dt><dd id="txt-subtotal">${formatPrice(subtotal)}</dd></div><div class="checkout-total-row"><dt>IVA (${taxRate}%)</dt><dd id="txt-tax">${formatPrice(tax)}</dd></div><div class="checkout-total-row"><dt>Envío</dt><dd id="txt-shipping">${formatPrice(0)}</dd></div><div class="checkout-total-row checkout-total-final"><dt>Total</dt><dd id="txt-total">${formatPrice(subtotal + tax)}</dd></div>
  </dl><p class="checkout-tax-note">Impuestos estimados según la configuración vigente.</p></aside>`;
}
