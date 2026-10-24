import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';

export class InventoryController {
  public static createRoutes(
    inventoryGateway: InventoryGateway,
    identityGateway: IdentityGateway,
    catalogGateway: CatalogGateway,
    auditGateway: AuditGateway
  ): Hono<{ Bindings: Env; Variables: { adminId: string } }> {
    const app = new Hono<{ Bindings: Env; Variables: { adminId: string } }>();

    // GET /api/v1/inventory/:productId (Público: disponibilidad de stock)
    app.get('/api/v1/inventory/:productId', async (c) => {
      const productId = c.req.param('productId');
      const stock = await inventoryGateway.getStock(productId);
      return c.json(stock);
    });

    // Admin Auth Middleware — acepta Bearer header O cookie __Host-admin-session
    const requireAdmin = (permission: 'inventory:read' | 'inventory:adjust') => async (c: any, next: () => Promise<void>) => {
      const auth = c.req.header('Authorization');
      let token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) {
        const cookieHeader = c.req.header('cookie') || '';
        const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
        token = match ? match[1] : null;
      }
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      try {
        const session = await identityGateway.validateSession(token);
        if (session.actorType !== 'admin') return c.json({ error: 'No autorizado' }, 403);
        if (!session.permissions.some((value) => value === '*' || value === 'inventory:*' || value === permission)) return c.json({ error: 'Permiso insuficiente' }, 403);
        c.set('adminId', session.actorId);
        await next();
      } catch {
        return c.json({ error: 'Token inválido o expirado' }, 401);
      }
    };

    // GET /api/v1/admin/inventory (Admin: listar todo el stock sincronizado con catálogo)
    app.get('/api/v1/admin/inventory', requireAdmin('inventory:read'), async (c) => {
      const parsed = inventoryPageQuery.safeParse({ page: c.req.query('page') || '1', pageSize: c.req.query('pageSize') || '25',
        q: c.req.query('q') || undefined, level: c.req.query('level') || undefined });
      if (!parsed.success) return c.json({ error: 'Filtros o paginación inválidos' }, 400);
      const result = await inventoryGateway.listAdminInventory({ page: parsed.data.page, pageSize: parsed.data.pageSize,
        query: parsed.data.q?.trim() || undefined, level: parsed.data.level });
      const products = await Promise.all(result.items.map(async (stock) => {
        try {
          const product = await catalogGateway.getProductById(stock.productId);
          return [stock.productId, { name: product.name, sku: product.sku, brand: product.brand }] as const;
        } catch { return [stock.productId, null] as const; }
      }));
      return c.json({ success: true, ...result, items: result.items.map((stock) => stock.toJSON()),
        products: Object.fromEntries(products.filter((entry) => entry[1])) });
    });

    // POST /api/v1/admin/inventory/sync — acción de escritura auditada
    app.post('/api/v1/admin/inventory/sync', requireAdmin('inventory:adjust'), async (c) => {
      const parsed = inventorySyncQuery.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Paginación inválida' }, 400);
      const { page, pageSize } = parsed.data;
      let createdCount = 0;
      const products = await catalogGateway.listProducts({ limit: pageSize + 1, offset: (page - 1) * pageSize });
      const batch = products.slice(0, pageSize);
      for (const product of batch) {
        if (!(await inventoryGateway.hasStock(product.id))) {
          const quantity = product.stockQuantity ?? 0;
          await inventoryGateway.adjustStock(product.id, quantity, 'catalog_sync');
          createdCount++;
          await auditGateway.record({
            actorId: c.get('adminId'),
            actorType: 'admin',
            action: 'inventory.catalog_stock_initialized',
            entityType: 'inventory_stock',
            entityId: product.id,
            changes: { quantity },
          });
        }
      }
      return c.json({ success: true, createdCount, page, pageSize, hasMore: products.length > pageSize });
    });

    // POST /api/v1/admin/inventory/adjust (Admin: ajustar stock manualmente)
    app.post('/api/v1/admin/inventory/adjust', requireAdmin('inventory:adjust'), async (c) => {
      const body = await c.req.json();
      const targetQuantity = body.targetQuantity ?? body.deltaQuantity;
      if (typeof body.productId !== 'string' || !body.productId || !Number.isSafeInteger(targetQuantity) || targetQuantity < 0 || targetQuantity > 100000) {
        return c.json({ error: 'productId y un targetQuantity entero entre 0 y 100.000 son requeridos' }, 400);
      }
      const updated = await inventoryGateway.adjustStock(
        body.productId,
        targetQuantity,
        typeof body.reason === 'string' ? body.reason.slice(0, 200) : 'manual_adjustment'
      );
      return c.json({ success: true, stock: updated });
    });

    return app;
  }
}

const inventoryPageQuery = z.object({ page: z.coerce.number().int().min(1).max(1_000_000), pageSize: z.coerce.number().int().min(1).max(50),
  q: z.string().max(120).optional(), level: z.enum(['low', 'out']).optional() }).strict();
const inventorySyncQuery = z.object({ page: z.number().int().min(1).max(1_000_000), pageSize: z.number().int().min(1).max(50) }).strict();
