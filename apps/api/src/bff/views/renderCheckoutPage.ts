import { CartDto } from '../gateways/cart/CartGateway.js';
import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ShippingZoneDto } from '../gateways/shipping/ShippingGateway.js';
import { getCheckoutScript } from './getCheckoutScript.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCheckoutPage(
  cart: CartDto,
  productsMap: Map<string, CatalogProductDto>,
  zones: ShippingZoneDto[],
  taxRatePercent = 19
): string {
  const items = cart.items;
  const subtotalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
  const taxCents = Math.round(subtotalCents * taxRatePercent / 100);

  // Incluir nombre y SKU del producto en el JSON del carrito para el script
  const itemsJson = JSON.stringify(
    items.map((i) => {
      const p = productsMap.get(i.productId);
      return {
        productId: i.productId,
        productName: p?.name ?? 'Producto',
        productSku: p?.sku ?? i.productId.slice(0, 8),
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      };
    })
  );

  return `
    <section style="max-width: 1000px; margin: 2rem auto; padding: 0 1rem;">
      <h1 style="font-size: 2rem; margin-bottom: 1.5rem;">Finalizar Compra (Checkout)</h1>

      <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2rem;" class="checkout-grid">
        <div>
          <form id="checkout-form" style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem;">
            <h2 style="font-size: 1.25rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">1. Datos del Cliente</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Nombre Completo *</label>
                <input type="text" id="cust-name" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Teléfono / WhatsApp *</label>
                <input type="tel" id="cust-phone" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Correo Electrónico *</label>
                <input type="email" id="cust-email" required placeholder="ejemplo@correo.com" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Cédula / NIT (Facturación) *</label>
                <input type="text" id="cust-tax-id" required placeholder="C.C. o NIT sin puntos" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
              </div>
            </div>

            <h2 style="font-size: 1.25rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">2. Destino y Dirección de Envío</h2>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Zona de Cobertura *</label>
              <select id="dest-zone" required onchange="handleZoneChange()" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;">
                <option value="">-- Selecciona tu Zona / Municipio --</option>
                ${zones.map((z) => `<option value="${z.id}" data-rate="${z.priceInCents}" data-cod="${z.allowsCashOnDelivery}">${escapeHtml(z.name)} (${z.type === 'national' ? 'Nacional' : 'Local / ' + z.type})</option>`).join('')}
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Departamento *</label>
                <input type="text" id="addr-dept" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Ciudad / Municipio *</label>
                <input type="text" id="addr-city" required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
              </div>
            </div>
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem;">Dirección Detallada *</label>
              <input type="text" id="addr-line" placeholder="Calle, Carrera, Edificio, Apto..." required style="width: 100%; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px;" />
            </div>

            <h2 style="font-size: 1.25rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">3. Método de Pago</h2>
            <div id="policy-alert" style="margin-bottom: 1rem; padding: 0.75rem; border-radius: 6px; display: none;"></div>

            <div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                <input type="radio" name="payment-method" value="wompi" checked />
                <div>
                  <strong>💳 Tarjeta Débito / Crédito, PSE, Nequi, Bancolombia (Wompi)</strong>
                  <div style="font-size: 0.8rem; color: var(--muted);">Pago 100% seguro en línea sin costo adicional.</div>
                </div>
              </label>

              <label id="cod-label" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                <input type="radio" name="payment-method" value="cash_on_delivery" id="radio-cod" />
                <div>
                  <strong>💵 Pago Contra Entrega (Efectivo al recibir)</strong>
                  <div style="font-size: 0.8rem; color: var(--muted);">Paga en efectivo cuando el transportista entregue en tu puerta.</div>
                </div>
              </label>
            </div>

            <button type="button" id="btn-submit-order" onclick="submitOrder()" style="width: 100%; padding: 1rem; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 700; cursor: pointer;">
              Confirmar y Proceder al Pago &rarr;
            </button>
          </form>
        </div>

        <div>
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; position: sticky; top: 1rem;">
            <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Resumen de la Orden</h2>
            <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; max-height: 200px; overflow-y: auto;">
              ${items.map((i) => {
                const p = productsMap.get(i.productId);
                return `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                    <span>${escapeHtml(p?.name || 'Item')} x ${i.quantity}</span>
                    <span>$${((i.subtotalCents) / 100).toLocaleString('es-CO')}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.95rem;">
              <span>Subtotal:</span>
              <span id="txt-subtotal">$${(subtotalCents / 100).toLocaleString('es-CO')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.95rem; color: var(--muted);">
              <span>IVA (${taxRatePercent}%):</span>
              <span id="txt-tax">$${(taxCents / 100).toLocaleString('es-CO')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.95rem;">
              <span>Envío:</span>
              <span id="txt-shipping">$0</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; border-top: 2px solid var(--border); padding-top: 1rem; font-size: 1.25rem; font-weight: 700;">
              <span>Total:</span>
              <span id="txt-total" style="color: var(--accent);">$${((subtotalCents + taxCents) / 100).toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    ${getCheckoutScript(itemsJson, subtotalCents, taxRatePercent)}
  `;
}
