import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';

export class InventoryController {
  public static createRoutes(
    inventoryGateway: InventoryGateway,
    identityGateway: IdentityGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // GET /api/v1/inventory/:productId (Público: disponibilidad de stock)
    app.get('/api/v1/inventory/:productId', async (c) => {
      const productId = c.req.param('productId');
      const stock = await inventoryGateway.getStock(productId);
      return c.json(stock);
    });

    // Admin Auth Middleware
    const requireAdmin = async (c: any, next: () => Promise<void>) => {
      const auth = c.req.header('Authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      try {
        const session = await identityGateway.validateSession(token);
        if (session.actorType !== 'admin') return c.json({ error: 'No autorizado' }, 403);
        c.set('adminId', session.actorId);
        await next();
      } catch {
        return c.json({ error: 'Token inválido o expirado' }, 401);
      }
    };

    // GET /api/v1/admin/inventory (Admin: listar todo el stock)
    app.get('/api/v1/admin/inventory', requireAdmin, async (c) => {
      const stocks = await inventoryGateway.listStocks();
      return c.json({ success: true, items: stocks });
    });

    // POST /api/v1/admin/inventory/adjust (Admin: ajustar stock manualmente)
    app.post('/api/v1/admin/inventory/adjust', requireAdmin, async (c) => {
      const body = await c.req.json();
      if (!body.productId || typeof body.deltaQuantity !== 'number') {
        return c.json({ error: 'productId y deltaQuantity son requeridos' }, 400);
      }
      const updated = await inventoryGateway.adjustStock(
        body.productId,
        body.deltaQuantity,
        body.reason ?? 'manual_adjustment'
      );
      return c.json({ success: true, stock: updated });
    });

    return app;
  }
}
