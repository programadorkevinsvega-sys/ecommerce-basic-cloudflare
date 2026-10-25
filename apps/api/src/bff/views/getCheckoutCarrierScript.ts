export function getCheckoutCarrierScript(): string {
  return String.raw`      function escapeCarrierText(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
      async function loadCarrierQuotes() {
        const box = document.getElementById('carrier-quote-options');
        const daneCode = document.getElementById('addr-dane-code').value;
        const zoneId = document.getElementById('dest-zone').value;
        if (!usesCarrier() || !zonePolicyAllowsOrder || !daneCode || !zoneId) return;
        const requestId = ++carrierQuoteRequest;
        selectedCarrierQuoteId = null; updateSubmitAvailability();
        box.hidden = false; box.textContent = 'Consultando tarifas de transportadora…';
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'wompi';
        if (qualifiesForFreeShipping()) shippingChargeMode = 'included';
        try {
          const response = await fetch('/api/v1/shipping/carrier-quotes', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationZoneId: zoneId, destinationDaneCode: daneCode, paymentMethod, shippingChargeMode,
              lines: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })) }),
          });
          const result = await response.json();
          if (requestId !== carrierQuoteRequest) return;
          if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cotizar el envío.');
          freeShippingRule = result.freeShippingRule || null;
          const fmt = cents => '$' + (cents / 100).toLocaleString('es-CO');
          const shippingNowHelp = paymentMethod === 'wompi'
            ? 'Lo pagas ahora junto con tu compra.'
            : 'Se suma al total que pagarás al recibir el pedido.';
          const shippingDeliveryHelp = paymentMethod === 'wompi'
            ? 'La transportadora cobra solo el flete al entregar. No se suma al pago en línea.'
            : 'La transportadora cobra el flete al entregar, además del valor de los productos.';
          const chargeModes = qualifiesForFreeShipping() ? '<p class="checkout-shipping-promo">Envío gratis aplicado: ' + escapeCarrierText(freeShippingRule.name) + '.</p>' : '<strong>¿Cómo quieres pagar el envío?</strong>' +
            '<label class="checkout-carrier-option"><input type="radio" name="shipping-charge-mode" value="included" ' + (shippingChargeMode === 'included' ? 'checked' : '') + '><span><strong>Sumarlo al pedido</strong><small>' + shippingNowHelp + '</small></span></label>' +
            '<label class="checkout-carrier-option"><input type="radio" name="shipping-charge-mode" value="collect_at_delivery" ' + (shippingChargeMode === 'collect_at_delivery' ? 'checked' : '') + '><span><strong>Pagarlo al recibir</strong><small>' + shippingDeliveryHelp + '</small></span></label>';
          if (!result.quotes.length) {
            box.innerHTML = chargeModes + '<p role="status">MiPaquete no devolvió transportadoras para este destino. El pedido seguirá bloqueado hasta obtener una tarifa.</p>';
            box.querySelectorAll('input[name="shipping-charge-mode"]').forEach(input => input.addEventListener('change', () => { shippingChargeMode = input.value; loadCarrierQuotes(); }));
            selectedCarrierQuoteId = null; carrierFreightCents = 0; updateTotals(); updateSubmitAvailability();
            return;
          }
          const firstQuote = result.quotes[0];
          const packageNote = firstQuote
            ? '<small class="checkout-carrier-package-note">Tarifa calculada con ' +
              (firstQuote.packageProfileId ? 'el empaque configurado' : 'el empaque individual del producto') + ': ' +
              Number(firstQuote.packageWidthCm) + ' × ' + Number(firstQuote.packageLengthCm) + ' × ' +
              Number(firstQuote.packageHeightCm) + ' cm · peso cotizado: ' +
              Number(firstQuote.packageWeightKg).toLocaleString('es-CO') + ' kg.</small>'
            : '';
          box.innerHTML = chargeModes + '<strong>Selecciona una transportadora *</strong>' + result.quotes.map((quote, index) =>
              '<label class="checkout-carrier-option"><input type="radio" name="carrier-quote" value="' + escapeCarrierText(quote.id) + '" data-rate="' + Number(quote.shippingCostCents) + '" ' + (index === 0 ? 'checked' : '') + '><span><strong>' + escapeCarrierText(quote.deliveryCompanyName) + '</strong><small>' + (qualifiesForFreeShipping() ? 'Envío gratis · cubierto por la tienda' : fmt(Number(quote.shippingCostCents))) + ' · aprox. ' + Math.ceil(Number(quote.deliveryMinutes) / 60) + ' horas</small></span></label>'
            ).join('') + packageNote;
          box.querySelectorAll('input[name="shipping-charge-mode"]').forEach(input => input.addEventListener('change', () => { shippingChargeMode = input.value; loadCarrierQuotes(); }));
          box.querySelectorAll('input[name="carrier-quote"]').forEach(input => input.addEventListener('change', () => {
            selectedCarrierQuoteId = input.value; carrierFreightCents = Number(input.dataset.rate);
            shippingCostCents = shippingChargeMode === 'included' && !qualifiesForFreeShipping() ? carrierFreightCents : 0;
            updateTotals(); updateSubmitAvailability();
          }));
          const selected = box.querySelector('input[name="carrier-quote"]:checked');
          selectedCarrierQuoteId = selected?.value || null;
          if (selected) carrierFreightCents = Number(selected.dataset.rate);
          shippingCostCents = shippingChargeMode === 'included' && !qualifiesForFreeShipping() ? carrierFreightCents : 0;
          updateTotals(); updateSubmitAvailability();
        } catch (error) {
          if (requestId !== carrierQuoteRequest) return;
          box.textContent = error.message || 'No fue posible obtener tarifas. Intenta nuevamente.';
          setCheckoutStatus('No se pudo cotizar con la transportadora. El pedido no se puede continuar.', 'error');
          updateSubmitAvailability();
        }
      }`;
}
