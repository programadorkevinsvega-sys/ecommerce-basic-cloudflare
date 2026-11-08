import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { renderProductRows } from '../../views/admin/renderProductTable.js';

export function registerAdminProductListRoute(router: Hono, catalog: CatalogGateway, identity: IdentityGateway): void {
  router.get('/admin/products/:id', createAuthMiddleware(identity, 'admin', 'catalog:read'), async (c) => {
    return c.json({ success: true, product: await catalog.getProductById(c.req.param('id')) });
  });
  router.get('/admin/products', createAuthMiddleware(identity, 'admin', 'catalog:read'), async (c) => {
    const page = Number(c.req.query('page') || 1), pageSize = Number(c.req.query('pageSize') || 25);
    const status = c.req.query('status') || undefined, query = (c.req.query('q') || '').trim();
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50 ||
        status && !['published', 'draft', 'archived'].includes(status) || query.length > 120) return c.json({ error: 'Filtros o paginación inválidos' }, 400);
    const [products, total] = await Promise.all([
      catalog.listAdminProducts({ limit: pageSize, offset: (page - 1) * pageSize, status, query: query || undefined }),
      catalog.countProducts(status, query || undefined),
    ]);
    const items = products.slice(0, pageSize);
    return c.json({ success: true, items, rowsHtml: renderProductRows(items), page, pageSize, total, hasMore: page * pageSize < total });
  });
}
