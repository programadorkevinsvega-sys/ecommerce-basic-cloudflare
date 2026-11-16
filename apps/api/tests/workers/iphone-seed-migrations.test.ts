import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';

describe('iPhone starter data migrations', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('creates ten unpublished iPhone products with SEO and no prices or images', async () => {
    const { results } = await env.DB.prepare(
      `SELECT p.id, p.name, p.price_in_cents, p.status, p.stock_quantity, p.brand,
              p.seo_title, p.seo_description, p.canonical_url, p.og_image_id
       FROM catalog_products p WHERE p.id LIKE 'product-iphone-%' ORDER BY p.id`,
    ).all<{
      id: string;
      name: string;
      price_in_cents: number;
      status: string;
      stock_quantity: number;
      brand: string | null;
      seo_title: string | null;
      seo_description: string | null;
      canonical_url: string | null;
      og_image_id: string | null;
    }>();

    expect(results).toHaveLength(10);
    expect(results.map((product) => product.name).sort()).toEqual([
      'iPhone 16 Pro',
      'iPhone 16 Pro Max',
      'iPhone 17',
      'iPhone 17 Pro',
      'iPhone 17 Pro Max',
      'iPhone 17e',
      'iPhone 18 Pro',
      'iPhone 18 Pro Max',
      'iPhone Air',
      'iPhone Duo',
    ].sort());
    for (const product of results) {
      expect(product.price_in_cents).toBe(0);
      expect(product.status).toBe('draft');
      expect(product.stock_quantity).toBe(0);
      expect(product.brand).toBe('Apple');
      expect(product.seo_title).toContain(product.name);
      expect(product.seo_description).toContain(product.name);
      expect(product.canonical_url).toContain('/productos/');
      expect(product.og_image_id).toBeNull();
    }

    const { results: images } = await env.DB.prepare(
      `SELECT id FROM catalog_product_images
       WHERE product_id LIKE 'product-iphone-%'`,
    ).all();
    expect(images).toHaveLength(0);

    const categoryProducts = await env.DB.prepare(
      `SELECT product_id FROM catalog_product_categories
       WHERE category_id = 'category-iphone'`,
    ).all();
    expect(categoryProducts.results).toHaveLength(10);
  });

  it('seeds iPhone attributes and non-sellable variant placeholders', async () => {
    const attributes = await env.DB.prepare(
      `SELECT code,type,status FROM catalog_attributes WHERE id LIKE 'attribute-iphone-%' ORDER BY code`,
    ).all<{ code: string; type: string; status: string }>();
    expect(attributes.results).toHaveLength(3);
    expect(attributes.results.map(({ code }) => code)).toEqual(['iphone_color', 'iphone_model', 'iphone_storage']);
    expect(attributes.results.every(({ status }) => status === 'active')).toBe(true);

    const variants = await env.DB.prepare(
      `SELECT product_id,price_in_cents,stock_quantity,status FROM catalog_product_variants
       WHERE id LIKE 'variant-iphone-%'`,
    ).all<{ product_id: string; price_in_cents: number | null; stock_quantity: number; status: string }>();
    expect(variants.results).toHaveLength(10);
    expect(variants.results.every((variant) => variant.price_in_cents === null
      && variant.stock_quantity === 0 && variant.status === 'inactive')).toBe(true);
  });

  it('seeds iPhone promotion, coupon and shipping templates inactive', async () => {
    const promotion = await env.DB.prepare(
      `SELECT target_type,target_id,is_active FROM promotions_rules WHERE id = 'promotion-iphone-template'`,
    ).first<{ target_type: string; target_id: string; is_active: number }>();
    const coupon = await env.DB.prepare(
      `SELECT target_type,target_id,is_active FROM promotions_coupons WHERE id = 'coupon-iphone-template'`,
    ).first<{ target_type: string; target_id: string; is_active: number }>();
    const shipping = await env.DB.prepare(
      `SELECT target_type,target_id,is_active FROM shipping_free_shipping_rules WHERE id = 'free-shipping-iphone-template'`,
    ).first<{ target_type: string; target_id: string; is_active: number }>();
    for (const offer of [promotion, coupon, shipping]) {
      expect(offer).toMatchObject({ target_type: 'category', target_id: 'category-iphone', is_active: 0 });
    }
  });

  it('removes unchanged non-technology starter content without deleting active offers', async () => {
    const oldProducts = await env.DB.prepare(
      `SELECT id FROM catalog_products
       WHERE id IN ('product-seed-aviator','product-seed-socks','product-seed-backpack')`,
    ).all();
    expect(oldProducts.results).toHaveLength(0);

    const oldPromotions = await env.DB.prepare(
      `SELECT id FROM promotions_rules
       WHERE id IN ('promotion-launch-category','promotion-essentials-all','promotion-backpack-product')`,
    ).all();
    expect(oldPromotions.results).toHaveLength(0);

    const oldCoupons = await env.DB.prepare(
      `SELECT id FROM promotions_coupons
       WHERE id IN ('coupon-first-order','coupon-eyewear','coupon-backpack')`,
    ).all();
    expect(oldCoupons.results).toHaveLength(0);

    const oldShippingRules = await env.DB.prepare(
      `SELECT id FROM shipping_free_shipping_rules
       WHERE id IN ('free-shipping-all-150k','free-shipping-eyewear','free-shipping-collection')`,
    ).all();
    expect(oldShippingRules.results).toHaveLength(0);
  });

  it('updates only the starter blog article and keeps iPhone banners inactive and image-free', async () => {
    const article = await env.DB.prepare(
      `SELECT title, slug, seo_title, seo_description
       FROM cms_blog_posts WHERE id = '00000000-0000-4000-8000-000000000003'`,
    ).first<{ title: string; slug: string; seo_title: string; seo_description: string }>();
    expect(article?.slug).toBe('como-elegir-un-iphone');
    expect(article?.seo_title).toContain('iPhone');
    expect(article?.seo_description).toContain('iPhone');

    const { results: banners } = await env.DB.prepare(
      `SELECT id, title, image_url, is_active
       FROM storefront_banners WHERE id LIKE 'banner-%'`,
    ).all<{ id: string; title: string; image_url: string; is_active: number }>();
    expect(banners).toHaveLength(6);
    expect(banners.every((banner) => /iPhone/i.test(banner.title))).toBe(true);
    expect(banners.every((banner) => banner.image_url === '')).toBe(true);
    expect(banners.every((banner) => banner.is_active === 0)).toBe(true);
  });
});
