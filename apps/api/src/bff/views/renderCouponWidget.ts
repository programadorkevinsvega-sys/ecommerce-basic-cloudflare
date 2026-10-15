export function renderCouponWidget(): string {
  return `<section class="coupon-widget" aria-label="Cupón de descuento"><label for="coupon-code">¿Tienes un cupón de descuento?</label><form id="coupon-form"><input id="coupon-code" type="text" maxlength="80" autocomplete="off" placeholder="Ingresa tu código" aria-describedby="coupon-message"><button type="submit" id="coupon-apply">Aplicar</button></form><p id="coupon-message" role="status" aria-live="polite"></p></section>`;
}

export function getCouponApplicationScript(items: Array<{ productId: string; categoryIds?: string[]; priceCents: number }>, subtotalCents: number): string {
  const safeItems = JSON.stringify(items).replace(/[<>&\u2028\u2029]/g, (character) => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' })[character] || character);
  const subtotal = Number.isSafeInteger(subtotalCents) ? subtotalCents : 0;
  return `
    const couponValidationItems = ${safeItems};
    const couponValidationSubtotal = ${subtotal};
    const couponStorageKey = 'vega.applied-coupon.v1';
    function readCouponCode() { try { return sessionStorage.getItem(couponStorageKey) || ''; } catch { return ''; } }
    window.getCurrentCouponCode = readCouponCode;
    window.clearCurrentCouponCode = () => { try { sessionStorage.removeItem(couponStorageKey); } catch { /* Storage puede estar deshabilitado. */ } };
    async function validateCouponCode(code) {
      const input = document.getElementById('coupon-code');
      const message = document.getElementById('coupon-message');
      const button = document.getElementById('coupon-apply');
      const cleanCode = String(code || '').trim().toUpperCase();
      if (!cleanCode) {
        try { sessionStorage.removeItem(couponStorageKey); } catch { /* Storage puede estar deshabilitado. */ }
        message.dataset.state = 'idle'; message.textContent = 'Cupón retirado.';
        document.dispatchEvent(new CustomEvent('coupon-validated', { detail: { code: '', discountCents: 0 } })); return;
      }
      button.disabled = true; message.dataset.state = 'loading'; message.textContent = 'Validando cupón…';
      try {
        const response = await fetch('/api/v1/promotions/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: cleanCode, orderSubtotalCents: couponValidationSubtotal, items: couponValidationItems }) });
        const result = await response.json();
        const coupon = result.data;
        if (!response.ok || !coupon?.valid) throw new Error(coupon?.reason || result.error || 'El cupón no es válido para esta compra.');
        try { sessionStorage.setItem(couponStorageKey, coupon.code); } catch { /* El pedido conserva la validación autoritativa del servidor. */ }
        input.value = coupon.code;
        message.dataset.state = 'success'; message.textContent = 'Cupón aplicado: ahorras ' + new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(coupon.discountAppliedCents / 100) + '.';
        document.dispatchEvent(new CustomEvent('coupon-validated', { detail: { code: coupon.code, discountCents: coupon.discountAppliedCents } }));
      } catch (error) {
        try { sessionStorage.removeItem(couponStorageKey); } catch { /* Storage puede estar deshabilitado. */ }
        message.dataset.state = 'error'; message.textContent = error.message || 'No se pudo validar el cupón.';
        document.dispatchEvent(new CustomEvent('coupon-validated', { detail: { code: '', discountCents: 0 } }));
      } finally { button.disabled = false; }
    }
    document.getElementById('coupon-form')?.addEventListener('submit', event => { event.preventDefault(); validateCouponCode(document.getElementById('coupon-code').value); });
    document.getElementById('coupon-code')?.addEventListener('input', event => {
      if (event.target.value.trim().toUpperCase() !== readCouponCode()) {
        window.clearCurrentCouponCode();
        document.dispatchEvent(new CustomEvent('coupon-validated', { detail: { code: '', discountCents: 0 } }));
      }
    });
    const savedCoupon = readCouponCode();
    if (savedCoupon) { document.getElementById('coupon-code').value = savedCoupon; validateCouponCode(savedCoupon); }
  `;
}
