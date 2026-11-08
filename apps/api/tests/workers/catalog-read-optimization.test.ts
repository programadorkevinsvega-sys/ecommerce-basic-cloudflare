import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Product } from '../../src/modules/catalog/domain/entities/Product.js';
import { ProductSalePolicy } from '../../src/modules/catalog/domain/entities/ProductSalePolicy.js';
import { D1ProductRepository } from '../../src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.js';

const productIds: string[] = [];

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  const repository = new D1ProductRepository(env.DB);
  for (const id of productIds) await repository.delete(id);
});

describe('catalog read query optimization', () => {
  it('hydrates a page in batches and returns compact admin matches from D1', async () => {
    const id = `read-${crypto.randomUUID().replace(/-/g, '')}`;
    productIds.push(id);
    const repository = new D1ProductRepository(env.DB);
    await repository.save(new Product({
      id, name: `BatchRead${id}`, slug: `batch-${id}`, description: 'Lectura por lote',
      priceInCents: 1500, sku: `SKU-${id}`, stockQuantity: 4, status: 'draft', condition: 'new',
      specifications: {}, tags: [], brand: 'ReadBrand', noindex: false,
      salePolicy: new ProductSalePolicy({
        allowsCashOnDelivery: true, shippingScope: 'local', localCoverageZones: ['zone-read'], saleMode: 'cash',
      }),
      categoryIds: ['category-read'], mediaIds: ['media-read'],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));

    const products = await repository.list(25, 0, 'draft');
    expect(products.find((product) => product.id === id)).toMatchObject({
      categoryIds: ['category-read'], mediaIds: ['media-read'], salePolicy: { localCoverageZones: ['zone-read'] },
    });
    const adminItems = await repository.listAdmin(25, 0, 'draft', `BatchRead${id}`);
    expect(adminItems.find((item) => item.id === id)).toMatchObject({
      name: `BatchRead${id}`, imageMediaId: 'media-read', allowsCashOnDelivery: true,
    });
  });
});
