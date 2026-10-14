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
    expect(result.totalCents).toBe(99060);
    expect(result.transactionFeeCents).toBe(70000);
  });

  it('rechaza productos no publicados, cantidades inválidas y stock insuficiente', async () => {
    const g = gateways({ catalog: { listProducts: async () => [{ ...product, status: 'draft' }] } });
    await expect(calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never, [{ productId: 'p1', quantity: 1 }], null, null, 0)).rejects.toThrow('Producto o cantidad inválida');
    const published = gateways();
    await expect(calculateOrderPricing(published.catalog as never, published.promotions as never, published.settings as never, [{ productId: 'p1', quantity: 0 }], null, null, 0)).rejects.toThrow('Producto o cantidad inválida');
    await expect(calculateOrderPricing(published.catalog as never, published.promotions as never, published.settings as never, [{ productId: 'p1', quantity: 5 }], null, null, 0)).rejects.toThrow('Inventario insuficiente');
  });

  it('mantiene IVA dentro del precio nuevo, cuenta envío aparte y aplica tarifa Wompi una vez por pedido', async () => {
    const modern = { ...product, priceInCents: 11900, pricingVersion: 2, allowedPaymentMethods: ['wompi'] };
    const g = gateways({ catalog: { listProducts: async () => [modern] } });
    const result = await calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never,
      [{ productId: 'p1', quantity: 2 }], null, null, 900, 'wompi');
    expect(result.totalCents).toBe(94700);
    expect(result.transactionFeeCents).toBe(70000);
    expect(result.taxCents).toBe(3800);
    expect(result.estimatedPaymentFeeCents).toBeGreaterThan(700);
    expect(result.pricingVersion).toBe(2);
    await expect(calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never,
      [{ productId: 'p1', quantity: 1 }], null, null, 0, 'cash_on_delivery')).rejects.toThrow('no está habilitado');
  });

  it('cobra una sola tarifa fija de $700 por Wompi y ninguna por contra entrega', async () => {
    const g = gateways();
    const online = await calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never,
      [{ productId: 'p1', quantity: 1 }], null, null, 500, 'wompi');
    const cod = await calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never,
      [{ productId: 'p1', quantity: 1 }], null, null, 500, 'cash_on_delivery');
    expect(online.transactionFeeCents).toBe(70000);
    expect(online.totalCents - cod.totalCents).toBe(70000);
    expect(cod.transactionFeeCents).toBe(0);
  });

  it('permite crear un pedido COD-only sin seleccionar Wompi ni sumar sus cargos', async () => {
    const codOnly = { ...product, allowedPaymentMethods: ['cash_on_delivery'] };
    const g = gateways({ catalog: { listProducts: async () => [codOnly] } });
    const result = await calculateOrderPricing(g.catalog as never, g.promotions as never, g.settings as never,
      [{ productId: 'p1', quantity: 1 }], null, null, 500, 'cash_on_delivery');
    expect(result.allowedPaymentMethods).toEqual(['cash_on_delivery']);
    expect(result.policyItems[0]?.product.allowedPaymentMethods).toEqual(['cash_on_delivery']);
    expect(result.transactionFeeCents).toBe(0);
    expect(result.estimatedPaymentFeeCents).toBe(0);
  });
});
