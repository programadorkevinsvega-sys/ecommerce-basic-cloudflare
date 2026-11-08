import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Product } from '../../src/modules/catalog/domain/entities/Product.js';
import { ProductSalePolicy } from '../../src/modules/catalog/domain/entities/ProductSalePolicy.js';
import { D1ProductRepository } from '../../src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.js';
import { failD1BatchAtStatement } from './failD1BatchAtStatement.js';

const productIds: string[] = [];

function makeProduct(id: string, name = 'Producto de prueba'): Product {
  const now = new Date().toISOString();
  return new Product({
    id, name, slug: `producto-${id.toLowerCase()}`, description: 'Descripción',
    priceInCents: 1000, sku: `SKU-${id}`, stockQuantity: 2, status: 'draft', condition: 'new',
    specifications: {}, tags: [], noindex: false,
    salePolicy: new ProductSalePolicy({
      allowsCashOnDelivery: true, shippingScope: 'local', localCoverageZones: ['zone-test'], saleMode: 'cash',
    }),
    categoryIds: ['category-test'], mediaIds: ['media-test'], createdAt: now, updatedAt: now,
  });
}

async function productCount(table: string, id: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE product_id = ?`)
    .bind(id).first<{ total: number }>();
  return row?.total ?? 0;
}

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  for (const id of productIds) await new D1ProductRepository(env.DB).delete(id);
});

describe('catalog aggregate D1 atomicity', () => {
  it('rolls back product creation at every statement in the prefixed batch', async () => {
    for (let index = 0; index < 9; index++) {
      const id = `atomic-create-${crypto.randomUUID()}`;
      productIds.push(id);
      const repository = new D1ProductRepository(failD1BatchAtStatement(env.DB, index));
      await expect(repository.save(makeProduct(id))).rejects.toThrow('d1_fault_injection_missing_table');
      const product = await env.DB.prepare('SELECT id FROM catalog_products WHERE id = ?').bind(id).first();
      expect(product).toBeNull();
      expect(await productCount('catalog_product_categories', id)).toBe(0);
      expect(await productCount('catalog_product_images', id)).toBe(0);
      expect(await productCount('catalog_product_coverage', id)).toBe(0);
      expect(await productCount('catalog_products_fts', id)).toBe(0);
    }
  });

  it('preserves the prior product and all relations when an update fails at any batch step', async () => {
    const id = `atomic-update-${crypto.randomUUID()}`;
    productIds.push(id);
    const repository = new D1ProductRepository(env.DB);
    await repository.save(makeProduct(id));

    for (let index = 0; index < 9; index++) {
      const failingRepository = new D1ProductRepository(failD1BatchAtStatement(env.DB, index));
      await expect(failingRepository.save(makeProduct(id, 'Nombre actualizado')))
        .rejects.toThrow('d1_fault_injection_missing_table');
      const product = await env.DB.prepare('SELECT name FROM catalog_products WHERE id = ?')
        .bind(id).first<{ name: string }>();
      expect(product?.name).toBe('Producto de prueba');
      expect(await productCount('catalog_product_categories', id)).toBe(1);
      expect(await productCount('catalog_product_images', id)).toBe(1);
      expect(await productCount('catalog_product_coverage', id)).toBe(1);
      expect(await productCount('catalog_products_fts', id)).toBe(1);
    }
  });

  it('rejects relationship volumes that would exceed the configured D1 batch bounds', async () => {
    const id = `atomic-limit-${crypto.randomUUID()}`;
    productIds.push(id);
    const product = makeProduct(id);
    const oversized = new Product({
      ...product.toPrimitives(),
      salePolicy: product.salePolicy,
      categoryIds: Array.from({ length: 31 }, (_, index) => `category-${index}`),
    });
    await expect(new D1ProductRepository(env.DB).save(oversized))
      .rejects.toThrow('Cada producto admite como máximo 30 relaciones por tipo');
    const stored = await env.DB.prepare('SELECT id FROM catalog_products WHERE id = ?').bind(id).first();
    expect(stored).toBeNull();
  });
});
