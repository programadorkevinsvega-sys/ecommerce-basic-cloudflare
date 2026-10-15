import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1ProductReviewRepository } from '../../src/modules/reviews/infrastructure/persistence/d1/repositories/D1ProductReviewRepository.js';
import { D1OrderRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.js';

describe('Product reviews and order ownership in D1', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) if (statement.trim()) await env.DB.prepare(statement).run();
  });

  it('aggregates and paginates approved reviews', async () => {
    const repository = new D1ProductReviewRepository(env.DB);
    const productId = crypto.randomUUID();
    await repository.create({ productId, customerId: crypto.randomUUID(), rating: 5, comment: 'Excelente calidad y entrega rápida.' });
    await repository.create({ productId, customerId: crypto.randomUUID(), rating: 3, comment: 'Cumple con lo que ofrece.' });
    const page = await repository.list(productId, 1, 1, 'approved');
    expect(page).toMatchObject({ total: 2, summary: { average: 4, count: 2, distribution: { 3: 1, 5: 1 } } });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.customerId).toBeTruthy();
  });

  it('verifies the delivered paid order against its actual customer, not the supplied product alone', async () => {
    const repository = new D1OrderRepository(env.DB);
    const orderId = crypto.randomUUID();
    const productId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    const otherCustomerId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO orders_orders(id,customer_id,customer_email,customer_name,customer_phone,shipping_address,shipping_zone_id,subtotal_cents,total_cents,payment_method,status,payment_status,created_at,updated_at) VALUES(?,?,?,?,?,'{}','zone',100,100,'wompi','delivered','approved',?,?)")
      .bind(orderId, customerId, 'private@example.test', 'Test Buyer', '3000000000', now, now).run();
    await env.DB.prepare('INSERT INTO orders_lines(id,order_id,product_id,product_name,product_sku,quantity,unit_price_cents,total_cents) VALUES(?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), orderId, productId, 'Producto de prueba', 'TEST-1', 1, 100, 100).run();
    expect(await repository.hasDeliveredProductPurchase(customerId, productId)).toBe(true);
    expect(await repository.hasDeliveredProductPurchase(otherCustomerId, productId)).toBe(false);
    expect(await repository.hasDeliveredProductPurchase(customerId, crypto.randomUUID())).toBe(false);
  });
});
