import { getCheckoutSubmitOrderScript } from './getCheckoutSubmitOrderScript.js';
import { getCheckoutCarrierScript } from './getCheckoutCarrierScript.js';

export function getCheckoutScript(
  cartItemsJson: string,
  subtotalCents: number,
  taxRatePercent: number,
  pricingVersion = 1
): string {
  const safeCartItemsJson = cartItemsJson.replace(/[<>&\u2028\u2029]/g, (character) => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' })[character] || character);
  const safeSubtotalCents = Number.isSafeInteger(subtotalCents) ? subtotalCents : 0;
  const safeTaxRatePercent = Number.isFinite(taxRatePercent) ? taxRatePercent : 0;
  return `
    <script>
      const cartItems = ${safeCartItemsJson};
      const subtotalCents = ${safeSubtotalCents};
      const TAX_RATE = ${safeTaxRatePercent} / 100;
      const TAX_INCLUDED = ${pricingVersion === 2};
      let shippingCostCents = 0;
      let carrierFreightCents = 0;
      let shippingChargeMode = 'included';
      let zonePolicyAllowsOrder = false;
      let carrierIntegrationEnabled = false;
      let freeShippingRule = null;
      const qualifiesForFreeShipping = () => Boolean(freeShippingRule);
      let selectedCarrierQuoteId = null;
      let carrierQuoteRequest = 0;
      const selectedZone = () => document.getElementById('dest-zone').selectedOptions[0];
      const usesCarrier = () => carrierIntegrationEnabled && selectedZone()?.dataset.type === 'national';
      const checkoutStatus = document.getElementById('policy-alert');
      const checkoutError = document.getElementById('checkout-error');
      function updateSubmitAvailability() {
        const hasVerifiedLocation = Boolean(document.getElementById('addr-dane-code').value);
        document.getElementById('btn-submit-order').disabled = !zonePolicyAllowsOrder || !hasVerifiedLocation || (usesCarrier() && !selectedCarrierQuoteId);
      }
      function calcTax(sub) { return Math.round(sub * TAX_RATE); }
      function updateCheckoutCta() {
        const online = document.querySelector('input[name="payment-method"]:checked')?.value === 'wompi';
        const transactionFeeCents = online ? 70000 : 0;
        const total = subtotalCents + (TAX_INCLUDED ? 0 : calcTax(subtotalCents)) + shippingCostCents + transactionFeeCents;
        const format = value => '$' + (value / 100).toLocaleString('es-CO');
        document.getElementById('checkout-cta-label').textContent = online ? 'Pagar ' + format(total) : 'Confirmar pedido';
        document.getElementById('checkout-submit-note').textContent = online
          ? 'Incluye $700 por costo de transacción. Te llevaremos a Wompi para pagar.'
          : 'Pagarás en efectivo cuando recibas tu pedido.';
      }
      function setCheckoutStatus(message, state) {
        checkoutStatus.dataset.state = state;
        checkoutStatus.querySelector('span:last-child').textContent = message;
      }
      async function handleZoneChange() {
        const sel = document.getElementById('dest-zone');
        const opt = sel.options[sel.selectedIndex];
        const zoneId = sel.value;
        const carrierDelivery = opt?.dataset.type === 'national' && carrierIntegrationEnabled;
        selectedCarrierQuoteId = null;
        carrierFreightCents = 0;
        freeShippingRule = null;
        if (shippingChargeMode === 'collect_at_delivery') shippingChargeMode = 'included';
        const quoteBox = document.getElementById('carrier-quote-options');
        quoteBox.hidden = true; quoteBox.innerHTML = '';
        const codRadio = document.getElementById('radio-cod');
        const wompiRadio = document.getElementById('radio-wompi');
        const codHelp = document.getElementById('cod-help');
        const btn = document.getElementById('btn-submit-order');
        if (!zoneId) {
          shippingCostCents = 0;
          zonePolicyAllowsOrder = false;
          btn.disabled = true;
          codRadio.disabled = true;
          setCheckoutStatus('Selecciona tu zona para consultar cobertura, costo y tiempo estimado de entrega.', 'idle');
          updateTotals();
          return;
        }
        shippingCostCents = carrierDelivery ? 0 : parseInt(opt.getAttribute('data-rate'), 10) || 0;
        zonePolicyAllowsOrder = false;
        btn.disabled = true;
        setCheckoutStatus('Validando cobertura y opciones de pago…', 'idle');
        updateTotals();
        try {
          const res = await fetch('/api/v1/orders/checkout/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destinationZoneId: zoneId,
              items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'No fue posible validar la cobertura.');
          if (data.success) {
            freeShippingRule = data.freeShippingRule || null;
            const p = data.policy;
            if (codHelp) {
              codHelp.textContent = p.allowsCashOnDelivery
                ? 'Disponible para este pedido y destino.'
                : 'No disponible: ' + (p.codBlockingReasons || []).join(' ');
            }
            if (!p.canProceed) {
              zonePolicyAllowsOrder = false;
              setCheckoutStatus('No hay cobertura para este pedido: ' + p.blockingReasons.join(' · '), 'error');
              btn.disabled = true;
            } else {
              wompiRadio.disabled = !p.allowedPaymentMethods.includes('wompi');
              codRadio.disabled = !p.allowedPaymentMethods.includes('cash_on_delivery');
              if (!p.allowedPaymentMethods.includes(wompiRadio.checked ? 'wompi' : 'cash_on_delivery')) {
                const fallback = p.allowedPaymentMethods[0];
                if (fallback) document.querySelector('input[value="' + fallback + '"]').checked = true;
              }
              if (p.allowedPaymentMethods.length === 0) throw new Error('Ningún medio de pago está habilitado para todos los productos.');
              zonePolicyAllowsOrder = true;
              updateSubmitAvailability();
              const minDays = Number(opt.dataset.minDays || 0);
              const maxDays = Number(opt.dataset.maxDays || minDays);
              const delivery = minDays ? ' Entrega estimada: ' + minDays + (maxDays !== minDays ? ' a ' + maxDays : '') + ' días hábiles.' : '';
              if (qualifiesForFreeShipping()) {
                shippingChargeMode = 'included'; shippingCostCents = 0;
                setCheckoutStatus('Envío gratis aplicado: ' + freeShippingRule.name + delivery, 'success');
              } else if (carrierDelivery) {
                setCheckoutStatus('Destino nacional. Consultando tarifas de MiPaquete…', 'idle');
              } else if (!p.allowsCashOnDelivery) {
                setCheckoutStatus('Cobertura disponible. El pago contra entrega no aplica a este pedido.' + delivery, 'success');
                codRadio.disabled = true;
                codRadio.checked = false;
                document.querySelector('input[value="wompi"]').checked = true;
              } else {
                setCheckoutStatus('Cobertura disponible.' + delivery, 'success');
                codRadio.disabled = !p.allowedPaymentMethods.includes('cash_on_delivery');
              }
              updateCheckoutCta();
          if (carrierDelivery) await loadCarrierQuotes();
          else {
            shippingChargeMode = 'included';
            selectedCarrierQuoteId = null;
            carrierFreightCents = 0;
            shippingCostCents = qualifiesForFreeShipping() ? 0 : parseInt(opt.dataset.rate, 10) || 0;
            updateTotals(); updateSubmitAvailability();
            if (!qualifiesForFreeShipping()) setCheckoutStatus('Entrega local gestionada por la tienda.' + delivery, 'success');
          }
            }
          }
        } catch (error) {
          btn.disabled = true;
          codRadio.disabled = true;
          setCheckoutStatus(error.message || 'No fue posible validar la cobertura. Intenta de nuevo.', 'error');
        }
      }
      ${getCheckoutCarrierScript()}
      function updateTotals() {
        const taxCents = TAX_INCLUDED ? Math.round(subtotalCents * TAX_RATE / (1 + TAX_RATE)) : calcTax(subtotalCents);
        const online = document.querySelector('input[name="payment-method"]:checked')?.value === 'wompi';
        const transactionFeeCents = online ? 70000 : 0;
        const total = subtotalCents + (TAX_INCLUDED ? 0 : taxCents) + shippingCostCents + transactionFeeCents;
        const fmt = v => '$' + (v / 100).toLocaleString('es-CO');
        document.getElementById('txt-subtotal').innerText = fmt(subtotalCents);
        if (document.getElementById('txt-tax')) document.getElementById('txt-tax').innerText = fmt(taxCents);
        document.getElementById('txt-shipping').innerText = fmt(shippingCostCents);
        const collectRow = document.getElementById('checkout-shipping-collection-row');
        if (collectRow) collectRow.style.display = shippingChargeMode === 'collect_at_delivery' && carrierFreightCents > 0 ? 'flex' : 'none';
        if (document.getElementById('txt-shipping-collection')) document.getElementById('txt-shipping-collection').innerText = fmt(carrierFreightCents);
        const transactionFeeRow = document.getElementById('checkout-transaction-fee-row');
        if (transactionFeeRow) transactionFeeRow.style.display = online ? 'flex' : 'none';
        if (document.getElementById('txt-transaction-fee')) document.getElementById('txt-transaction-fee').innerText = fmt(transactionFeeCents);
        document.getElementById('txt-total').innerText    = fmt(total);
        updateCheckoutCta();
      }
      ${getCheckoutSubmitOrderScript()}
      document.getElementById('dest-zone').addEventListener('change', handleZoneChange); document.addEventListener('checkout-location-change', () => { updateSubmitAvailability(); if (zonePolicyAllowsOrder && usesCarrier()) loadCarrierQuotes(); });
      document.querySelectorAll('input[name="payment-method"]').forEach(input => input.addEventListener('change', () => { updateTotals(); if (zonePolicyAllowsOrder && usesCarrier()) loadCarrierQuotes(); }));
      fetch('/api/v1/shipping/carrier/availability').then(response => response.json()).then(result => {
        carrierIntegrationEnabled = Boolean(result.enabled);
        if (carrierIntegrationEnabled && document.getElementById('dest-zone').value) handleZoneChange();
      }).catch(() => {});
      // Inicializar totales al cargar
      updateTotals();
    </script>
  `;
}
