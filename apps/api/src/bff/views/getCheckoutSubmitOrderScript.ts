export function getCheckoutSubmitOrderScript(): string {
  return `
      async function submitOrder() {
        const btn = document.getElementById('btn-submit-order');
        const zoneSel = document.getElementById('dest-zone');
        checkoutError.hidden = true;
        if (!document.getElementById('checkout-form').checkValidity()) { document.getElementById('checkout-form').reportValidity(); return; }
        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const taxId = document.getElementById('cust-tax-id')?.value.trim() || '';
        const taxIdType = document.getElementById('cust-tax-type')?.value || '';
        const legalOrganizationCode = document.getElementById('cust-organization')?.value || '';
        const dept = document.getElementById('addr-dept').value.trim();
        const city = document.getElementById('addr-city').value.trim();
        const daneCode = document.getElementById('addr-dane-code').value;
        const municipality = document.getElementById('addr-municipality').value;
        const line = document.getElementById('addr-line').value.trim();
        if (!name || !phone || !email || !taxId || !dept || !city || !daneCode || !municipality || !line) {
          checkoutError.hidden = false;
          checkoutError.textContent = 'Selecciona un municipio de las sugerencias para validar el código DANE y la cobertura.';
          return;
        }
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        const carrierDelivery = carrierIntegrationEnabled && zoneSel.selectedOptions[0]?.dataset.type === 'national';
        const taxCents = TAX_INCLUDED ? Math.round(subtotalCents * TAX_RATE / (1 + TAX_RATE)) : calcTax(subtotalCents);
        btn.disabled = true;
        document.getElementById('checkout-cta-label').textContent = 'Procesando pedido…';
        try {
          const res = await fetch('/api/v1/orders', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: name, customerEmail: email, customerPhone: phone, customerTaxId: taxId,
              customerTaxIdType: taxIdType, customerLegalOrganizationCode: legalOrganizationCode,
              shippingZoneId: zoneSel.value, shippingCostCents, subtotalCents, taxCents, discountCents: 0,
              ...(carrierDelivery ? { carrierQuoteId: selectedCarrierQuoteId, shippingChargeMode } : {}),
              couponCode: window.getCurrentCouponCode?.() || null,
              paymentMethod: method,
              shippingAddress: { recipientName: name, phone, department: dept, city: municipality, daneCode: daneCode, addressLine: line },
              lines: cartItems.map(i => ({ productId: i.productId, productName: i.productName || 'Producto', productSku: i.productSku || i.productId.slice(0, 8), quantity: i.quantity, unitPriceCents: i.unitPriceCents }))
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al crear pedido');
          const orderId = (window.clearCheckoutDraft?.(), window.clearCurrentCouponCode?.(), data.order.id);
          await fetch('/api/v1/cart/clear', { method: 'POST' });
          if (method === 'wompi') await redirectToWompi(orderId);
          else window.location.href = '/checkout/resultado?orderId=' + orderId + '&status=cod_placed';
        } catch (error) {
          checkoutError.hidden = false;
          checkoutError.textContent = error.message || 'No se pudo procesar el pedido. Intenta de nuevo.';
          updateSubmitAvailability(); updateCheckoutCta();
        }
      }
      async function redirectToWompi(orderId) {
        document.getElementById('checkout-cta-label').textContent = 'Redirigiendo a Wompi…';
        const response = await fetch('/api/v1/payments/wompi/init', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId })
        });
        const payment = await response.json();
        const url = payment.checkout?.wompiCheckoutUrl;
        window.location.href = url || '/checkout/resultado?orderId=' + orderId + '&status=wompi_pending&ref=' + (payment.checkout?.reference || '');
      }
  `;
}
