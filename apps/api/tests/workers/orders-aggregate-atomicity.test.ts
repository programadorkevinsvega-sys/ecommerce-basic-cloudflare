import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Order } from '../../src/modules/orders/domain/entities/Order.js';
import { OrderLine } from '../../src/modules/orders/domain/entities/OrderLine.js';
import { CreateOrderUseCase } from '../../src/modules/orders/application/use-cases/CreateOrderUseCase.js';
import { D1OrderRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.js';
import { failD1BatchAtStatement } from './failD1BatchAtStatement.js';

const orderIds: string[] = [];

function makeOrder(id: string, status: 'placed' | 'shipped' = 'placed'): Order {
  const now = new Date().toISOString();
  return new Order({
    id, customerEmail: 'customer@example.test', customerName: 'Cliente de prueba', customerPhone: '3000000000',
    shippingAddress: { department: 'Cundinamarca', municipality: 'Bogotá', daneCode: '11001', addressLine: 'Calle 1' },
    shippingZoneId: 'zone-test', shippingCostCents: 0, subtotalCents: 2000, totalCents: 2000,
    paymentMethod: 'wompi', status, paymentStatus: 'pending', shippingFulfillmentMethod: 'merchant_local',
    lines: [1, 2].map((number) => new OrderLine({
      id: `line-${id}-${number}`, orderId: id, productId: `product-${number}`, productName: `Producto ${number}`,
      productSku: `SKU-${number}`, quantity: number, unitPriceCents: 1000,
    })),
    createdAt: now, updatedAt: now,
  });
}

function history(id: string, toStatus: string) {
  return { orderId: id, fromStatus: null, toStatus, actor: 'test', createdAt: new Date().toISOString() };
}

function event(id: string) {
  return { name: 'orders.order.placed.v1', payload: { orderId: id } };
}

async function rowCount(table: string, column: string, id: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`)
    .bind(id).first<{ total: number }>();
  return row?.total ?? 0;
}

async function expectAbsent(id: string): Promise<void> {
  expect(await rowCount('orders_orders', 'id', id)).toBe(0);
  expect(await rowCount('orders_lines', 'order_id', id)).toBe(0);
  expect(await rowCount('orders_history', 'order_id', id)).toBe(0);
  expect(await rowCount('orders_local_delivery_labels', 'order_id', id)).toBe(0);
  const outbox = await env.DB.prepare("SELECT COUNT(*) AS total FROM orders_outbox_events WHERE json_extract(payload, '$.orderId') = ?")
    .bind(id).first<{ total: number }>();
  expect(outbox?.total ?? 0).toBe(0);
}

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  for (const id of orderIds) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM orders_history WHERE order_id = ?').bind(id),
      env.DB.prepare('DELETE FROM orders_lines WHERE order_id = ?').bind(id),
      env.DB.prepare('DELETE FROM orders_local_delivery_labels WHERE order_id = ?').bind(id),
      env.DB.prepare("DELETE FROM orders_outbox_events WHERE json_extract(payload, '$.orderId') = ?").bind(id),
      env.DB.prepare('DELETE FROM orders_orders WHERE id = ?').bind(id),
    ]);
  }
});

describe('orders aggregate D1 atomicity', () => {
  it('creates through the application use case with history and outbox in the same aggregate write', async () => {
    const repository = new D1OrderRepository(env.DB);
    const order = await new CreateOrderUseCase(repository).execute({
      customerId: 'customer-atomic-test', guestCartIdHash: null,
      customerEmail: 'customer@example.test', customerName: 'Cliente de prueba', customerPhone: '3000000000',
      shippingAddress: { department: 'Cundinamarca', municipality: 'Bogotá', daneCode: '11001', addressLine: 'Calle 1' },
      shippingZoneId: 'zone-test', shippingCostCents: 0, subtotalCents: 1000, totalCents: 1000,
      guestTrackingTokenHash: 'a'.repeat(64), paymentMethod: 'wompi', shippingFulfillmentMethod: 'merchant_local',
      lines: [{ productId: 'product-test', productName: 'Producto', productSku: 'SKU', quantity: 1, unitPriceCents: 1000 }],
    });
    orderIds.push(order.id);
    expect(await rowCount('orders_orders', 'id', order.id)).toBe(1);
    expect(await rowCount('orders_lines', 'order_id', order.id)).toBe(1);
    expect(await rowCount('orders_history', 'order_id', order.id)).toBe(1);
    expect(await rowCount('orders_local_delivery_labels', 'order_id', order.id)).toBe(1);
    const outbox = await env.DB.prepare("SELECT COUNT(*) AS total FROM orders_outbox_events WHERE json_extract(payload, '$.orderId') = ?")
      .bind(order.id).first<{ total: number }>();
    expect(outbox?.total).toBe(1);
  });

  it('persists order, lines, history, local label and outbox atomically', async () => {
    const id = `atomic-success-${crypto.randomUUID()}`;
    orderIds.push(id);
    const repository = new D1OrderRepository(env.DB);
    await repository.saveAggregate(makeOrder(id), history(id, 'placed'), event(id));
    expect(await rowCount('orders_orders', 'id', id)).toBe(1);
    expect(await rowCount('orders_lines', 'order_id', id)).toBe(2);
    expect(await rowCount('orders_history', 'order_id', id)).toBe(1);
    expect(await rowCount('orders_local_delivery_labels', 'order_id', id)).toBe(1);
    const outbox = await env.DB.prepare("SELECT COUNT(*) AS total FROM orders_outbox_events WHERE json_extract(payload, '$.orderId') = ?")
      .bind(id).first<{ total: number }>();
    expect(outbox?.total).toBe(1);
  });

  it('leaves no order artifacts when creation fails at any batch statement', async () => {
    for (let index = 0; index < 7; index++) {
      const id = `atomic-create-${crypto.randomUUID()}`;
      orderIds.push(id);
      const repository = new D1OrderRepository(failD1BatchAtStatement(env.DB, index));
      await expect(repository.saveAggregate(makeOrder(id), history(id, 'placed'), event(id)))
        .rejects.toThrow('d1_fault_injection_missing_table');
      await expectAbsent(id);
    }
  });

  it('preserves the existing order aggregate when an update fails at any batch statement', async () => {
    const id = `atomic-update-${crypto.randomUUID()}`;
    orderIds.push(id);
    const repository = new D1OrderRepository(env.DB);
    await repository.saveAggregate(makeOrder(id), history(id, 'placed'), event(id));

    for (let index = 0; index < 7; index++) {
      const failingRepository = new D1OrderRepository(failD1BatchAtStatement(env.DB, index));
      await expect(failingRepository.saveAggregate(makeOrder(id, 'shipped'), history(id, 'shipped'), event(id)))
        .rejects.toThrow('d1_fault_injection_missing_table');
      const stored = await env.DB.prepare('SELECT status FROM orders_orders WHERE id = ?')
        .bind(id).first<{ status: string }>();
      expect(stored?.status).toBe('placed');
      expect(await rowCount('orders_lines', 'order_id', id)).toBe(2);
      expect(await rowCount('orders_history', 'order_id', id)).toBe(1);
      expect(await rowCount('orders_local_delivery_labels', 'order_id', id)).toBe(1);
      const outbox = await env.DB.prepare("SELECT COUNT(*) AS total FROM orders_outbox_events WHERE json_extract(payload, '$.orderId') = ?")
        .bind(id).first<{ total: number }>();
      expect(outbox?.total).toBe(1);
    }
  });

  it('rejects an oversized line collection before creating database statements', async () => {
    const id = `atomic-limit-${crypto.randomUUID()}`;
    orderIds.push(id);
    const order = makeOrder(id);
    const oversized = new Order({
      ...order.toJSON(),
      lines: Array.from({ length: 51 }, (_, index) => new OrderLine({
        id: `limit-line-${index}`, orderId: id, productId: `product-${index}`, productName: 'Producto',
        productSku: 'SKU', quantity: 1, unitPriceCents: 1000,
      })),
    });
    await expect(new D1OrderRepository(env.DB).save(oversized))
      .rejects.toThrow('Un pedido admite como máximo 50 líneas');
    await expectAbsent(id);
  });
});
