export function calculateOrderTaxCents(order: {
  subtotalCents: number;
  discountCents: number;
  shippingCostCents: number;
  totalCents: number;
}): number {
  const taxCents = order.totalCents - order.subtotalCents - order.shippingCostCents + order.discountCents;
  if (!Number.isSafeInteger(taxCents) || taxCents < 0) throw new Error('El total del pedido no permite cuadrar el impuesto');
  return taxCents;
}
