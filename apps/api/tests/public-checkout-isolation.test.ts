import { describe, expect, it, vi } from 'vitest';
import { OrdersController } from '../src/bff/controllers/orders/OrdersController.js';
import { getCheckoutScript } from '../src/bff/views/getCheckoutScript.js';

describe('public checkout isolation and inline data', () => {
  it('does not use draft product data while evaluating public checkout rules', async () => {
    const listProducts = vi.fn(async () => [{ id: 'draft-1', name: 'Secret unpublished product', status: 'draft', priceInCents: 1000, sku: 'hidden' } as never]);
    const evaluateCheckoutPolicy = vi.fn(async (input: unknown) => input);
    const app = OrdersController.createRoutes(
      { evaluateCheckoutPolicy } as never,
      {} as never,
      { getZone: async () => ({ id: 'zone', isActive: true, allowsCashOnDelivery: true }) } as never,
      { listProducts } as never,
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
    const output = JSON.stringify(await response.json());

    expect(response.status).toBe(200);
    expect(listProducts).toHaveBeenCalledWith({ limit: 100, status: 'published' });
    expect(output).not.toContain('Secret unpublished product');
  });

  it('escapes HTML terminators in JSON embedded inside the checkout script', () => {
    const script = getCheckoutScript('[{"productName":"</script><script>alert(1)</script>"}]', 1, 19);
    expect(script).not.toContain('</script><script>alert');
    expect(script).toContain('\\u003c/script\\u003e');
  });
});
