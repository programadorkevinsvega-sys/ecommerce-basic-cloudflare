import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1AdminOrderListRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1AdminOrderListRepository.js';

const orderIds: string[] = [];

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  for (const id of orderIds) await env.DB.prepare('DELETE FROM orders_orders WHERE id = ?').bind(id).run();
});

describe('admin order list read optimization', () => {
  it('uses exact or prefix search and returns a line-free projection from D1', async () => {
    const id = `ord-${crypto.randomUUID()}`;
    orderIds.push(id);
    await env.DB.prepare(`INSERT INTO orders_orders (
      id, customer_id, customer_email, customer_name, customer_phone, shipping_address,
      shipping_zone_id, shipping_cost_cents, subtotal_cents, discount_cents, coupon_code,
      total_cents, payment_method, status, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, 'customer-read-test', 'read@example.test', 'Ada Lovelace', '3000000000',
      '{"municipality":"Cali","department":"Valle"}', 'zone-read-test', 0, 5000, 0, null,
      5000, 'wompi', 'placed', 'pending', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z',
    ).run();
    const repository = new D1AdminOrderListRepository(env.DB);

    const byNamePrefix = await repository.list({ page: 1, pageSize: 10, query: 'Ada' });
    const bySubstring = await repository.list({ page: 1, pageSize: 10, query: 'Lovelace' });
    const byExactId = await repository.list({ page: 1, pageSize: 10, query: id });

    expect(byNamePrefix.items.map((order) => order.id)).toContain(id);
    expect(bySubstring.items).toHaveLength(0);
    expect(byExactId.items.map((order) => order.id)).toContain(id);
    expect(byNamePrefix.items[0]).not.toHaveProperty('lines');
    expect(byNamePrefix.items[0]).not.toHaveProperty('customerEmail');
  });
});
