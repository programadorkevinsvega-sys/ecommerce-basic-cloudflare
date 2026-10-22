import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { InventoryGateway, InventoryStockDto } from '../../gateways/inventory/InventoryGateway.js';
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
      const stocks = await inventoryGateway.listStocks();
      return c.json({ success: true, items: stocks });
    });

    // POST /api/v1/admin/inventory/sync — acción de escritura auditada
    app.post('/api/v1/admin/inventory/sync', requireAdmin('inventory:adjust'), async (c) => {
      let stocks = await inventoryGateway.listStocks();
      let createdCount = 0;
      const products = await catalogGateway.listProducts({ limit: 500 });
      const stockMap = new Map<string, InventoryStockDto>();
      for (const stock of stocks) stockMap.set(stock.productId, stock);

      for (const product of products) {
        if (!stockMap.has(product.id)) {
          const quantity = product.stockQuantity ?? 0;
          const created = await inventoryGateway.adjustStock(product.id, quantity, 'catalog_sync');
          stocks.push(created);
          stockMap.set(product.id, created);
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
      return c.json({ success: true, createdCount, items: stocks });
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
