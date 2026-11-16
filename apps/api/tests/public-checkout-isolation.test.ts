import { describe, expect, it, vi } from 'vitest';
import { OrdersController } from '../src/bff/controllers/orders/OrdersController.js';
import { getCheckoutScript } from '../src/bff/views/getCheckoutScript.js';

describe('public checkout isolation and inline data', () => {
  it('loads the requested products directly and rejects unpublished products', async () => {
    const getProductsByIds = vi.fn(async () => [{ id: 'draft-1', name: 'Secret unpublished product', status: 'draft', priceInCents: 1000, sku: 'hidden' } as never]);
    const evaluateCheckoutPolicy = vi.fn(async (input: unknown) => input);
    const app = OrdersController.createRoutes(
      { evaluateCheckoutPolicy } as never,
      {} as never,
      { getZone: async () => ({ id: 'zone', isActive: true, allowsCashOnDelivery: true }) } as never,
      { getProductsByIds } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { evaluateCartDiscounts: vi.fn(async () => []) } as never,
    );
    const response = await app.request('/api/v1/orders/checkout/evaluate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ destinationZoneId: 'zone', items: [{ productId: 'draft-1', quantity: 1 }] }),
    });

    expect(response.status).toBe(400);
    expect(getProductsByIds).toHaveBeenCalledWith(['draft-1']);
    expect(evaluateCheckoutPolicy).not.toHaveBeenCalled();
  });

  it('rejects malformed, oversized, and unknown checkout-evaluation input before catalog access', async () => {
    const getProductsByIds = vi.fn();
    const app = OrdersController.createRoutes(
      {} as never, {} as never, {} as never, { getProductsByIds } as never,
      {} as never, {} as never, {} as never, {} as never, {} as never,
    );
    const send = (body: string) => app.request('/api/v1/orders/checkout/evaluate', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body,
    });

    expect((await send('{')).status).toBe(400);
    expect((await send(JSON.stringify({ destinationZoneId: 'z', items: [{ productId: 'p', quantity: 1, price: 1 }] }))).status).toBe(400);
    expect((await send(JSON.stringify({ destinationZoneId: 'z', items: Array.from({ length: 51 }, () => ({ productId: 'p', quantity: 1 })) }))).status).toBe(400);
    expect(getProductsByIds).not.toHaveBeenCalled();
  });

  it('blocks national checkout evaluation when MiPaquete is unavailable', async () => {
    const getProductsByIds = vi.fn();
    const app = OrdersController.createRoutes(
      {} as never, {} as never,
      { getZone: async () => ({ id: 'national', type: 'national', isActive: true }),
        getCarrierAvailability: async () => false } as never,
      { getProductsByIds } as never, {} as never, {} as never, {} as never, {} as never, {} as never,
    );
    const response = await app.request('/api/v1/orders/checkout/evaluate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ destinationZoneId: 'national', items: [{ productId: 'phone', quantity: 1 }] }),
    });

    expect(response.status).toBe(503);
    expect(getProductsByIds).not.toHaveBeenCalled();
  });

  it('escapes HTML terminators in JSON embedded inside the checkout script', () => {
    const script = getCheckoutScript('[{"productName":"</script><script>alert(1)</script>"}]', 1, 19);
    expect(script).not.toContain('</script><script>alert');
    expect(script).toContain('\\u003c/script\\u003e');
  });

  it('renders syntactically valid checkout JavaScript', () => {
    const markup = getCheckoutScript('[]', 0, 0);
    const javascript = markup.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
    expect(() => new Function(javascript)).not.toThrow();
  });
});
