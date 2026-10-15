import { getCheckoutSubmitOrderScript } from './getCheckoutSubmitOrderScript.js';

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
      let zonePolicyAllowsOrder = false;
      let carrierIntegrationEnabled = false;
      let selectedCarrierQuoteId = null;
      let carrierQuoteRequest = 0;
      const checkoutStatus = document.getElementById('policy-alert');
      const checkoutError = document.getElementById('checkout-error');
      function updateSubmitAvailability() {
        const hasVerifiedLocation = Boolean(document.getElementById('addr-dane-code').value);
        document.getElementById('btn-submit-order').disabled = !zonePolicyAllowsOrder || !hasVerifiedLocation || (carrierIntegrationEnabled && !selectedCarrierQuoteId);
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
        selectedCarrierQuoteId = null;
        const quoteBox = document.getElementById('carrier-quote-options');
        quoteBox.hidden = true; quoteBox.innerHTML = '';
        const codRadio = document.getElementById('radio-cod');
      const wompiRadio = document.getElementById('radio-wompi');
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
        shippingCostCents = parseInt(opt.getAttribute('data-rate'), 10) || 0;
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
            const p = data.policy;
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
              if (!p.allowsCashOnDelivery) {
                setCheckoutStatus('Cobertura disponible. El pago contra entrega no aplica a este pedido.' + delivery, 'success');
                codRadio.disabled = true;
                codRadio.checked = false;
                document.querySelector('input[value="wompi"]').checked = true;
              } else {
                setCheckoutStatus('Cobertura disponible.' + delivery, 'success');
                codRadio.disabled = !p.allowedPaymentMethods.includes('cash_on_delivery');
              }
              updateCheckoutCta();
              if (carrierIntegrationEnabled) await loadCarrierQuotes();
            }
          }
        } catch (error) {
          btn.disabled = true;
          codRadio.disabled = true;
          setCheckoutStatus(error.message || 'No fue posible validar la cobertura. Intenta de nuevo.', 'error');
        }
      }
      function escapeCarrierText(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
      async function loadCarrierQuotes() {
        const box = document.getElementById('carrier-quote-options');
        const daneCode = document.getElementById('addr-dane-code').value;
        const zoneId = document.getElementById('dest-zone').value;
        if (!carrierIntegrationEnabled || !zonePolicyAllowsOrder || !daneCode || !zoneId) return;
        const requestId = ++carrierQuoteRequest;
        selectedCarrierQuoteId = null; updateSubmitAvailability();
        box.hidden = false; box.textContent = 'Consultando tarifas de transportadora…';
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'wompi';
        try {
          const response = await fetch('/api/v1/shipping/carrier-quotes', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationZoneId: zoneId, destinationDaneCode: daneCode, paymentMethod,
              lines: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })) }),
          });
          const result = await response.json();
          if (requestId !== carrierQuoteRequest) return;
          if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cotizar el envío.');
          if (!result.quotes.length) throw new Error('No hay transportadoras disponibles para este destino.');
          const fmt = cents => '$' + (cents / 100).toLocaleString('es-CO');
          box.innerHTML = '<strong>Selecciona una transportadora *</strong>' + result.quotes.map((quote, index) =>
            '<label class="checkout-carrier-option"><input type="radio" name="carrier-quote" value="' + escapeCarrierText(quote.id) + '" data-rate="' + Number(quote.shippingCostCents) + '" ' + (index === 0 ? 'checked' : '') + '><span><strong>' + escapeCarrierText(quote.deliveryCompanyName) + '</strong><small>' + fmt(Number(quote.shippingCostCents)) + ' · aprox. ' + Math.ceil(Number(quote.deliveryMinutes) / 60) + ' horas</small></span></label>'
          ).join('');
          box.querySelectorAll('input[name="carrier-quote"]').forEach(input => input.addEventListener('change', () => {
            selectedCarrierQuoteId = input.value; shippingCostCents = Number(input.dataset.rate); updateTotals(); updateSubmitAvailability();
          }));
          const selected = box.querySelector('input[name="carrier-quote"]:checked');
          selectedCarrierQuoteId = selected?.value || null;
          if (selected) shippingCostCents = Number(selected.dataset.rate);
          updateTotals(); updateSubmitAvailability();
        } catch (error) {
          if (requestId !== carrierQuoteRequest) return;
          box.textContent = error.message || 'No fue posible obtener tarifas. Intenta nuevamente.';
          setCheckoutStatus('No se pudo cotizar con la transportadora. El pedido no se puede continuar.', 'error');
          updateSubmitAvailability();
        }
      }
      function updateTotals() {
        const taxCents = TAX_INCLUDED ? Math.round(subtotalCents * TAX_RATE / (1 + TAX_RATE)) : calcTax(subtotalCents);
        const online = document.querySelector('input[name="payment-method"]:checked')?.value === 'wompi';
        const transactionFeeCents = online ? 70000 : 0;
        const total = subtotalCents + (TAX_INCLUDED ? 0 : taxCents) + shippingCostCents + transactionFeeCents;
        const fmt = v => '$' + (v / 100).toLocaleString('es-CO');
        document.getElementById('txt-subtotal').innerText = fmt(subtotalCents);
        if (document.getElementById('txt-tax')) document.getElementById('txt-tax').innerText = fmt(taxCents);
        document.getElementById('txt-shipping').innerText = fmt(shippingCostCents);
        const transactionFeeRow = document.getElementById('checkout-transaction-fee-row');
        if (transactionFeeRow) transactionFeeRow.style.display = online ? 'flex' : 'none';
        if (document.getElementById('txt-transaction-fee')) document.getElementById('txt-transaction-fee').innerText = fmt(transactionFeeCents);
        document.getElementById('txt-total').innerText    = fmt(total);
        updateCheckoutCta();
      }
      ${getCheckoutSubmitOrderScript()}
      document.getElementById('dest-zone').addEventListener('change', handleZoneChange); document.addEventListener('checkout-location-change', () => { updateSubmitAvailability(); if (zonePolicyAllowsOrder && carrierIntegrationEnabled) loadCarrierQuotes(); });
      document.querySelectorAll('input[name="payment-method"]').forEach(input => input.addEventListener('change', () => { updateTotals(); if (zonePolicyAllowsOrder && carrierIntegrationEnabled) loadCarrierQuotes(); }));
      fetch('/api/v1/shipping/carrier/availability').then(response => response.json()).then(result => {
        carrierIntegrationEnabled = Boolean(result.enabled);
        if (carrierIntegrationEnabled && document.getElementById('dest-zone').value) handleZoneChange();
      }).catch(() => {});
      // Inicializar totales al cargar
      updateTotals();
    </script>
  `;
}
