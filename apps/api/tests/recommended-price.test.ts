import { describe, expect, it } from 'vitest';
import { calculateRecommendedPrice } from '../src/modules/catalog/domain/services/CalculateRecommendedPrice.js';

describe('precio recomendado por margen sobre venta', () => {
  it('resuelve un margen objetivo del 20% después del costo, IVA incluido y tarifa Wompi estimada', () => {
    const result = calculateRecommendedPrice({ supplierCostCents: 120000000, targetMarginBasisPoints: 2000, taxRateBasisPoints: 1900, includeWompi: true, transactionShippingCents: 0 });
    expect(result.priceInCents % 100).toBe(0);
    expect(result.estimatedMarginBasisPoints).toBeGreaterThanOrEqual(2000);
    expect(result.estimatedPaymentFeeCents).toBeGreaterThan(0);
  });

  it('excluye costo de Wompi cuando el producto no lo habilita', () => {
    const result = calculateRecommendedPrice({ supplierCostCents: 10000000, targetMarginBasisPoints: 2000, taxRateBasisPoints: 1900, includeWompi: false, transactionShippingCents: 0 });
    expect(result.estimatedPaymentFeeCents).toBe(0);
    expect(result.estimatedMarginBasisPoints).toBeGreaterThanOrEqual(2000);
  });
});
