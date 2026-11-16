import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrdersController } from '../../src/bff/controllers/orders/OrdersController.js';
import { createGuestCartCapability } from '../../src/bff/security/GuestCartCapability.js';
import { Env } from '../../src/platform/Env.js';

afterEach(() => vi.unstubAllGlobals());

describe('checkout coupon reservation compensation', () => {
  it('uses the same server-generated order ID and releases the reservation if stock fails', async () => {
    const secret = 'checkout-test-secret-'.padEnd(32, 'x');
    const capability = await createGuestCartCapability(`cart_${'c'.repeat(64)}`, secret);
    const turnstileFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: 'shop.test' }), { status: 200 }));
    vi.stubGlobal('fetch', turnstileFetch);
    const updateOrderStatus = vi.fn().mockResolvedValue({});
    const reserveStock = vi.fn().mockResolvedValue({ success: false });
    const order = {
      id: 'unused-order-id', paymentMethod: 'wompi',
      lines: [{ productId: 'prod-1', quantity: 1 }], toJSON: () => ({ id: 'unused-order-id' }),
    };
    const createOrder = vi.fn(async (input: { orderId?: string }) => ({ ...order, id: input.orderId || order.id }));
    const zone = { id: 'zone-1', isActive: true, priceInCents: 500, allowsCashOnDelivery: true };
    const product = {
      id: 'prod-1', name: 'Test product', sku: 'SKU1', status: 'published', priceInCents: 1000,
      stockQuantity: 2, salePolicy: { allowsCashOnDelivery: false, shippingScope: 'national', localCoverageZones: [] },
    };
    const orders = {
      createOrder, updateOrderStatus,
      evaluateCheckoutPolicy: vi.fn().mockResolvedValue({
        canProceed: true, allowsCashOnDelivery: false, allowedPaymentMethods: ['wompi'],
      }),
    };
    const shipping = {
      getZone: vi.fn().mockResolvedValue(zone),
      checkCoverage: vi.fn().mockResolvedValue({ isCovered: true, zoneId: zone.id }),
      listActiveFreeShippingRules: vi.fn().mockResolvedValue([]),
    };
    const catalog = { getProductsByIds: vi.fn().mockResolvedValue([product]) };
    const reserveCouponRedemption = vi.fn().mockResolvedValue(true);
    const releaseCouponRedemption = vi.fn().mockResolvedValue(undefined);
    const promotions = {
      evaluateProductDiscount: vi.fn().mockResolvedValue({ hasDiscount: false }),
      evaluateCartDiscounts: vi.fn(async (items: Array<{ productId: string; unitPriceCents: number }>) =>
        items.map((item) => ({ productId: item.productId, originalPriceCents: item.unitPriceCents,
          finalPriceCents: item.unitPriceCents, discountAppliedCents: 0 }))),
      validateCoupon: vi.fn().mockResolvedValue({ valid: true, discountAppliedCents: 100 }),
      reserveCouponRedemption, releaseCouponRedemption,
    };
    const settings = { getSettings: vi.fn().mockResolvedValue({ taxRatePercent: 0 }) };
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorType: 'customer', actorId: 'customer-1', emailVerified: true }) };
    const app = OrdersController.createRoutes(orders as any, identity as any, shipping as any, catalog as any,
      {} as any, { reserveStock } as any, {} as any, settings as any, promotions as any);
    const testEnv = {
      GUEST_CART_HMAC_SECRET: secret, TURNSTILE_SECRET_KEY: 'test-secret',
      TURNSTILE_HOSTNAMES: 'shop.test',
    } as unknown as Env;
    const request = (turnstileToken?: string, authenticated = false) => new Request('https://shop.test/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `__Host-cart=${capability}${authenticated ? '; __Host-session=test-token' : ''}`,
        'cf-connecting-ip': '192.0.2.10' },
      body: JSON.stringify({
        customerEmail: 'customer@example.test', customerName: 'Customer', customerPhone: '3000000000',
        customerTaxId: '1234567890', customerTaxIdType: 'CC', customerLegalOrganizationCode: '2',
        paymentMethod: 'wompi', shippingZoneId: zone.id, shippingAddress: { daneCode: '11001' },
        ...(turnstileToken ? { turnstileToken } : {}),
        couponCode: 'TEST', lines: [{ productId: product.id, quantity: 1, unitPriceCents: 1 }],
      }),
    });

    const missingTurnstile = await app.fetch(request(), testEnv);
    expect(missingTurnstile.status).toBe(400);
    expect(turnstileFetch).not.toHaveBeenCalled();

    const invalidTurnstile = await app.fetch(request('invalid-test-token'), testEnv);
    expect(invalidTurnstile.status).toBe(403);
    expect(createOrder).not.toHaveBeenCalled();
    expect(reserveCouponRedemption).not.toHaveBeenCalled();
    expect(reserveStock).not.toHaveBeenCalled();

    const unavailableTurnstile = await app.fetch(request('temporarily-unavailable-token'), testEnv);
    expect(unavailableTurnstile.status).toBe(503);
    expect(createOrder).not.toHaveBeenCalled();
    expect(reserveCouponRedemption).not.toHaveBeenCalled();
    expect(reserveStock).not.toHaveBeenCalled();

    const response = await app.fetch(request('valid-test-token'), testEnv);

    expect(response.status).toBe(409);
    expect(reserveStock).toHaveBeenCalledOnce();
    const orderId = reserveCouponRedemption.mock.calls[0]?.[0].orderId;
    expect(orderId).toMatch(/^ord-/);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ orderId }));
    expect(updateOrderStatus).toHaveBeenCalledWith(expect.objectContaining({ orderId, status: 'cancelled' }));
    expect(releaseCouponRedemption).toHaveBeenCalledWith(orderId);

    const customerRequest = request(undefined, true);
    const customerResponse = await app.fetch(customerRequest, testEnv);
    expect(customerResponse.status).toBe(409);
    expect(identity.validateSession).toHaveBeenCalledOnce();
    expect(turnstileFetch).toHaveBeenCalledTimes(3);
    expect(createOrder).toHaveBeenCalledTimes(2);
  });
});
