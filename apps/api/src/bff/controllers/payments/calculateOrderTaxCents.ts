export function calculateOrderTaxCents(order: {
  subtotalCents: number;
  discountCents: number;
  shippingCostCents: number;
  taxCents?: number;
  pricingVersion?: number;
  totalCents: number;
}): number {
  const taxCents = order.pricingVersion === 2
    ? order.taxCents || 0
    : order.totalCents - order.subtotalCents - order.shippingCostCents + order.discountCents;
  if (!Number.isSafeInteger(taxCents) || taxCents < 0) throw new Error('El total del pedido no permite cuadrar el impuesto');
  return taxCents;
}
