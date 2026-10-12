export function getCheckoutScript(cartItemsJson: string, subtotalCents: number): string {
  return `
    <script>
      const cartItems = ${cartItemsJson};
      const subtotalCents = ${subtotalCents};
      let shippingCostCents = 0;

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
              alertBox.innerHTML = '<strong>Aviso de Cobertura:</strong> ' + p.blockingReasons.join('<br>');
              btn.disabled = true;
            } else {
              btn.disabled = false;
              if (!p.allowsCashOnDelivery) {
                alertBox.style.display = 'block';
                alertBox.style.background = '#fef3c7';
                alertBox.style.color = '#92400e';
                alertBox.innerHTML = '<strong>Contra Entrega Restringido:</strong> ' + p.codBlockingReasons.join('<br>');
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
        } catch (e) {
          console.error(e);
        }
      }

      function updateTotals() {
        const total = subtotalCents + shippingCostCents;
        document.getElementById('txt-shipping').innerText = '$' + (shippingCostCents / 100).toLocaleString('es-CO');
        document.getElementById('txt-total').innerText = '$' + (total / 100).toLocaleString('es-CO');
      }

      async function submitOrder() {
        const btn = document.getElementById('btn-submit-order');
        const zoneSel = document.getElementById('dest-zone');
        if (!zoneSel.value) {
          alert('Por favor selecciona una zona de cobertura');
          return;
        }

        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const dept = document.getElementById('addr-dept').value.trim();
        const city = document.getElementById('addr-city').value.trim();
        const line = document.getElementById('addr-line').value.trim();

        if (!name || !phone || !email || !dept || !city || !line) {
          alert('Por favor completa todos los campos requeridos');
          return;
        }

        const method = document.querySelector('input[name="payment-method"]:checked').value;
        const totalCents = subtotalCents + shippingCostCents;

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
              shippingZoneId: zoneSel.value,
              shippingCostCents: shippingCostCents,
              subtotalCents: subtotalCents,
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
                productId: i.productId,
                productName: 'Producto',
                productSku: 'SKU',
                quantity: i.quantity,
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
            window.location.href = '/checkout/resultado?orderId=' + orderId + '&status=wompi_pending&ref=' + payData.checkout.reference;
          } else {
            window.location.href = '/checkout/resultado?orderId=' + orderId + '&status=cod_placed';
          }
        } catch (e) {
          alert(e.message);
          btn.disabled = false;
          btn.innerText = 'Confirmar y Proceder al Pago →';
        }
      }
    </script>
  `;
}
