import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class CatalogTaxonomyListController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway): Hono {
    const router = new Hono();
    const route = (path: string, key: string, kind: 'categories' | 'brands' | 'attributes' | 'providers' | 'variants', list: (query: { limit: number; offset: number; includeInactive: boolean }) => Promise<unknown[]>) => {
      router.get(path, createAuthMiddleware(identity, 'admin', 'catalog:read'), async (c) => {
        const page = Number(c.req.query('page') || '1');
        if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) return c.json({ error: 'Página inválida' }, 400);
        const pageSize = 25;
        const [records, total] = await Promise.all([list({ limit: pageSize, offset: (page - 1) * pageSize, includeInactive: true }), catalog.countTaxonomy(kind)]);
        return c.json({ success: true, page, pageSize, total, hasMore: page * pageSize < total, [key]: records });
      });
    };
    route('/admin/categories', 'data', 'categories', (query) => catalog.listCategories(query));
    route('/admin/brands', 'data', 'brands', (query) => catalog.listBrands(query));
    route('/admin/attributes', 'data', 'attributes', (query) => catalog.listAttributes(query));
    route('/admin/suppliers', 'data', 'providers', (query) => catalog.listSuppliers(query));
    route('/admin/product-variants', 'data', 'variants', (query) => catalog.listProductVariants(query));
    return router;
  }
}
