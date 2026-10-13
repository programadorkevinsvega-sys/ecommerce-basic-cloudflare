import { describe, expect, it, vi } from 'vitest';
import { InventoryController } from '../src/bff/controllers/inventory/InventoryController.js';

describe('inventory admin read/write permissions', () => {
  it('keeps GET read-only and requires inventory:adjust plus audit for catalog synchronization', async () => {
    const stocks = vi.fn().mockResolvedValue([]);
    const adjust = vi.fn().mockResolvedValue({ productId: 'p1', quantity: 8, reservedQuantity: 0, availableQuantity: 8 });
    const audit = vi.fn().mockResolvedValue({ id: 'audit-1' });
    const catalog = { listProducts: vi.fn().mockResolvedValue([{ id: 'p1', stockQuantity: 8 }]) };
    let permissions = ['inventory:read'];
    const identity = { validateSession: vi.fn(async () => ({ actorId: 'admin-1', actorType: 'admin', permissions })) };
    const inventory = { listStocks: stocks, adjustStock: adjust };
    const app = InventoryController.createRoutes(inventory as any, identity as any, catalog as any, { record: audit } as any);
    const session = { cookie: '__Host-admin-session=valid' };

    expect((await app.request('/api/v1/admin/inventory')).status).toBe(401);
    const read = await app.request('/api/v1/admin/inventory', { headers: session });
    expect(read.status).toBe(200);
    expect(adjust).not.toHaveBeenCalled();
    expect(catalog.listProducts).not.toHaveBeenCalled();

    const denied = await app.request('/api/v1/admin/inventory/sync', { method: 'POST', headers: session });
    expect(denied.status).toBe(403);
    expect(adjust).not.toHaveBeenCalled();

    permissions = ['inventory:adjust'];
    const synced = await app.request('/api/v1/admin/inventory/sync', { method: 'POST', headers: session });
    expect(synced.status).toBe(200);
    expect(adjust).toHaveBeenCalledWith('p1', 8, 'catalog_sync');
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'admin-1', action: 'inventory.catalog_stock_initialized', entityId: 'p1', changes: { quantity: 8 },
    }));
  });
});
