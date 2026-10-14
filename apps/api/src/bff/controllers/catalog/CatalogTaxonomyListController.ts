import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class CatalogTaxonomyListController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway): Hono {
    const router = new Hono();
    const route = (path: string, key: string, list: (query: { limit: number; offset: number; includeInactive: boolean }) => Promise<unknown[]>) => {
      router.get(path, createAuthMiddleware(identity, 'admin', 'catalog:read'), async (c) => {
        const page = Number(c.req.query('page') || '1');
        if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) return c.json({ error: 'Página inválida' }, 400);
        const pageSize = 10;
        const records = await list({ limit: pageSize + 1, offset: (page - 1) * pageSize, includeInactive: true });
        return c.json({ success: true, page, pageSize, hasMore: records.length > pageSize, [key]: records.slice(0, pageSize) });
      });
    };
    route('/admin/categories', 'data', (query) => catalog.listCategories(query));
    route('/admin/brands', 'data', (query) => catalog.listBrands(query));
    route('/admin/attributes', 'data', (query) => catalog.listAttributes(query));
    route('/admin/suppliers', 'data', (query) => catalog.listSuppliers(query));
    route('/admin/product-variants', 'data', (query) => catalog.listProductVariants(query));
    return router;
  }
}
