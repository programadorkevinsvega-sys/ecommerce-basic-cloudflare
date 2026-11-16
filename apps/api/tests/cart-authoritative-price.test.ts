import { describe, expect, it, vi } from 'vitest';
import { CartController } from '../src/bff/controllers/cart/CartController.js';
import { CartGateway } from '../src/bff/gateways/cart/CartGateway.js';
import { CatalogGateway } from '../src/bff/gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { Env } from '../src/platform/Env.js';

describe('cart price source', () => {
  it('ignores a browser supplied price and stores the current published catalog price', async () => {
    const addItem = vi.fn().mockResolvedValue({ items: [], subtotalCents: 0 });
    const cart = { getCart: vi.fn().mockResolvedValue({ items: [] }), addItem } as unknown as CartGateway;
    const catalog = { getProductById: vi.fn().mockResolvedValue({ id: 'product-1', status: 'published', priceInCents: 259900 }) } as unknown as CatalogGateway;
    const identity = {} as IdentityGateway;
    const app = CartController.createRoutes(cart, identity, catalog);
    const testEnv = { GUEST_CART_HMAC_SECRET: 'checkout-test-secret-'.padEnd(32, 'x') } as unknown as Env;
    const response = await app.request('/api/v1/cart/items', {
      method: 'POST',
      headers: { cookie: 'vega_cart_id=cart_01234567-89ab-4cde-8abc-0123456789ab', 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'product-1', quantity: 1 }),
    }, testEnv);

    expect(response.status).toBe(200);
    expect(addItem.mock.calls[0]?.[3]).toBe(259900);
    const cookies = response.headers.get('set-cookie') || '';
    expect(cookies).toContain('__Host-cart=cart_');
    expect(cookies).not.toContain('vega_cart_id=cart_');
    expect(cookies).toContain('vega_cart_id=;');
    const issuedCartId = cookies.match(/__Host-cart=(cart_[0-9a-f]{64})\./)?.[1];
    expect(issuedCartId).not.toBe('cart_01234567-89ab-4cde-8abc-0123456789ab');
    expect(addItem.mock.calls[0]?.[0]).toBe(issuedCartId);
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('Secure');
  });

  it('does not allow a draft product into a public cart', async () => {
    const addItem = vi.fn();
    const cart = { addItem } as unknown as CartGateway;
    const catalog = { getProductById: vi.fn().mockResolvedValue({ id: 'draft', status: 'draft', priceInCents: 100 }) } as unknown as CatalogGateway;
    const app = CartController.createRoutes(cart, {} as IdentityGateway, catalog);
    const testEnv = { GUEST_CART_HMAC_SECRET: 'checkout-test-secret-'.padEnd(32, 'x') } as unknown as Env;
    const response = await app.request('/api/v1/cart/items', {
      method: 'POST',
      headers: { cookie: 'vega_cart_id=cart_01234567-89ab-4cde-8abc-0123456789ab', 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'draft', quantity: 1 }),
    }, testEnv);
    expect(response.status).toBe(404);
    expect(addItem).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON and unknown cart item fields before catalog access', async () => {
    const getProductById = vi.fn();
    const app = CartController.createRoutes(
      { getCart: vi.fn(), addItem: vi.fn() } as never,
      {} as IdentityGateway,
      { getProductById } as never,
    );
    const testEnv = { GUEST_CART_HMAC_SECRET: 'checkout-test-secret-'.padEnd(32, 'x') } as unknown as Env;
    const request = (body: string) => app.request('/api/v1/cart/items', {
      method: 'POST',
      headers: { cookie: 'vega_cart_id=cart_01234567-89ab-4cde-8abc-0123456789ab', 'content-type': 'application/json' },
      body,
    }, testEnv);

    expect((await request('{')).status).toBe(400);
    expect((await request(JSON.stringify({ productId: 'product-1', quantity: 1, unitPriceCents: 1 }))).status).toBe(400);
    expect(getProductById).not.toHaveBeenCalled();
  });
});
