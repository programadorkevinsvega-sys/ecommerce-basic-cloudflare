import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentsController } from '../src/bff/controllers/payments/PaymentsController.js';
import { createGuestCartCapability, hashGuestCartId } from '../src/bff/security/GuestCartCapability.js';
import { Env } from '../src/platform/Env.js';

const secret = 'checkout-test-secret-'.padEnd(32, 'x');
const cartId = `cart_${'b'.repeat(64)}`;

afterEach(() => vi.unstubAllGlobals());

describe('guest payment ownership', () => {
  it('rejects malformed or unknown request fields', async () => {
    const { request } = await setupPayment();
    expect((await request('{')).status).toBe(400);
    expect((await request({ orderId: 'ord-guest-payment', unexpected: true })).status).toBe(400);
  });

  it('requires both the matching cart cookie and a fresh Turnstile token', async () => {
    const { request, capability, payments } = await setupPayment();

    expect((await request({ orderId: 'ord-guest-payment', turnstileToken: 'valid-token' })).status).toBe(404);
    expect((await request({ orderId: 'ord-guest-payment' }, capability)).status).toBe(400);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(turnstileResponse(true)));
    expect((await request({ orderId: 'ord-guest-payment', turnstileToken: 'valid-token' }, capability)).status).toBe(200);
    expect(payments.createWompiTransaction).toHaveBeenCalledOnce();
  });

  it('fails closed when Turnstile rejects a token or is unavailable', async () => {
    const { request, capability, payments } = await setupPayment();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(turnstileResponse(false)));
    expect((await request({ orderId: 'ord-guest-payment', turnstileToken: 'invalid-token' }, capability)).status).toBe(403);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    expect((await request({ orderId: 'ord-guest-payment', turnstileToken: 'valid-token' }, capability)).status).toBe(503);
    expect(payments.createWompiTransaction).not.toHaveBeenCalled();
  });
});

async function setupPayment() {
  const capability = await createGuestCartCapability(cartId, secret);
  const order = {
    id: 'ord-guest-payment', customerId: null, guestCartIdHash: await hashGuestCartId(cartId),
    status: 'placed', paymentStatus: 'pending', totalCents: 1290,
    customerEmail: 'buyer@example.com', customerName: 'Buyer', customerPhone: '3000000000',
    shippingAddress: { department: 'Antioquia', municipality: 'Medellín', addressLine: 'Street' },
    lines: [{ productId: 'product-1', quantity: 1 }],
  };
  const orders = { getOrder: vi.fn().mockResolvedValue(order) };
  const payments = {
    createWompiTransaction: vi.fn().mockResolvedValue({
      reference: 'ORDER-ord-guest-payment', signature: 'signature',
    }),
  };
  const inventory = { hasActiveReservation: vi.fn().mockResolvedValue(true) };
  const app = PaymentsController.createRoutes(
    payments as any, orders as any, {} as any, {} as any, inventory as any,
    {} as any, {} as any, {} as any, {} as any, { releaseCouponRedemption: vi.fn() } as any,
  );
  const env = {
    WOMPI_PUBLIC_KEY: 'pub_test_key',
    WOMPI_INTEGRITY_SECRET: 'local-test-secret',
    GUEST_CART_HMAC_SECRET: secret,
    TURNSTILE_SECRET_KEY: 'turnstile-test-secret',
    TURNSTILE_HOSTNAMES: 'localhost',
  } as unknown as Env;
  const request = (body: string | Record<string, unknown>, cookie?: string) => app.request('/api/v1/payments/wompi/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: `__Host-cart=${cookie}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }, env);
  return { request, capability, payments };
}

function turnstileResponse(success: boolean): Response {
  return new Response(JSON.stringify({ success, hostname: 'localhost' }), { status: 200 });
}
