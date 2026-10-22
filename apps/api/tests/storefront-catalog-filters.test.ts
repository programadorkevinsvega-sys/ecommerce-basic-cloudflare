import { describe, expect, it, vi } from 'vitest';
import { parseStorefrontCatalogFilters } from '../src/bff/controllers/storefront/StorefrontCatalogQuery.js';
import { D1ProductRepository } from '../src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.js';

function createRepositoryHarness() {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const all = vi.fn().mockResolvedValue({ results: [] });
  const prepare = vi.fn((sql: string) => ({
    bind: (...params: unknown[]) => {
      calls.push({ sql, params });
      return { all };
    },
  }));
  const repository = new D1ProductRepository({ prepare } as unknown as D1Database);
  return { repository, calls, all };
}

describe('storefront catalog filter query', () => {
  it('normalizes repeated brands and converts COP prices to integer cents', () => {
    const parsed = parseStorefrontCatalogFilters({
      brands: [' Casa Verde ', 'Casa Verde', 'Marca Norte', ''],
      minPrice: '40000',
      maxPrice: '10000',
      cod: '1',
      sort: 'price_desc',
    });

    expect(parsed.brands).toEqual(['Casa Verde', 'Marca Norte']);
    expect(parsed.minPriceCop).toBe(10000);
    expect(parsed.maxPriceCop).toBe(40000);
    expect(parsed.productFilters).toEqual({
      brand: ['Casa Verde', 'Marca Norte'],
      minPriceInCents: 1000000,
      maxPriceInCents: 4000000,
      cashOnDeliveryOnly: true,
      sort: 'price_desc',
    });
    expect(parsed.hasActiveFilters).toBe(true);
  });

  it('ignores malformed price values and rejects unknown sort values', () => {
    const parsed = parseStorefrontCatalogFilters({
      minPrice: '10,000',
      maxPrice: '-50',
      cod: 'true',
      sort: 'price_injection desc',
    });

    expect(parsed.minPriceCop).toBeUndefined();
    expect(parsed.maxPriceCop).toBeUndefined();
    expect(parsed.cashOnDeliveryOnly).toBe(false);
    expect(parsed.sort).toBe('featured');
    expect(parsed.productFilters.sort).toBe('featured');
  });

  it('caps the number of selected brands and brand input length', () => {
    const parsed = parseStorefrontCatalogFilters({
      brands: Array.from({ length: 14 }, (_, index) => `Brand ${index}${'x'.repeat(90)}`),
    });

    expect(parsed.brands).toHaveLength(10);
    expect(parsed.brands.every((brand) => brand.length === 80)).toBe(true);
  });
});

describe('D1 product query filters', () => {
  it('applies bound brand, price and payment filters before SQL pagination', async () => {
    const { repository, calls } = createRepositoryHarness();
    await repository.list(25, 24, 'published', {
      brand: ['Casa Verde', 'Marca Norte'],
      minPriceInCents: 100000,
      maxPriceInCents: 900000,
      cashOnDeliveryOnly: true,
      sort: 'price_asc',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('p.brand IN (?, ?)');
    expect(calls[0].sql).toContain('p.price_in_cents >= ?');
    expect(calls[0].sql).toContain('p.price_in_cents <= ?');
    expect(calls[0].sql).toContain('p.allows_cash_on_delivery = 1');
    expect(calls[0].sql).toContain('ORDER BY p.price_in_cents ASC, p.id ASC LIMIT ? OFFSET ?');
    expect(calls[0].params).toEqual([
      'published', 'Casa Verde', 'Marca Norte', 100000, 900000, 25, 24,
    ]);
  });

  it('keeps the text query parameterized and applies filters before LIMIT/OFFSET in search results', async () => {
    const { repository, calls } = createRepositoryHarness();
    await repository.search('Lámpara', 25, 24, 'published', {
      brand: ['Casa Verde'],
      cashOnDeliveryOnly: true,
      sort: 'name_asc',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('catalog_products_fts MATCH ?');
    expect(calls[0].sql).toContain('ranked_matches AS');
    expect(calls[0].sql).toContain('p.brand IN (?)');
    expect(calls[0].sql).toContain('p.allows_cash_on_delivery = 1');
    expect(calls[0].sql).toContain('ORDER BY p.name COLLATE NOCASE ASC, p.id ASC LIMIT ? OFFSET ?');
    expect(calls[0].sql).not.toContain('Lámpara');
    expect(calls[0].params).toEqual([
      '"Lámpara"*', 'published', 'Lámpara', 'published',
      'published', 'Casa Verde', 25, 24,
    ]);
  });
});
