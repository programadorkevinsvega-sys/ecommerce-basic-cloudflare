import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1StorefrontContentRepository } from '../../src/modules/storefront/infrastructure/persistence/d1/repositories/D1StorefrontContentRepository.js';

describe('storefront starter banner migration', () => {
  beforeAll(async () => {
    const migrations = env.TEST_MIGRATIONS.filter(({ name }) => name.startsWith('storefront__'));
    for (const migration of migrations) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('keeps starter banners listable without third-party image URLs', async () => {
    const result = await new D1StorefrontContentRepository(env.DB).listAdminBanners(25, 0);

    expect(result.items.map((banner) => banner.id).sort()).toEqual([
      'banner-info-journal',
      'banner-info-quality',
      'banner-info-shipping',
      'banner-promo-brands',
      'banner-promo-catalog',
      'banner-promo-collections',
    ]);
    expect(result.items.every((banner) => banner.imageUrl === '')).toBe(true);
  });
});
