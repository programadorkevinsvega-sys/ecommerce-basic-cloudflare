import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { registerOrderCreationRoute } from '../src/bff/controllers/orders/registerOrderCreationRoute.js';
import { Env } from '../src/platform/Env.js';

describe('checkout con cuenta de cliente', () => {
  it('rechaza checkout autenticado mientras el correo no esté verificado', async () => {
    const identity = {
      validateSession: vi.fn().mockResolvedValue({
        actorId: 'customer-1', actorType: 'customer', permissions: [], emailVerified: false,
      }),
    };
    const app = new Hono<{ Bindings: Env }>();
    registerOrderCreationRoute(app, {
      orders: {} as never, identity: identity as never, shipping: {} as never,
      catalog: {} as never, realtime: {} as never, inventory: {} as never,
      notifications: {} as never, settings: {} as never, promotions: {} as never,
    });

    const response = await app.request('/api/v1/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: '__Host-session=customer-session' },
      body: JSON.stringify({
        customerEmail: 'buyer@example.test', customerName: 'Buyer Name', customerPhone: '3001234567',
        customerTaxId: '123456789', customerTaxIdType: 'CC', customerLegalOrganizationCode: '2',
        paymentMethod: 'wompi', lines: [{ productId: 'product-1', quantity: 1 }],
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Verifica tu correo antes de realizar una compra con tu cuenta.' });
    expect(identity.validateSession).toHaveBeenCalledWith('customer-session');
  });
});
