import { describe, expect, it, vi } from 'vitest';
import { MigrateLegacyProductPricesUseCase } from '../src/modules/catalog/application/use-cases/MigrateLegacyProductPricesUseCase.js';

function setup() {
  const product: any = {
    id: 'p-1', name: 'Legacy', priceInCents: 10000, updatedAt: 't0', pricingVersion: 1,
    updateDetails(updates: Record<string, unknown>) { Object.assign(this, updates); },
  };
  const repo = { list: vi.fn(async () => [product]), save: vi.fn(async () => {}) };
  return { product, repo, useCase: new MigrateLegacyProductPricesUseCase(repo as never) };
}

describe('MigrateLegacyProductPricesUseCase', () => {
  it('previews the configured IVA, preserves the old price and only applies the confirmed snapshot', async () => {
    const { product, repo, useCase } = setup();
    const preview = await useCase.preview(1900);
    expect(preview.products[0]?.finalPriceCents).toBe(11900);
    await expect(useCase.execute(1900, 1, 'stale')).rejects.toThrow('vuelve a previsualizar');
    expect(await useCase.execute(1900, preview.legacyProductCount, preview.fingerprint)).toBe(1);
    expect(product.priceInCents).toBe(11900);
    expect(product.legacyPriceBeforeTaxCents).toBe(10000);
    expect(product.pricingVersion).toBe(2);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
