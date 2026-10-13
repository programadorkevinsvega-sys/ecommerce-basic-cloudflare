import { describe, expect, it } from 'vitest';
import { calculateOrderPricing } from '../src/bff/controllers/orders/calculateOrderPricing.js';

const product = { id: 'p1', name: 'Producto vigente', sku: 'SKU1', priceInCents: 12000, stockQuantity: 4, status: 'published', salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [] } };
function gateways(overrides: Record<string, unknown> = {}) {
  return {
    catalog: { listProducts: async () => [product] },
    promotions: {
      evaluateProductDiscount: async () => ({ hasDiscount: false, finalPriceCents: 0 }),
      validateCoupon: async () => ({ valid: true, discountAppliedCents: 0 }),
    },
    settings: { getSettings: async () => ({ taxRatePercent: 19 }) },
    ...overrides,
  };
}

describe('calculateOrderPricing', () => {
  it('recalcula el pedido desde el catálogo y omite importes enviados por el cliente', async () => {
    const g = gateways();
    const result = await calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never,
      [{ productId: 'p1', quantity: 2, unitPriceCents: 1, totalCents: 2 }], 0 as never, null, 500);
    expect(result.lines[0]?.unitPriceCents).toBe(12000);
    expect(result.subtotalCents).toBe(24000);
    expect(result.totalCents).toBe(29060);
  });

  it('rechaza productos no publicados, cantidades inválidas y stock insuficiente', async () => {
    const g = gateways({ catalog: { listProducts: async () => [{ ...product, status: 'draft' }] } });
    await expect(calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never, [{ productId: 'p1', quantity: 1 }], null, null, 0)).rejects.toThrow('Producto o cantidad inválida');
    const published = gateways();
    await expect(calculateOrderPricing(published.catalog as never, published.promotions as never, published.settings as never, [{ productId: 'p1', quantity: 0 }], null, null, 0)).rejects.toThrow('Producto o cantidad inválida');
    await expect(calculateOrderPricing(published.catalog as never, published.promotions as never, published.settings as never, [{ productId: 'p1', quantity: 5 }], null, null, 0)).rejects.toThrow('Inventario insuficiente');
  });
});
