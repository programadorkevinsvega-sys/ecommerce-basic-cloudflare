export function renderProductPricingScript(): string {
  return `
    function updateRecommendedProductPrice() {
      const costInput = document.getElementById('pCost');
      const breakdown = document.getElementById('pPriceBreakdown');
      const showPricingError = (message) => {
        window.setCopInputValue('pPrice', '');
        breakdown.textContent = message;
      };
      if (!costInput?.value.trim()) return showPricingError('Ingresa el costo del proveedor en pesos colombianos para calcular el precio recomendado.');
      const cost = window.copPesosToCents('pCost');
      const marginBps = Math.round(Number(document.getElementById('pMargin')?.value) * 100);
      const includeWompi = document.getElementById('pPayWompi')?.checked;
      if (!Number.isSafeInteger(cost) || cost < 0) return showPricingError('Ingresa un costo de proveedor válido en pesos completos.');
      if (!Number.isSafeInteger(marginBps) || marginBps <= 0 || marginBps >= 10000) return showPricingError('Ingresa un margen mayor que 0% y menor que 100%.');
      const taxRate = Number(document.getElementById('productTaxRate')?.value || 19);
      const maxMarginBps = includeWompi ? 10000 - (409 * 119 * (10000 + taxRate * 100)) / 1000000 : 10000;
      if (marginBps >= Math.ceil(maxMarginBps)) {
        const threshold = (Math.ceil(maxMarginBps) / 100).toFixed(2).replace('.', ',');
        return showPricingError('Ese margen no se puede alcanzar con Wompi. Con la tarifa actual debe ser menor que ' + threshold + '%. Reduce el margen o deshabilita Wompi para este producto.');
      }
      const shipping = Number(document.getElementById('transactionShippingCents')?.value || 0);
      const fee = (price) => includeWompi ? Math.round((Math.ceil((price + shipping + 70000) * 409 / 10000) + 70000) * 1.19) : 0;
      const meets = (price) => {
        const tax = Math.round(price * taxRate / (100 + taxRate));
        const net = price - tax;
        return net - cost - fee(price) >= net * marginBps / 10000;
      };
      let low = cost, high = Math.max(cost * 4 + 100000, 100000);
      if (!Number.isSafeInteger(high)) high = Number.MAX_SAFE_INTEGER;
      while (!meets(high)) {
        if (high >= Number.MAX_SAFE_INTEGER / 2) return showPricingError('El precio recomendado excede el límite calculable. Revisa el costo y el margen.');
        high *= 2;
      }
      while (low < high) { const mid = Math.floor((low + high) / 2); if (meets(mid)) high = mid; else low = mid + 1; }
      window.setCopInputValue('pPrice', Math.ceil(low / 100));
      const tax = Math.round(low * taxRate / (100 + taxRate));
      const grossFee = fee(low);
      const buyerTransactionFee = includeWompi ? 70000 : 0;
      const netFeeCost = Math.max(0, grossFee - buyerTransactionFee);
      const netProfit = low - tax - cost - netFeeCost;
      const netSales = low - tax;
      const actualMargin = netSales > 0 ? (netProfit / netSales * 100).toFixed(2) : '0,00';
      const pesos = (cents) => '$' + Math.round(cents / 100).toLocaleString('es-CO');
      breakdown.innerHTML = '<dl class="price-breakdown">' +
        '<div><dt>Precio bruto del producto (IVA incluido)</dt><dd>' + pesos(low) + '</dd></div>' +
        '<div><dt>IVA incluido estimado</dt><dd>' + pesos(tax) + '</dd></div>' +
        '<div><dt>Costo del proveedor</dt><dd>' + pesos(cost) + '</dd></div>' +
        (includeWompi ? '<div><dt>Costo Wompi estimado, neto del cargo cobrado al comprador</dt><dd>' + pesos(netFeeCost) + '</dd></div>' : '') +
        '<div class="price-breakdown-total"><dt>Ganancia neta estimada</dt><dd>' + pesos(netProfit) + '</dd></div>' +
        '<div><dt>Margen real sobre venta sin IVA</dt><dd>' + actualMargin.replace('.', ',') + '%</dd></div>' +
        '</dl><p>El precio bruto es el total del producto antes del envío. Los $700 de transacción se suman una sola vez en checkout; el costo Wompi mostrado descuenta ese valor. La comisión varía según pago y envío.</p>';
    }
    ['pCost', 'pMargin', 'pPayWompi'].forEach((id) => document.getElementById(id)?.addEventListener('input', updateRecommendedProductPrice));
    window.updateRecommendedProductPrice = updateRecommendedProductPrice;
  `;
}
