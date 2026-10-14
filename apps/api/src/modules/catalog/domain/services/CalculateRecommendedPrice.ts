export interface RecommendedPriceInput {
  supplierCostCents: number;
  targetMarginBasisPoints: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  taxRateBasisPoints: number;
  includeWompi: boolean;
  transactionShippingCents: number;
}

export interface RecommendedPrice {
  priceInCents: number;
  estimatedTaxCents: number;
  estimatedPaymentFeeCents: number;
  estimatedNetProfitCents: number;
  estimatedMarginBasisPoints: number;
}

export function calculateRecommendedPrice(input: RecommendedPriceInput): RecommendedPrice {
  const { supplierCostCents: cost, targetMarginBasisPoints: margin, taxRateBasisPoints: tax } = input;
  const targetType = input.pricingTargetType ?? 'margin';
  if (![cost, tax].every(Number.isSafeInteger) || cost < 0 || tax < 0 ||
    targetType === 'margin' && (!Number.isSafeInteger(margin) || margin < 0 || margin >= 10000) ||
    targetType === 'profit' && (!Number.isSafeInteger(input.targetProfitCents) || Number(input.targetProfitCents) < 0)) {
    throw new Error('Parámetros de precio inválidos');
  }
  if (targetType === 'margin') assertMarginIsReachable(input);
  let low = cost;
  let high = Math.max(cost + 100000, Math.ceil(cost * 4 + 100000));
  if (!Number.isSafeInteger(high)) high = Number.MAX_SAFE_INTEGER;
  while (!meetsTarget(high, input)) {
    if (high >= Number.MAX_SAFE_INTEGER / 2) throw new Error('El precio recomendado excede el límite calculable');
    high *= 2;
  }
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (meetsTarget(mid, input)) high = mid;
    else low = mid + 1;
  }
  const price = Math.ceil(low / 100) * 100;
  const taxCents = Math.round(price * tax / (10000 + tax));
  const fee = input.includeWompi ? Math.round((Math.ceil((price + input.transactionShippingCents + 70000) * 409 / 10000) + 70000) * 1.19) : 0;
  const netProfit = price - taxCents - cost - fee + (input.includeWompi ? 70000 : 0);
  const netSales = price - taxCents;
  return {
    priceInCents: price,
    estimatedTaxCents: taxCents,
    estimatedPaymentFeeCents: fee,
    estimatedNetProfitCents: netProfit,
    estimatedMarginBasisPoints: netSales ? Math.floor(netProfit * 10000 / netSales) : 0,
  };
}

function assertMarginIsReachable(input: RecommendedPriceInput): void {
  if (!input.includeWompi) return;
  const maximumMarginBasisPoints = 10000 - (409 * 119 * (10000 + input.taxRateBasisPoints)) / 1000000;
  if (input.targetMarginBasisPoints >= Math.ceil(maximumMarginBasisPoints)) {
    throw new Error(`El margen no es alcanzable con Wompi; debe ser inferior a ${Math.floor(maximumMarginBasisPoints) / 100}%`);
  }
}

function meetsTarget(price: number, input: RecommendedPriceInput): boolean {
  const tax = Math.round(price * input.taxRateBasisPoints / (10000 + input.taxRateBasisPoints));
  const fee = input.includeWompi ? Math.round((Math.ceil((price + input.transactionShippingCents + 70000) * 409 / 10000) + 70000) * 1.19) : 0;
  const netSales = price - tax;
  const netProfit = netSales - input.supplierCostCents - fee + (input.includeWompi ? 70000 : 0);
  return input.pricingTargetType === 'profit'
    ? netProfit >= Number(input.targetProfitCents)
    : netProfit >= netSales * input.targetMarginBasisPoints / 10000;
}
