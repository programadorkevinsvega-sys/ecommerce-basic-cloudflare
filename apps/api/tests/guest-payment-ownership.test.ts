import { describe, expect, it, vi } from 'vitest';
import { PaymentsController } from '../src/bff/controllers/payments/PaymentsController.js';
import { hashGuestCartId } from '../src/bff/security/GuestCartCapability.js';
import { Env } from '../src/platform/Env.js';

describe('guest payment ownership', () => {
  it('rejects payment initialization with only the order id and accepts the matching cart cookie', async () => {
    const cartId = 'cart_123e4567-e89b-42d3-a456-426614174000';
    const order = {
      id: 'ord-guest-payment', customerId: null, guestCartIdHash: await hashGuestCartId(cartId),
      status: 'placed', paymentStatus: 'pending', totalCents: 1290,
      customerEmail: 'buyer@example.com', customerName: 'Buyer', customerPhone: '3000000000',
      shippingAddress: { department: 'Antioquia', municipality: 'Medellín', addressLine: 'Street' },
      lines: [{ productId: 'product-1', quantity: 1 }],
    };
    const orders = { getOrder: vi.fn().mockResolvedValue(order) };
    const payments = { createWompiTransaction: vi.fn().mockResolvedValue({ reference: 'ORDER-ord-guest-payment', signature: 'signature' }) };
    const inventory = { hasActiveReservation: vi.fn().mockResolvedValue(true) };
    const app = PaymentsController.createRoutes(
      payments as any, orders as any, {} as any, {} as any, inventory as any,
      {} as any, {} as any, {} as any, {} as any,
    );
    const env = { WOMPI_PUBLIC_KEY: 'pub_test_key', WOMPI_INTEGRITY_SECRET: 'local-test-secret' } as unknown as Env;
    const request = (cookie?: string) => app.request('/api/v1/payments/wompi/init', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ orderId: order.id }),
    }, env);

    expect((await request()).status).toBe(404);
    expect(payments.createWompiTransaction).not.toHaveBeenCalled();
    expect((await request(`vega_cart_id=${cartId}`)).status).toBe(200);
    expect(payments.createWompiTransaction).toHaveBeenCalledOnce();
  });
});
