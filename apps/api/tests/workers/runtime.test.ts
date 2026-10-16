import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { env, exports } from 'cloudflare:workers';
import { OrdersController } from '../../src/bff/controllers/orders/OrdersController.js';
import { D1InventoryRepository } from '../../src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryRepository.js';
import { D1OrderRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.js';
import { Order } from '../../src/modules/orders/domain/entities/Order.js';
import { OrderLine } from '../../src/modules/orders/domain/entities/OrderLine.js';
import { hashGuestCartId } from '../../src/bff/security/GuestCartCapability.js';
import { createInventoryModule } from '../../src/modules/inventory/module.config.js';

async function signWompiWebhook(transaction: Record<string, unknown>) {
  const timestamp = Math.floor(Date.now() / 1000);
  const properties = ['transaction.id', 'transaction.reference', 'transaction.amount_in_cents', 'transaction.currency', 'transaction.status'];
  const values = properties.map((path) => path.split('.').slice(1).reduce((value: any, key) => value?.[key], transaction)).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${values}${timestamp}local-test-events-secret`));
  const checksum = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  return { timestamp, checksum, body: { event: 'transaction.updated', data: { transaction }, environment: 'test', timestamp, signature: { properties, checksum } } };
}

describe('Worker API security and runtime bindings', () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });
  it('dispatches a request through the actual Worker entrypoint', async () => {
    const response = await exports.default.fetch('https://shop.test/health');
    expect(response.status).toBe(200);
  }, 15000);

  it('rejects cross-origin cookie mutations before reaching a controller', async () => {
    const response = await exports.default.fetch('https://shop.test/api/v1/orders', {
      method: 'POST', headers: { Origin: 'https://attacker.test', Cookie: '__Host-session=abc', 'Content-Type': 'application/json' }, body: '{}',
    });
    expect(response.status).toBe(403);
  });

  it('applies the auth limiter in the Workers runtime', async () => {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 21; attempt++) {
      response = await exports.default.fetch('https://shop.test/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    }
    expect(response?.status).toBe(429);
    expect(env.AUTH_LIMITER).toBeDefined();
  });

  it('accepts and deduplicates a real signed Wompi webhook through Worker and D1', async () => {
    const transaction = { id: 'wompi-local-tx', reference: 'ORDER-LOCAL-0001', amount_in_cents: 129900, currency: 'COP', status: 'PENDING' };
    await env.DB.prepare('INSERT INTO payments_transactions (id, order_id, payment_method, amount_in_cents, currency, reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind('payment-local', 'order-local', 'wompi', transaction.amount_in_cents, transaction.currency, transaction.reference, 'pending', new Date().toISOString(), new Date().toISOString()).run();
    const { body, checksum } = await signWompiWebhook(transaction);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: transaction }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const request = () => exports.default.fetch('https://shop.test/api/v1/webhooks/wompi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const events = await env.DB.prepare('SELECT event_id FROM payments_webhook_events WHERE event_id = ?').bind(checksum).all();
    expect(events.results).toHaveLength(1);
  });

  it('confirms an approved payment once through the Worker and keeps stock idempotent on replay', async () => {
    const orderId = 'wompi-approved-order';
    const productId = 'wompi-approved-product';
    const now = new Date().toISOString();
    const reference = `ORDER-${orderId}`;
    const transaction = { id: 'wompi-approved-tx', reference, amount_in_cents: 1190, currency: 'COP', status: 'APPROVED' };
    const order = new Order({
      id: orderId, customerEmail: 'guest@example.test', customerName: 'Guest', customerPhone: '3000000000',
      shippingAddress: { department: 'Cundinamarca', municipality: 'Bogotá', daneCode: '11001', addressLine: 'Test' },
      shippingZoneId: 'zone-test', shippingCostCents: 0, subtotalCents: 1000, totalCents: 1190,
      paymentMethod: 'wompi', lines: [new OrderLine({ id: 'wompi-approved-line', orderId, productId, productName: 'Item', productSku: 'SKU', quantity: 1, unitPriceCents: 1000 })],
      createdAt: now, updatedAt: now,
    });
    await new D1OrderRepository(env.DB).save(order);
    await env.DB.prepare('INSERT INTO payments_transactions (id, order_id, payment_method, amount_in_cents, currency, reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind('wompi-approved-payment', orderId, 'wompi', 1190, 'COP', reference, 'pending', now, now).run();
    await env.DB.prepare('INSERT INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at) VALUES (?, ?, ?, ?)')
      .bind(productId, 4, 1, now).run();
    await env.DB.prepare('INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind('wompi-approved-reservation', orderId, productId, 1, 'pending', new Date(Date.now() + 60000).toISOString(), now).run();

    const { body, checksum } = await signWompiWebhook(transaction);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: transaction }), { status: 200 })));
    const request = () => exports.default.fetch('https://shop.test/api/v1/webhooks/wompi', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);

    const settledOrder = await new D1OrderRepository(env.DB).findById(orderId);
    const stock = await env.DB.prepare('SELECT quantity, reserved_quantity FROM inventory_stocks WHERE product_id = ?').bind(productId).first<{ quantity: number; reserved_quantity: number }>();
    const payments = await env.DB.prepare('SELECT status FROM payments_transactions WHERE id = ?').bind('wompi-approved-payment').first<{ status: string }>();
    const invoiceRows = await env.DB.prepare('SELECT id FROM invoicing_invoices WHERE order_id = ?').bind(orderId).all();
    const paymentEvents = await env.DB.prepare('SELECT event_id FROM payments_webhook_events WHERE event_id = ?').bind(checksum).all();

    expect(settledOrder).toMatchObject({ status: 'confirmed', paymentStatus: 'approved' });
    expect(stock).toEqual({ quantity: 3, reserved_quantity: 0 });
    expect(payments?.status).toBe('approved');
    expect(invoiceRows.results).toHaveLength(1);
    expect(paymentEvents.results).toHaveLength(1);
  });

  it('returns conflict and cancels the order when stock reservation fails', async () => {
    const updateOrderStatus = vi.fn().mockResolvedValue({});
    const reserveStock = vi.fn().mockResolvedValue({ success: false });
    const order = { id: 'order-reserve-fail', paymentMethod: 'wompi', lines: [{ productId: 'prod-1', quantity: 1 }], toJSON: () => ({ id: 'order-reserve-fail' }) };
    const zone = { id: 'zone-1', isActive: true, priceInCents: 500, allowsCashOnDelivery: true };
    const product = { id: 'prod-1', name: 'Test product', sku: 'SKU1', status: 'published', priceInCents: 1000, stockQuantity: 2, salePolicy: { allowsCashOnDelivery: false, shippingScope: 'national', localCoverageZones: [] } };
    const orders = { createOrder: vi.fn().mockResolvedValue(order), updateOrderStatus, evaluateCheckoutPolicy: vi.fn().mockResolvedValue({ canProceed: true, allowsCashOnDelivery: false, allowedPaymentMethods: ['wompi'] }) };
    const shipping = {
      getZone: vi.fn().mockResolvedValue(zone),
      checkCoverage: vi.fn().mockResolvedValue({ isCovered: true, zoneId: zone.id }),
      listActiveFreeShippingRules: vi.fn().mockResolvedValue([]),
    };
    const catalog = { listProducts: vi.fn().mockResolvedValue([product]) };
    const promotions = {
      evaluateProductDiscount: vi.fn().mockResolvedValue({ hasDiscount: false }),
      evaluateCartDiscounts: vi.fn(async (items: Array<{ productId: string; unitPriceCents: number }>) => items.map((item) => ({
        productId: item.productId, originalPriceCents: item.unitPriceCents,
        finalPriceCents: item.unitPriceCents, discountAppliedCents: 0,
      }))),
      validateCoupon: vi.fn(),
    };
    const settings = { getSettings: vi.fn().mockResolvedValue({ taxRatePercent: 0 }) };
    const app = OrdersController.createRoutes(orders as any, {} as any, shipping as any, catalog as any, {} as any, { reserveStock } as any, {} as any, settings as any, promotions as any);
    const response = await app.fetch(new Request('https://shop.test/api/v1/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'vega_cart_id=cart_123e4567-e89b-42d3-a456-426614174000' },
      body: JSON.stringify({ customerEmail: 'customer@example.test', customerName: 'Customer', customerPhone: '3000000000', paymentMethod: 'wompi', shippingZoneId: zone.id, shippingAddress: { daneCode: '11001' }, lines: [{ productId: product.id, quantity: 1, unitPriceCents: 1 }] }),
    }));
    expect(response.status).toBe(409);
    expect(reserveStock).toHaveBeenCalledOnce();
    expect(updateOrderStatus).toHaveBeenCalledWith(expect.objectContaining({ orderId: order.id, status: 'cancelled' }));
  });

  it('reserves D1 stock atomically and requires complete, unexpired order reservations', async () => {
    const repository = new D1InventoryRepository(env.DB);
    await env.DB.prepare('INSERT INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at) VALUES (?, ?, ?, ?)')
      .bind('concurrent-stock', 5, 3, new Date().toISOString()).run();
    const results = await Promise.all([
      repository.tryReserveStock('concurrent-stock', 2),
      repository.tryReserveStock('concurrent-stock', 2),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    await env.DB.prepare('INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind('active-reservation', 'reserved-order', 'item-1', 2, 'pending', new Date(Date.now() + 60000).toISOString(), new Date().toISOString()).run();
    expect(await repository.hasActiveReservation('reserved-order', [{ productId: 'item-1', quantity: 2 }])).toBe(true);
    expect(await repository.hasActiveReservation('reserved-order', [{ productId: 'item-1', quantity: 1 }])).toBe(false);
  });

  it('settles a stock consumption and its outbox exactly once under concurrent webhook retries', async () => {
    const orderId = 'inventory-idempotent-order';
    const productId = 'inventory-idempotent-product';
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at) VALUES (?, ?, ?, ?)')
      .bind(productId, 10, 2, now).run();
    await env.DB.prepare('INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind('inventory-idempotent-reservation', orderId, productId, 2, 'pending', new Date(Date.now() + 60000).toISOString(), now).run();

    const inventory = createInventoryModule(env);
    const command = { orderId, items: [{ productId, quantity: 2 }] };
    await Promise.all([
      inventory.consumeStockUseCase.execute(command),
      inventory.consumeStockUseCase.execute(command),
    ]);

    const stock = await env.DB.prepare('SELECT quantity, reserved_quantity FROM inventory_stocks WHERE product_id = ?').bind(productId).first<{ quantity: number; reserved_quantity: number }>();
    const movements = await env.DB.prepare("SELECT id FROM inventory_movements WHERE reference_id = ? AND type = 'sale'").bind(orderId).all();
    const outbox = await env.DB.prepare('SELECT id FROM inventory_outbox_events WHERE id = ?').bind(`inventory_stock_consumed_${orderId}`).all();
    const consumption = await env.DB.prepare('SELECT status FROM inventory_order_consumptions WHERE order_id = ? AND product_id = ?').bind(orderId, productId).first<{ status: string }>();

    expect(stock).toEqual({ quantity: 8, reserved_quantity: 0 });
    expect(movements.results).toHaveLength(1);
    expect(outbox.results).toHaveLength(1);
    expect(consumption?.status).toBe('completed');
  });

  it('persists the guest cart capability hash in D1 without returning it in order JSON', async () => {
    const guestCartIdHash = await hashGuestCartId('cart_123e4567-e89b-42d3-a456-426614174000');
    const order = new Order({
      id: 'guest-capability-persistence', guestCartIdHash, customerEmail: 'guest@example.test',
      customerName: 'Guest', customerPhone: '3000000000',
      shippingAddress: { department: 'Antioquia', municipality: 'Medellín', daneCode: '05001', addressLine: 'Street' },
      shippingZoneId: 'zone', shippingCostCents: 0, subtotalCents: 1000, totalCents: 1190,
      paymentMethod: 'wompi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    const repository = new D1OrderRepository(env.DB);
    await repository.save(order);
    const stored = await repository.findById(order.id);

    expect(stored?.guestCartIdHash).toBe(guestCartIdHash);
    expect(stored?.toJSON()).not.toHaveProperty('guestCartIdHash');
  });
});
