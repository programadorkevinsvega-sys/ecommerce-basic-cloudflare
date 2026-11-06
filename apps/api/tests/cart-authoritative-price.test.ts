import { describe, expect, it, vi } from 'vitest';
import { CartController } from '../src/bff/controllers/cart/CartController.js';
import { CartGateway } from '../src/bff/gateways/cart/CartGateway.js';
import { CatalogGateway } from '../src/bff/gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';

describe('cart price source', () => {
  it('ignores a browser supplied price and stores the current published catalog price', async () => {
    const addItem = vi.fn().mockResolvedValue({ items: [], subtotalCents: 0 });
    const cart = { getCart: vi.fn().mockResolvedValue({ items: [] }), addItem } as unknown as CartGateway;
    const catalog = { getProductById: vi.fn().mockResolvedValue({ id: 'product-1', status: 'published', priceInCents: 259900 }) } as unknown as CatalogGateway;
    const identity = {} as IdentityGateway;
    const app = CartController.createRoutes(cart, identity, catalog);
    const response = await app.request('/api/v1/cart/items', {
      method: 'POST',
      headers: { cookie: 'vega_cart_id=cart_01234567-89ab-4cde-8abc-0123456789ab', 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'product-1', quantity: 1, unitPriceCents: 1 }),
    });

    expect(response.status).toBe(200);
    expect(addItem.mock.calls[0]?.[3]).toBe(259900);
  });

  it('does not allow a draft product into a public cart', async () => {
    const addItem = vi.fn();
    const cart = { addItem } as unknown as CartGateway;
    const catalog = { getProductById: vi.fn().mockResolvedValue({ id: 'draft', status: 'draft', priceInCents: 100 }) } as unknown as CatalogGateway;
    const app = CartController.createRoutes(cart, {} as IdentityGateway, catalog);
    const response = await app.request('/api/v1/cart/items', {
      method: 'POST',
      headers: { cookie: 'vega_cart_id=cart_01234567-89ab-4cde-8abc-0123456789ab', 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'draft', quantity: 1, unitPriceCents: 1 }),
    });
    expect(response.status).toBe(404);
    expect(addItem).not.toHaveBeenCalled();
  });
});
