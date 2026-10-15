import { FreeShippingPolicyDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderFreeShippingPolicySection(policy: FreeShippingPolicyDto): string {
  return `<section class="shipping-page-panel" data-shipping-panel="free-shipping" hidden aria-labelledby="free-shipping-title">
    <header class="shipping-heading"><div><h1 id="free-shipping-title">Envío gratis</h1><p>La tienda cubre el flete cuando la compra alcanza el mínimo configurado.</p></div></header>
    <form class="card" id="free-shipping-policy-form" style="max-width:720px;padding:24px">
      <label style="display:flex;gap:12px;align-items:center"><input id="free-shipping-enabled" type="checkbox" ${policy.enabled ? 'checked' : ''}> Activar envío gratis</label>
      <label for="free-shipping-threshold" style="display:block;margin-top:20px">Compra mínima (COP)</label>
      <input id="free-shipping-threshold" type="number" min="0" step="1000" required value="${Math.round(policy.thresholdCents / 100)}" style="width:100%;max-width:320px">
      <p>Se aplica al subtotal de productos después de descuentos automáticos y cupón. El cliente no paga el flete y la tarifa real se conserva para la transportadora.</p>
      <button class="btn-primary" type="submit">Guardar regla</button><span id="free-shipping-policy-message" role="status" style="margin-left:12px"></span>
    </form>
  </section>`;
}
