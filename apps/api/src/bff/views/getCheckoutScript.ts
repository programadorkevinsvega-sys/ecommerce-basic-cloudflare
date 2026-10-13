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

      function calcTax(sub) { return Math.round(sub * TAX_RATE); }

      async function handleZoneChange() {
        const sel = document.getElementById('dest-zone');
        const opt = sel.options[sel.selectedIndex];
        const zoneId = sel.value;
        const alertBox = document.getElementById('policy-alert');
        const codRadio = document.getElementById('radio-cod');
        const codLabel = document.getElementById('cod-label');
        const btn = document.getElementById('btn-submit-order');

        if (!zoneId) {
          shippingCostCents = 0;
          updateTotals();
          return;
        }

        shippingCostCents = parseInt(opt.getAttribute('data-rate'), 10) || 0;
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
          if (data.success) {
            const p = data.policy;
            if (!p.canProceed) {
              alertBox.style.display = 'block';
              alertBox.style.background = '#fee2e2';
              alertBox.style.color = '#991b1b';
              alertBox.textContent = 'Aviso de Cobertura: ' + p.blockingReasons.join(' · ');
              btn.disabled = true;
            } else {
              btn.disabled = false;
              if (!p.allowsCashOnDelivery) {
                alertBox.style.display = 'block';
                alertBox.style.background = '#fef3c7';
                alertBox.style.color = '#92400e';
                alertBox.textContent = 'Contra Entrega Restringido: ' + p.codBlockingReasons.join(' · ');
                codRadio.disabled = true;
                codRadio.checked = false;
                document.querySelector('input[value="wompi"]').checked = true;
                codLabel.style.opacity = '0.5';
              } else {
                alertBox.style.display = 'none';
                codRadio.disabled = false;
                codLabel.style.opacity = '1';
              }
            }
          }
        } catch {
          console.error('No fue posible validar la opción de pago');
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
      }

      async function submitOrder() {
        const btn = document.getElementById('btn-submit-order');
        const zoneSel = document.getElementById('dest-zone');
        if (!zoneSel.value) {
          alert('Por favor selecciona una zona de cobertura');
          return;
        }

        const name  = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const taxId = document.getElementById('cust-tax-id')?.value.trim() || '';
        const dept  = document.getElementById('addr-dept').value.trim();
        const city  = document.getElementById('addr-city').value.trim();
        const line  = document.getElementById('addr-line').value.trim();

        if (!name || !phone || !email || !taxId || !dept || !city || !line) {
          alert('Por favor completa todos los campos requeridos, incluyendo tu identificación fiscal (Cédula o NIT)');
          return;
        }

        const method     = document.querySelector('input[name="payment-method"]:checked').value;
        const taxCents   = calcTax(subtotalCents);
        const totalCents = subtotalCents + taxCents + shippingCostCents;

        btn.disabled = true;
        btn.innerText = 'Procesando pedido...';

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
                city: city,
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

          const orderId = data.order.id;
          await fetch('/api/v1/cart/clear', { method: 'POST' });

          if (method === 'wompi') {
            btn.innerText = 'Redirigiendo a Wompi...';
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
          alert(e.message);
          btn.disabled = false;
          btn.innerText = 'Confirmar y Proceder al Pago \u2192';
        }
      }

      // Inicializar totales al cargar
      updateTotals();
    </script>
  `;
}
