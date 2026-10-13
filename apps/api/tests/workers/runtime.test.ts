import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { env, exports } from 'cloudflare:workers';
import { OrdersController } from '../../src/bff/controllers/orders/OrdersController.js';
import { D1InventoryRepository } from '../../src/modules/inventory/infrastructure/persistence/d1/repositories/D1InventoryRepository.js';
import { D1OrderRepository } from '../../src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.js';
import { Order } from '../../src/modules/orders/domain/entities/Order.js';
import { hashGuestCartId } from '../../src/bff/security/GuestCartCapability.js';

describe('Worker API security and runtime bindings', () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.split(';')) {
        if (statement.replace(/--[^\n]*/g, '').trim()) await env.DB.prepare(statement).run();
      }
    }
  });
  it('dispatches a request through the actual Worker entrypoint', async () => {
    const response = await exports.default.fetch('https://shop.test/health');
    expect(response.status).toBe(200);
  });

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
    const timestamp = Math.floor(Date.now() / 1000);
    const properties = ['transaction.id', 'transaction.reference', 'transaction.amount_in_cents', 'transaction.currency'];
    const checksumData = `${transaction.id}${transaction.reference}${transaction.amount_in_cents}${transaction.currency}${timestamp}local-test-events-secret`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(checksumData));
    const checksum = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
    const body = { event: 'transaction.updated', data: { transaction }, environment: 'test', timestamp, signature: { properties, checksum } };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: transaction }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const request = () => exports.default.fetch('https://shop.test/api/v1/webhooks/wompi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const events = await env.DB.prepare('SELECT event_id FROM payments_webhook_events WHERE event_id = ?').bind(checksum).all();
    expect(events.results).toHaveLength(1);
  });

  it('returns conflict and cancels the order when stock reservation fails', async () => {
    const updateOrderStatus = vi.fn().mockResolvedValue({});
    const reserveStock = vi.fn().mockResolvedValue({ success: false });
    const order = { id: 'order-reserve-fail', paymentMethod: 'wompi', lines: [{ productId: 'prod-1', quantity: 1 }], toJSON: () => ({ id: 'order-reserve-fail' }) };
    const zone = { id: 'zone-1', isActive: true, priceInCents: 500, allowsCashOnDelivery: true };
    const product = { id: 'prod-1', name: 'Test product', sku: 'SKU1', status: 'published', priceInCents: 1000, stockQuantity: 2, salePolicy: { allowsCashOnDelivery: false, shippingScope: 'national', localCoverageZones: [] } };
    const orders = { createOrder: vi.fn().mockResolvedValue(order), updateOrderStatus, evaluateCheckoutPolicy: vi.fn().mockResolvedValue({ canProceed: true, allowsCashOnDelivery: false }) };
    const shipping = { getZone: vi.fn().mockResolvedValue(zone), checkCoverage: vi.fn().mockResolvedValue({ isCovered: true, zoneId: zone.id }) };
    const catalog = { listProducts: vi.fn().mockResolvedValue([product]) };
    const promotions = { evaluateProductDiscount: vi.fn().mockResolvedValue({ hasDiscount: false }), validateCoupon: vi.fn() };
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
