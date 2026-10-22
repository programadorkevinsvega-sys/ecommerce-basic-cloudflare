import { describe, expect, it, vi } from 'vitest';
import { CatalogController } from '../src/bff/controllers/catalog/CatalogController.js';

function makeCatalogController(options: {
  stockQuantity?: number;
  adjustStock?: ReturnType<typeof vi.fn>;
} = {}) {
  const currentProduct = { id: 'product-1', stockQuantity: options.stockQuantity ?? 20 };
  const catalog = {
    getProductById: vi.fn().mockResolvedValue(currentProduct),
    updateProduct: vi.fn(async (input: Record<string, unknown>) => ({ ...currentProduct, ...input })),
    createProduct: vi.fn().mockResolvedValue({ id: 'created-product', stockQuantity: 5 }),
  };
  const inventory = {
    adjustStock: options.adjustStock ?? vi.fn().mockResolvedValue({
      productId: currentProduct.id, quantity: 20, reservedQuantity: 0, availableQuantity: 20,
    }),
  };
  const identity = {
    validateSession: vi.fn().mockResolvedValue({
      actorId: 'admin-1', actorType: 'admin', mfaEnabled: true, permissions: ['catalog:create', 'catalog:edit'],
    }),
  };
  const settings = { getSettings: vi.fn().mockResolvedValue({ taxRatePercent: 19 }) };
  const shipping = { listZones: vi.fn().mockResolvedValue([]) };
  const audit = { record: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
  const app = CatalogController.createRoutes(
    catalog as never, identity as never, settings as never, audit as never, shipping as never, inventory as never,
  );
  return { app, catalog, inventory, identity, settings, shipping };
}

const headers = { Authorization: 'Bearer admin-session', 'Content-Type': 'application/json' };

describe('catalog and inventory stock synchronization', () => {
  it('does not push a stale catalog stock value into Inventory during an ordinary product edit', async () => {
    const { app, catalog, inventory } = makeCatalogController({ stockQuantity: 20 });
    const response = await app.request('/admin/products/product-1', {
      method: 'PUT', headers, body: JSON.stringify({ stockQuantity: 20, name: 'Renamed product' }),
    });

    expect(response.status).toBe(200);
    expect(inventory.adjustStock).not.toHaveBeenCalled();
    expect(catalog.updateProduct).toHaveBeenCalledOnce();
  });

  it('rejects a changed stock target unless the administrator explicitly confirms synchronization', async () => {
    const { app, catalog, inventory } = makeCatalogController({ stockQuantity: 20 });
    const response = await app.request('/admin/products/product-1', {
      method: 'PUT', headers, body: JSON.stringify({ stockQuantity: 15 }),
    });

    expect(response.status).toBe(409);
    expect(inventory.adjustStock).not.toHaveBeenCalled();
    expect(catalog.updateProduct).not.toHaveBeenCalled();
  });

  it('applies a confirmed target to Inventory before saving its catalog mirror', async () => {
    const { app, catalog, inventory } = makeCatalogController({ stockQuantity: 20 });
    const response = await app.request('/admin/products/product-1', {
      method: 'PUT', headers,
      body: JSON.stringify({ stockQuantity: 15, syncStockToInventory: true }),
    });

    expect(response.status).toBe(200);
    expect(inventory.adjustStock).toHaveBeenCalledWith('product-1', 15, 'catalog_product_stock_edit');
    const inventoryCallOrder = inventory.adjustStock.mock.invocationCallOrder[0] ?? 0;
    const catalogCallOrder = catalog.updateProduct.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER;
    expect(inventoryCallOrder).toBeLessThan(catalogCallOrder);
    expect(catalog.updateProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 'product-1', stockQuantity: 15 }));
  });

  it('does not save a catalog stock change if Inventory rejects the target due to reservations', async () => {
    const adjustStock = vi.fn().mockRejectedValue(new Error('El stock solicitado (1) no puede ser menor que las unidades reservadas (2)'));
    const { app, catalog } = makeCatalogController({ stockQuantity: 20, adjustStock });
    const response = await app.request('/admin/products/product-1', {
      method: 'PUT', headers,
      body: JSON.stringify({ stockQuantity: 1, syncStockToInventory: true }),
    });

    expect(response.status).toBe(409);
    const body = await response.json() as { error?: string };
    expect(body.error).toContain('unidades reservadas');
    expect(catalog.updateProduct).not.toHaveBeenCalled();
  });

  it('initializes Inventory when a new product is created', async () => {
    const { app, catalog, inventory } = makeCatalogController();
    const response = await app.request('/admin/products', {
      method: 'POST', headers,
      body: JSON.stringify({
        name: 'New product', slug: 'new-product', description: 'Product description',
        priceInCents: 1000, supplierCostCents: 500, allowedPaymentMethods: ['wompi'],
        sku: 'NEW-001', stockQuantity: 5,
      }),
    });

    expect(response.status).toBe(201);
    expect(catalog.createProduct).toHaveBeenCalledOnce();
    expect(inventory.adjustStock).toHaveBeenCalledWith('created-product', 5, 'catalog_product_created');
  });
});
