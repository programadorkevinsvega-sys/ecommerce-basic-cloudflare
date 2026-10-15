import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1OrderTrackingRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderTrackingRepository.js';

describe('Order tracking ownership in D1', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('returns account tracking only when both order ID and customer ID match', async () => {
    const repository = new D1OrderTrackingRepository(env.DB);
    const orderId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    const otherCustomerId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO orders_orders(id,customer_id,customer_email,customer_name,customer_phone,shipping_address,shipping_zone_id,subtotal_cents,total_cents,payment_method,status,payment_status,created_at,updated_at,min_estimated_days,max_estimated_days) VALUES(?,?,?,?,?,'{}','zone',100,100,'wompi','shipped','approved',?,?,1,2)")
      .bind(orderId, customerId, 'private@example.test', 'Test Buyer', '3000000000', now, now).run();
    await env.DB.prepare("INSERT INTO orders_history(id,order_id,to_status,actor,created_at) VALUES(?,?,?,'system',?)")
      .bind(crypto.randomUUID(), orderId, 'shipped', now).run();

    expect(await repository.findByCustomer(orderId, customerId)).toMatchObject({ orderId, status: 'shipped' });
    expect(await repository.findByCustomer(orderId, otherCustomerId)).toBeNull();
  });

  it('lists admin tracking with database pagination and saves delivery details', async () => {
    const repository = new D1OrderTrackingRepository(env.DB);
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO orders_orders(id,customer_id,customer_email,customer_name,customer_phone,shipping_address,shipping_zone_id,subtotal_cents,total_cents,payment_method,status,payment_status,created_at,updated_at,min_estimated_days,max_estimated_days) VALUES(?,'guest','buyer@example.test','Buyer Test','3000000000','{}','zone',100,100,'wompi','confirmed','approved',?,?,1,2)")
      .bind(orderId, now, now).run();
    const result = await repository.listForAdmin({ page: 1, pageSize: 10, query: 'buyer@example.test', status: 'confirmed' });
    expect(result).toMatchObject({ total: 1, items: [{ orderId, customerEmail: 'buyer@example.test', status: 'confirmed' }] });
    expect(await repository.saveShippingDetails(orderId, {
      shippingCarrier: 'Coordinadora', shippingTrackingNumber: 'ABC123',
      shippingTrackingUrl: 'https://tracking.example.test/ABC123', estimatedDeliveryDate: '2026-10-20',
    })).toBe(true);
    expect(await repository.findForAdmin(orderId)).toMatchObject({ shippingCarrier: 'Coordinadora', shippingTrackingNumber: 'ABC123', estimatedDeliveryDate: '2026-10-20' });
  });
});
