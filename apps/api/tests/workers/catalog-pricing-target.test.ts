import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1ProductRepository } from '../../src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.js';
import { CreateProductUseCase } from '../../src/modules/catalog/application/use-cases/CreateProductUseCase.js';

describe('D1 catalog fixed profit target', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('saves and reloads fixed COP profit target and calculated price', async () => {
    const repository = new D1ProductRepository(env.DB);
    const result = await new CreateProductUseCase(repository).execute({
      name: 'Producto utilidad fija', slug: 'producto-utilidad-fija-test', description: 'Test', priceInCents: 1,
      supplierCostCents: 6_000_000, targetMarginBasisPoints: 2000, pricingTargetType: 'profit',
      targetProfitCents: 2_000_000, allowedPaymentMethods: ['wompi'], sku: 'FIXED-PROFIT-TEST',
      stockQuantity: 2, status: 'draft', allowsCashOnDelivery: false, shippingScope: 'national',
      taxRateBasisPoints: 1900, transactionShippingCents: 900_000,
    });
    expect(result.isOk()).toBe(true);
    const saved = await repository.findBySlug('producto-utilidad-fija-test');
    const row = await env.DB.prepare('SELECT pricing_target_type,target_profit_cents,price_in_cents FROM catalog_products WHERE slug = ?')
      .bind('producto-utilidad-fija-test').first<{ pricing_target_type: string; target_profit_cents: number; price_in_cents: number }>();
    expect(saved?.toPrimitives()).toMatchObject({ pricingTargetType: 'profit', targetProfitCents: 2_000_000 });
    expect(row).toMatchObject({ pricing_target_type: 'profit', target_profit_cents: 2_000_000 });
    expect(row?.price_in_cents).toBeGreaterThan(6_000_000);
  });
});
