import { describe, expect, it } from 'vitest';
import { calculateOrderTaxCents } from '../src/bff/controllers/payments/calculateOrderTaxCents.js';

describe('order tax breakdown', () => {
  it('reconciles the actual paid total, shipping, and discount', () => {
    expect(calculateOrderTaxCents({ subtotalCents: 93500, discountCents: 0, shippingCostCents: 9000, totalCents: 120265 })).toBe(17765);
    expect(calculateOrderTaxCents({ subtotalCents: 100000, discountCents: 10000, shippingCostCents: 5000, totalCents: 113550 })).toBe(18550);
  });

  it('rejects a total that cannot produce a valid tax line', () => {
    expect(() => calculateOrderTaxCents({ subtotalCents: 10000, discountCents: 0, shippingCostCents: 5000, totalCents: 14000 })).toThrow();
  });
});
