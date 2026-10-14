import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Collection } from '../../src/modules/catalog/domain/entities/Collection.js';
import { D1CollectionRepository } from '../../src/modules/catalog/infrastructure/persistence/d1/repositories/D1CollectionRepository.js';

describe('D1 collection persistence', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('persists collection fields and ordered product associations across reads', async () => {
    const repository = new D1CollectionRepository(env.DB);
    const id = crypto.randomUUID();
    await repository.save(new Collection({
      id, name: 'Colección D1', slug: `coleccion-${id.slice(0, 8)}`, description: 'Descripción guardada', imageMediaId: crypto.randomUUID(),
      productIds: ['product-b', 'product-a'], status: 'active', seoTitle: 'SEO', seoDescription: 'Meta',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
    const loaded = await repository.findById(id);
    expect(loaded?.toPrimitives()).toMatchObject({
      name: 'Colección D1', description: 'Descripción guardada', productIds: ['product-b', 'product-a'],
      status: 'active', seoTitle: 'SEO', seoDescription: 'Meta', imageMediaId: expect.any(String),
    });
    await repository.delete(id);
    expect(await repository.findById(id)).toBeNull();
  });
});
