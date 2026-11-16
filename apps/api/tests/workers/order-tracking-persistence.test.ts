import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1OrderTrackingRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderTrackingRepository.js';

describe('Order tracking ownership in D1', () => {
  let backfilledOrderId = '';
  const backfilledTokenHash = 'b'.repeat(64);

  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      if (migration.name === 'orders__0014_guest_tracking_expiration.sql') {
        backfilledOrderId = crypto.randomUUID();
        const createdAt = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare(
          `INSERT INTO orders_orders(
            id,customer_id,customer_email,customer_name,customer_phone,shipping_address,shipping_zone_id,
            subtotal_cents,total_cents,payment_method,status,payment_status,created_at,updated_at,guest_tracking_token_hash
          ) VALUES(?,'guest','legacy@example.test','Legacy','3000000000','{}','zone',100,100,
            'wompi','shipped','approved',?,?,?)`
        ).bind(backfilledOrderId, createdAt, createdAt, backfilledTokenHash).run();
      }
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

  it('rejects expired guest capabilities and allows them only before their persisted expiry', async () => {
    const repository = new D1OrderTrackingRepository(env.DB);
    const tokenHash = 'a'.repeat(64);
    const now = new Date();
    const expiredId = crypto.randomUUID();
    const activeId = crypto.randomUUID();
    const insert = async (id: string, expiresAt: string) => env.DB.prepare(
      `INSERT INTO orders_orders(
        id,customer_id,customer_email,customer_name,customer_phone,shipping_address,shipping_zone_id,
        subtotal_cents,total_cents,payment_method,status,payment_status,created_at,updated_at,
        guest_tracking_token_hash,guest_tracking_token_expires_at
      ) VALUES(?,'guest','buyer@example.test','Buyer','3000000000','{}','zone',100,100,
        'wompi','shipped','approved',?,?,?,?)`
    ).bind(id, now.toISOString(), now.toISOString(), tokenHash, expiresAt).run();
    await insert(expiredId, new Date(now.getTime() - 60_000).toISOString());
    await insert(activeId, new Date(now.getTime() + 60_000).toISOString());

    expect(await repository.findByCapability(expiredId, tokenHash)).toBeNull();
    expect(await repository.findByCapability(activeId, tokenHash)).toMatchObject({ orderId: activeId });
  });

  it('backfills legacy capability expirations from the original order date', async () => {
    const repository = new D1OrderTrackingRepository(env.DB);
    const row = await env.DB.prepare(
      'SELECT guest_tracking_token_expires_at FROM orders_orders WHERE id = ?'
    ).bind(backfilledOrderId).first<{ guest_tracking_token_expires_at: string }>();
    expect(Date.parse(row?.guest_tracking_token_expires_at || '')).toBeLessThan(Date.now());
    expect(await repository.findByCapability(backfilledOrderId, backfilledTokenHash)).toBeNull();
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

  it('treats percent and underscore in admin search as literal characters', async () => {
    const repository = new D1OrderTrackingRepository(env.DB);
    const now = new Date().toISOString();
    const rows = [
      { id: crypto.randomUUID(), name: 'Buyer 100% Match', email: 'literal@example.test' },
      { id: crypto.randomUUID(), name: 'Buyer 100X Match', email: 'percent-decoy@example.test' },
      { id: crypto.randomUUID(), name: 'Buyer Code_A Match', email: 'underscore@example.test' },
      { id: crypto.randomUUID(), name: 'Buyer CodeXA Match', email: 'underscore-decoy@example.test' },
    ];
    for (const row of rows) {
      await env.DB.prepare(
        `INSERT INTO orders_orders(
          id,customer_id,customer_email,customer_name,customer_phone,shipping_address,shipping_zone_id,
          subtotal_cents,total_cents,payment_method,status,payment_status,created_at,updated_at
        ) VALUES(?,'guest',?,?, '3000000000','{}','zone',100,100,'wompi','confirmed','approved',?,?)`
      ).bind(row.id, row.email, row.name, now, now).run();
    }

    const percentMatches = await repository.listForAdmin({ page: 1, pageSize: 10, query: '100%', status: 'confirmed' });
    const underscoreMatches = await repository.listForAdmin({ page: 1, pageSize: 10, query: 'Code_A', status: 'confirmed' });
    expect(percentMatches.items.map((item) => item.orderId)).toEqual([rows[0]?.id]);
    expect(underscoreMatches.items.map((item) => item.orderId)).toEqual([rows[2]?.id]);
  });
});
