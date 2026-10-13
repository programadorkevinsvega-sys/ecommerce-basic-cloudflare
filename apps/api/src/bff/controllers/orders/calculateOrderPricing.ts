import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';

export interface AuthoritativeOrderPricing {
  lines: Array<{ productId: string; productName: string; productSku: string; quantity: number; unitPriceCents: number }>;
  policyItems: Array<{ product: { productId: string; name: string; allowsCashOnDelivery: boolean; shippingScope: 'national' | 'local'; localCoverageZones: string[] }; quantity: number }>;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  couponCode: string | null;
}

export async function calculateOrderPricing(
  catalog: CatalogGateway,
  promotions: PromotionsGateway,
  settings: SettingsGateway,
  inputs: unknown,
  couponInput: unknown,
  customerId: string | null,
  shippingCostCents: number,
): Promise<AuthoritativeOrderPricing> {
  if (!Array.isArray(inputs) || inputs.length === 0 || inputs.length > 50) throw new Error('Líneas de pedido inválidas');
  const products = await catalog.listProducts({ limit: 100 });
  const byId = new Map(products.filter((product) => product.status === 'published').map((product) => [product.id, product]));
  const lines: AuthoritativeOrderPricing['lines'] = [];
  const policyItems: AuthoritativeOrderPricing['policyItems'] = [];
  let subtotalCents = 0;
  for (const input of inputs as Array<{ productId?: unknown; quantity?: unknown }>) {
    const product = byId.get(String(input?.productId ?? ''));
    const quantity = Number(input?.quantity);
    if (!product || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Producto o cantidad inválida');
    if (product.stockQuantity < quantity) throw new Error('Inventario insuficiente');
    const discount = await promotions.evaluateProductDiscount({ productId: product.id, priceInCents: product.priceInCents });
    const unitPriceCents = discount.hasDiscount ? discount.finalPriceCents : product.priceInCents;
    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) throw new Error('Precio no válido');
    subtotalCents += unitPriceCents * quantity;
    lines.push({ productId: product.id, productName: product.name, productSku: product.sku, quantity, unitPriceCents });
    policyItems.push({ product: { productId: product.id, name: product.name, allowsCashOnDelivery: product.salePolicy.allowsCashOnDelivery, shippingScope: product.salePolicy.shippingScope, localCoverageZones: product.salePolicy.localCoverageZones }, quantity });
  }
  const couponCode = typeof couponInput === 'string' ? couponInput.trim() : '';
  let discountCents = 0;
  if (couponCode) {
    const coupon = await promotions.validateCoupon({ code: couponCode, orderSubtotalCents: subtotalCents, customerId: customerId ?? undefined, items: lines.map((line) => ({ productId: line.productId, priceCents: line.unitPriceCents * line.quantity })) });
    if (!coupon.valid || !Number.isSafeInteger(coupon.discountAppliedCents) || coupon.discountAppliedCents < 0) throw new Error('Cupón no válido');
    discountCents = Math.min(subtotalCents, coupon.discountAppliedCents);
  }
  const taxRate = (await settings.getSettings()).taxRatePercent;
  const taxCents = Math.round((subtotalCents - discountCents) * taxRate / 100);
  const totalCents = subtotalCents - discountCents + taxCents + shippingCostCents;
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) throw new Error('Total no válido');
  return { lines, policyItems, subtotalCents, discountCents, taxCents, totalCents, couponCode: couponCode || null };
}
