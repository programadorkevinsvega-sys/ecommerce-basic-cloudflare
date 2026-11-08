import { describe, expect, it } from 'vitest';
import { renderAdminDashboardScript } from '../src/bff/views/admin/renderAdminDashboardScript.js';
import { renderProductRows } from '../src/bff/views/admin/renderProductTable.js';
import { ProductAdminListItem } from '../src/modules/catalog/domain/ports/ProductAdminListItem.js';

const item: ProductAdminListItem = {
  id: 'product-1', name: 'Producto', slug: 'producto', priceInCents: 5000,
  sku: 'SKU-1', stockQuantity: 3, status: 'draft', brand: 'Marca',
  allowsCashOnDelivery: true, imageMediaId: 'media-1',
};

describe('admin product compact list', () => {
  it('renders rows from the compact DTO without requiring hydrated relations', () => {
    const html = renderProductRows([item]);
    expect(html).toContain('Producto');
    expect(html).toContain('/media/media-1');
    expect(html).toContain('SKU-1');
  });

  it('loads the full product only for editing and keeps the rendered script valid', () => {
    const script = renderAdminDashboardScript();
    expect(() => new Function(script)).not.toThrow();
    expect(script).toContain('/api/v1/admin/products/');
    expect(script).toContain('No se pudo cargar el producto.');
  });
});
