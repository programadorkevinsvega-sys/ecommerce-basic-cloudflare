import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { WishlistController } from '../src/bff/controllers/wishlist/WishlistController.js';
import { WishlistGateway } from '../src/bff/gateways/wishlist/WishlistGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { CatalogGateway } from '../src/bff/gateways/catalog/CatalogGateway.js';

function setup() {
  const added: Array<{ customerId: string; productId: string }> = [];
  const removed: Array<{ customerId: string; productId: string }> = [];
  const identity = { async validateSession(token: string) { if (token === 'customer-a-token') return { actorId: 'customer-a', actorType: 'customer', permissions: [] }; if (token === 'admin-token') return { actorId: 'admin-a', actorType: 'admin', permissions: ['*'] }; throw new Error('invalid session'); } } as unknown as IdentityGateway;
  const wishlist = {
    async add(customerId: string, productId: string) { added.push({ customerId, productId }); return { created: true, item: { id: 'item-a', customerId, productId, createdAt: '2026-10-22T00:00:00.000Z' } }; },
    async list(customerId: string) { return { items: [{ id: 'item-a', customerId, productId: 'product-a', createdAt: '2026-10-22T00:00:00.000Z' }], total: 1 }; },
    async remove(customerId: string, productId: string) { removed.push({ customerId, productId }); return customerId === 'customer-a'; },
  } as unknown as WishlistGateway;
  const catalog = { getProductById: vi.fn(async (id: string) => ({ id, status: 'published' })) } as unknown as CatalogGateway;
  const app = new Hono();
  app.route('/', WishlistController.createRoutes(wishlist, identity, catalog));
  return { app, added, removed, catalog };
}

describe('Wishlist HTTP security', () => {
  it('requires a customer session and rejects administrative sessions', async () => {
    const { app } = setup();
    expect((await app.request('/api/v1/customer/wishlist')).status).toBe(401);
    const admin = await app.request('/api/v1/customer/wishlist', { headers: { Cookie: '__Host-session=admin-token' } });
    expect(admin.status).toBe(401);
  });

  it('derives ownership from the session and rejects a forged customerId', async () => {
    const { app, added, catalog } = setup();
    const forged = await app.request('/api/v1/customer/wishlist/items', { method: 'POST', headers: { Cookie: '__Host-session=customer-a-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: 'customer-b', productId: 'product-a' }) });
    expect(forged.status).toBe(400);
    expect(added).toHaveLength(0);
    const valid = await app.request('/api/v1/customer/wishlist/items', { method: 'POST', headers: { Cookie: '__Host-session=customer-a-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: 'product-a' }) });
    expect(valid.status).toBe(201);
    expect(added).toEqual([{ customerId: 'customer-a', productId: 'product-a' }]);
    const listed = await app.request('/api/v1/customer/wishlist', { headers: { Cookie: '__Host-session=customer-a-token' } });
    const body = await listed.json() as { items: Array<Record<string, unknown>> };
    expect(body.items[0]).not.toHaveProperty('customerId');
    expect(catalog.getProductById).toHaveBeenCalledWith('product-a');
  });

  it('deletes for the session owner only', async () => {
    const { app, removed } = setup();
    const response = await app.request('/api/v1/customer/wishlist/items/product-a', { method: 'DELETE', headers: { Cookie: '__Host-session=customer-a-token' } });
    expect(response.status).toBe(200);
    expect(removed).toEqual([{ customerId: 'customer-a', productId: 'product-a' }]);
  });
});