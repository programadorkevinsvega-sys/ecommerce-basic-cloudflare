import { describe, expect, it, vi } from 'vitest';
import { InventoryController } from '../src/bff/controllers/inventory/InventoryController.js';

describe('inventory admin read/write permissions', () => {
  it('keeps GET read-only and requires inventory:adjust plus audit for catalog synchronization', async () => {
    const listAdminInventory = vi.fn().mockResolvedValue({
      items: [], page: 1, pageSize: 25, total: 0, hasMore: false,
      summary: { skuCount: 0, availableUnits: 0, reservedUnits: 0, lowStockCount: 0, outOfStockCount: 0 },
    });
    const hasStock = vi.fn().mockResolvedValue(false);
    const adjust = vi.fn().mockResolvedValue({ productId: 'p1', quantity: 8, reservedQuantity: 0, availableQuantity: 8 });
    const audit = vi.fn().mockResolvedValue({ id: 'audit-1' });
    const catalog = { listProducts: vi.fn().mockResolvedValue([{ id: 'p1', stockQuantity: 8 }]) };
    let permissions = ['inventory:read'];
    const identity = { validateSession: vi.fn(async () => ({ actorId: 'admin-1', actorType: 'admin', mfaEnabled: true, permissions })) };
    const inventory = { listAdminInventory, hasStock, adjustStock: adjust };
    const app = InventoryController.createRoutes(inventory as any, identity as any, catalog as any, { record: audit } as any);
    const session = { cookie: '__Host-admin-session=valid' };

    expect((await app.request('/api/v1/admin/inventory')).status).toBe(401);
    const read = await app.request('/api/v1/admin/inventory', { headers: session });
    expect(read.status).toBe(200);
    expect(listAdminInventory).toHaveBeenCalledWith({ page: 1, pageSize: 25, query: undefined, level: undefined });
    expect(adjust).not.toHaveBeenCalled();
    expect(catalog.listProducts).not.toHaveBeenCalled();

    const denied = await app.request('/api/v1/admin/inventory/sync', {
      method: 'POST', headers: { ...session, 'content-type': 'application/json' },
      body: JSON.stringify({ page: 1, pageSize: 25 }),
    });
    expect(denied.status).toBe(403);
    expect(adjust).not.toHaveBeenCalled();

    permissions = ['inventory:adjust'];
    const synced = await app.request('/api/v1/admin/inventory/sync', {
      method: 'POST', headers: { ...session, 'content-type': 'application/json' },
      body: JSON.stringify({ page: 1, pageSize: 25 }),
    });
    expect(synced.status).toBe(200);
    expect(hasStock).toHaveBeenCalledWith('p1');
    expect(adjust).toHaveBeenCalledWith('p1', 8, 'catalog_sync');
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'admin-1', action: 'inventory.catalog_stock_initialized', entityId: 'p1', changes: { quantity: 8 },
    }));
  });

  it('does not overwrite an existing inventory stock during catalog bootstrap sync', async () => {
    const hasStock = vi.fn().mockResolvedValue(true);
    const adjust = vi.fn();
    const catalog = { listProducts: vi.fn().mockResolvedValue([{ id: 'p1', stockQuantity: 20 }]) };
    const identity = { validateSession: vi.fn(async () => ({
      actorId: 'admin-1', actorType: 'admin', mfaEnabled: true, permissions: ['inventory:adjust'],
    })) };
    const app = InventoryController.createRoutes(
      { hasStock, adjustStock: adjust } as any,
      identity as any,
      catalog as any,
      { record: vi.fn() } as any,
    );
    const response = await app.request('/api/v1/admin/inventory/sync', {
      method: 'POST',
      headers: { cookie: '__Host-admin-session=valid', 'content-type': 'application/json' },
      body: JSON.stringify({ page: 1, pageSize: 25 }),
    });

    expect(response.status).toBe(200);
    expect(hasStock).toHaveBeenCalledWith('p1');
    expect(adjust).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ success: true, createdCount: 0, page: 1, pageSize: 25, hasMore: false });
  });
});
