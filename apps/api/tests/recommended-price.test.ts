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

  it('rechaza pronto márgenes que superan el máximo matemático de Wompi', () => {
    expect(() => calculateRecommendedPrice({ supplierCostCents: 6_000_000, targetMarginBasisPoints: 9999, taxRateBasisPoints: 1900, includeWompi: true, transactionShippingCents: 900_000 }))
      .toThrow('El margen no es alcanzable con Wompi');
  });

  it('calcula el precio para obtener una ganancia neta fija en pesos', () => {
    const result = calculateRecommendedPrice({ supplierCostCents: 6_000_000, targetMarginBasisPoints: 2000, pricingTargetType: 'profit', targetProfitCents: 2_000_000, taxRateBasisPoints: 1900, includeWompi: true, transactionShippingCents: 900_000 });
    expect(result.estimatedNetProfitCents).toBeGreaterThanOrEqual(2_000_000);
  });
});
