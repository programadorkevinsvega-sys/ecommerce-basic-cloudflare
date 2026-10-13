export function getCheckoutScript(
  cartItemsJson: string,
  subtotalCents: number,
  taxRatePercent: number
): string {
  const safeCartItemsJson = cartItemsJson.replace(/[<>&\u2028\u2029]/g, (character) => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' })[character] || character);
  const safeSubtotalCents = Number.isSafeInteger(subtotalCents) ? subtotalCents : 0;
  const safeTaxRatePercent = Number.isFinite(taxRatePercent) ? taxRatePercent : 0;
  return `
    <script>
      const cartItems = ${safeCartItemsJson};
      const subtotalCents = ${safeSubtotalCents};
      const TAX_RATE = ${safeTaxRatePercent} / 100;
      let shippingCostCents = 0;
      let zonePolicyAllowsOrder = false;
      const checkoutStatus = document.getElementById('policy-alert');
      const checkoutError = document.getElementById('checkout-error');
      function updateSubmitAvailability() {
        const hasVerifiedLocation = Boolean(document.getElementById('addr-dane-code').value);
        document.getElementById('btn-submit-order').disabled = !zonePolicyAllowsOrder || !hasVerifiedLocation;
      }
      function calcTax(sub) { return Math.round(sub * TAX_RATE); }
      function updateCheckoutCta() {
        const total = subtotalCents + calcTax(subtotalCents) + shippingCostCents;
        const format = value => '$' + (value / 100).toLocaleString('es-CO');
        const online = document.querySelector('input[name="payment-method"]:checked')?.value === 'wompi';
        document.getElementById('checkout-cta-label').textContent = online ? 'Pagar ' + format(total) : 'Confirmar pedido';
        document.getElementById('checkout-submit-note').textContent = online
          ? 'Te llevaremos a Wompi para completar el pago.'
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
        const codRadio = document.getElementById('radio-cod');
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
                codRadio.disabled = false;
              }
              updateCheckoutCta();
            }
          }
        } catch (error) {
          btn.disabled = true;
          codRadio.disabled = true;
          setCheckoutStatus(error.message || 'No fue posible validar la cobertura. Intenta de nuevo.', 'error');
        }
      }
      function updateTotals() {
        const taxCents = calcTax(subtotalCents);
        const total = subtotalCents + taxCents + shippingCostCents;
        const fmt = v => '$' + (v / 100).toLocaleString('es-CO');
        document.getElementById('txt-subtotal').innerText = fmt(subtotalCents);
        document.getElementById('txt-tax').innerText      = fmt(taxCents);
        document.getElementById('txt-shipping').innerText = fmt(shippingCostCents);
        document.getElementById('txt-total').innerText    = fmt(total);
        updateCheckoutCta();
      }
      async function submitOrder() {
        const btn = document.getElementById('btn-submit-order');
        const zoneSel = document.getElementById('dest-zone');
        checkoutError.hidden = true;
        if (!document.getElementById('checkout-form').checkValidity()) {
          document.getElementById('checkout-form').reportValidity();
          return;
        }
        const name  = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const taxId = document.getElementById('cust-tax-id')?.value.trim() || '';
        const dept  = document.getElementById('addr-dept').value.trim();
        const city  = document.getElementById('addr-city').value.trim();
        const daneCode = document.getElementById('addr-dane-code').value, municipality = document.getElementById('addr-municipality').value;
        const line  = document.getElementById('addr-line').value.trim();
        if (!name || !phone || !email || !taxId || !dept || !city || !daneCode || !municipality || !line) {
          checkoutError.hidden = false;
          checkoutError.textContent = 'Selecciona un municipio de las sugerencias para validar el código DANE y la cobertura.';
          return;
        }
        const method     = document.querySelector('input[name="payment-method"]:checked').value;
        const taxCents   = calcTax(subtotalCents);
        const totalCents = subtotalCents + taxCents + shippingCostCents;
        btn.disabled = true;
        document.getElementById('checkout-cta-label').textContent = 'Procesando pedido…';
        try {
          const res = await fetch('/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: name,
              customerEmail: email,
              customerPhone: phone,
              customerTaxId: taxId,
              shippingZoneId: zoneSel.value,
              shippingCostCents: shippingCostCents,
              subtotalCents: subtotalCents,
              taxCents: taxCents,
              discountCents: 0,
              totalCents: totalCents,
              paymentMethod: method,
              shippingAddress: {
                recipientName: name,
                phone: phone,
                department: dept,
                city: municipality,
                daneCode: daneCode,
                addressLine: line,
              },
              lines: cartItems.map(i => ({
                productId:     i.productId,
                productName:   i.productName || 'Producto',
                productSku:    i.productSku  || i.productId.slice(0,8),
                quantity:      i.quantity,
                unitPriceCents: i.unitPriceCents
              }))
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al crear pedido');
          const orderId = (window.clearCheckoutDraft?.(), data.order.id);
          await fetch('/api/v1/cart/clear', { method: 'POST' });
          if (method === 'wompi') {
            document.getElementById('checkout-cta-label').textContent = 'Redirigiendo a Wompi…';
            const payRes = await fetch('/api/v1/payments/wompi/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId })
            });
            const payData = await payRes.json();
            // Redirigir al widget real de Wompi
            const wompiUrl = payData.checkout?.wompiCheckoutUrl;
            if (wompiUrl) {
              window.location.href = wompiUrl;
            } else {
              // Fallback si no hay URL de Wompi configurada
              window.location.href = '/checkout/resultado?orderId=' + orderId + '&status=wompi_pending&ref=' + (payData.checkout?.reference || '');
            }
          } else {
            window.location.href = '/checkout/resultado?orderId=' + orderId + '&status=cod_placed';
          }
        } catch (e) {
          checkoutError.hidden = false;
          checkoutError.textContent = e.message || 'No se pudo procesar el pedido. Intenta de nuevo.';
          updateSubmitAvailability();
          updateCheckoutCta();
        }
      }
      document.getElementById('dest-zone').addEventListener('change', handleZoneChange);
      document.addEventListener('checkout-location-change', updateSubmitAvailability);
      document.querySelectorAll('input[name="payment-method"]').forEach(input => input.addEventListener('change', updateCheckoutCta));
      // Inicializar totales al cargar
      updateTotals();
    </script>
  `;
}
