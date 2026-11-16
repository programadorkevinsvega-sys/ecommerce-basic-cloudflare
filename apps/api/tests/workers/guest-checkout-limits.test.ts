import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { Order } from '../../src/modules/orders/domain/entities/Order.js';
import { OrderLine } from '../../src/modules/orders/domain/entities/OrderLine.js';
import { GuestOrderCreationLimitExceeded } from '../../src/modules/orders/domain/errors/GuestOrderCreationLimitExceeded.js';
import { D1OrderRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.js';

const orderIds: string[] = [];
const repository = new D1OrderRepository(env.DB);
const fingerprint = (value: string) => value.repeat(64).slice(0, 64);

async function createProtectedOrder(
  signals: { ip: string; email: string; cart: string },
  emailsReserved: number,
): Promise<string> {
  const id = `ord-${crypto.randomUUID()}`;
  orderIds.push(id);
  const now = new Date().toISOString();
  const order = new Order({
    id, customerEmail: 'buyer@example.test', customerName: 'Buyer', customerPhone: '3000000000',
    customerTaxId: '1234567890', shippingAddress: {
      department: 'Antioquia', municipality: 'Medellín', daneCode: '05001', addressLine: 'Calle 1',
    },
    guestCartIdHash: fingerprint('a'), guestTrackingTokenHash: fingerprint('b'),
    shippingZoneId: 'zone-test', shippingCostCents: 0, subtotalCents: 1000, totalCents: 1000,
    paymentMethod: 'cash_on_delivery', status: 'placed', paymentStatus: 'pending',
    shippingFulfillmentMethod: 'merchant_local',
    lines: [new OrderLine({
      orderId: id, productId: 'product-test', productName: 'Test', productSku: 'SKU',
      quantity: 1, unitPriceCents: 1000,
    })],
    createdAt: now, updatedAt: now,
  });
  await repository.saveAggregate(order, {
    orderId: id, fromStatus: null, toStatus: 'placed', actor: 'test', createdAt: now,
  }, {
    name: 'orders.order.placed.v1', payload: { orderId: id },
  }, {
    ipFingerprint: fingerprint(signals.ip), emailFingerprint: fingerprint(signals.email),
    cartFingerprint: fingerprint(signals.cart),
    emailReservations: [{ recipientFingerprint: fingerprint(signals.email), count: emailsReserved }],
  });
  return id;
}

async function expectNoArtifacts(id: string): Promise<void> {
  for (const [table, column] of [
    ['orders_orders', 'id'], ['orders_lines', 'order_id'], ['orders_history', 'order_id'],
    ['orders_local_delivery_labels', 'order_id'], ['orders_guest_checkout_attempts', 'order_id'],
    ['orders_guest_checkout_email_reservations', 'order_id'],
  ]) {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`)
      .bind(id).first<{ total: number }>();
    expect(row?.total ?? 0).toBe(0);
  }
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
      env.DB.prepare('DELETE FROM orders_guest_checkout_attempts WHERE order_id = ?').bind(id),
      env.DB.prepare('DELETE FROM orders_guest_checkout_email_reservations WHERE order_id = ?').bind(id),
      env.DB.prepare('DELETE FROM orders_history WHERE order_id = ?').bind(id),
      env.DB.prepare('DELETE FROM orders_lines WHERE order_id = ?').bind(id),
      env.DB.prepare('DELETE FROM orders_local_delivery_labels WHERE order_id = ?').bind(id),
      env.DB.prepare("DELETE FROM orders_outbox_events WHERE json_extract(payload, '$.orderId') = ?").bind(id),
      env.DB.prepare('DELETE FROM orders_orders WHERE id = ?').bind(id),
    ]);
  }
});

describe('guest checkout D1 limits', () => {
  it('atomically permits at most three concurrent pending orders per IP', async () => {
    const start = orderIds.length;
    const requests = Array.from({ length: 4 }, (_, index) =>
      createProtectedOrder({ ip: 'shared-ip', email: `email-${index}`, cart: `cart-${index}` }, 1));
    const results = await Promise.allSettled(requests);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(3);
    expect(results.filter((result) => result.status === 'rejected' &&
      result.reason instanceof GuestOrderCreationLimitExceeded)).toHaveLength(1);
    const successfulIds = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    await Promise.all(orderIds.slice(start).filter((id) => !successfulIds.includes(id)).map(expectNoArtifacts));
  });

  it('limits pending orders by email and cart', async () => {
    const startEmail = orderIds.length;
    const emailRequests = Array.from({ length: 3 }, (_, index) =>
      createProtectedOrder({ ip: `ip-email-${index}`, email: 'same-email', cart: `email-cart-${index}` }, 1));
    const emailResults = await Promise.allSettled(emailRequests);
    expect(emailResults.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
    const successfulEmailIds = emailResults.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    await Promise.all(orderIds.slice(startEmail).filter((id) => !successfulEmailIds.includes(id)).map(expectNoArtifacts));

    const startCart = orderIds.length;
    const cartRequests = Array.from({ length: 3 }, (_, index) =>
      createProtectedOrder({ ip: `ip-cart-${index}`, email: `cart-email-${index}`, cart: 'same-cart' }, 1));
    const cartResults = await Promise.allSettled(cartRequests);
    expect(cartResults.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
    const successfulCartIds = cartResults.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    await Promise.all(orderIds.slice(startCart).filter((id) => !successfulCartIds.includes(id)).map(expectNoArtifacts));
  });

  it('reserves no more than three order emails per recipient in the rolling hour', async () => {
    await createProtectedOrder({ ip: 'email-limit-ip-1', email: 'reserved-email', cart: 'email-limit-cart-1' }, 2);
    await createProtectedOrder({ ip: 'email-limit-ip-2', email: 'reserved-email', cart: 'email-limit-cart-2' }, 1);
    const start = orderIds.length;
    await expect(createProtectedOrder({
      ip: 'email-limit-ip-3', email: 'reserved-email', cart: 'email-limit-cart-3',
    }, 1)).rejects.toBeInstanceOf(GuestOrderCreationLimitExceeded);
    const rejectedId = orderIds[start];
    if (!rejectedId) throw new Error('Rejected order ID was not recorded');
    await expectNoArtifacts(rejectedId);
  });
});
