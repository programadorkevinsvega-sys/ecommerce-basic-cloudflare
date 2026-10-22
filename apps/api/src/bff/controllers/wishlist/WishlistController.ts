import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { WishlistGateway } from '../../gateways/wishlist/WishlistGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CatalogGateway, CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { renderWishlistPage, WishlistPageEntry } from '../../views/account/renderWishlistPage.js';

const addItemSchema = z.object({ productId: z.string().trim().min(1).max(128) }).strict();
const publicProduct = (product: CatalogProductDto) => ({
  id: product.id, name: product.name, slug: product.slug, priceInCents: product.priceInCents,
  imageMediaId: product.mediaIds?.[0],
});

export class WishlistController {
  public static createRoutes(wishlist: WishlistGateway, identity: IdentityGateway, catalog: CatalogGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    const customerSession = async (c: any) => {
      const authorization = c.req.header('Authorization');
      const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : getCookie(c, '__Host-session');
      if (!token) return null;
      try {
        const session = await identity.validateSession(token);
        return session.actorType === 'customer' ? session : null;
      } catch { return null; }
    };
    const traceId = (c: any): string => c.get('traceContext')?.traceId || crypto.randomUUID();

    app.get('/cuenta/favoritos', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      c.header('Vary', 'Cookie');
      const session = await customerSession(c);
      if (!session) return c.redirect('/auth/login?redirect=%2Fcuenta%2Ffavoritos');
      const page = Number(c.req.query('page') || '1');
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) return c.text('Página inválida', 400);
      try {
        const result = await wishlist.list(session.actorId, page, 20);
        const lastPage = Math.max(1, Math.ceil(result.total / 20));
        if (page > lastPage) return c.redirect('/cuenta/favoritos?page=' + lastPage);
        const entries: WishlistPageEntry[] = await Promise.all(result.items.map(async (item) => {
          try {
            const product = await catalog.getProductById(item.productId);
            return { productId: item.productId, createdAt: item.createdAt, product: product.status === 'published' ? publicProduct(product) : null };
          } catch { return { productId: item.productId, createdAt: item.createdAt, product: null }; }
        }));
        return c.html(renderWishlistPage({ items: entries, total: result.total, page, pageSize: 20 }));
      } catch { return c.text('No fue posible cargar tus favoritos', 500); }
    });

    app.get('/api/v1/customer/wishlist', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      c.header('Vary', 'Cookie');
      const session = await customerSession(c);
      if (!session) return c.json({ error: 'No autorizado' }, 401);
      const page = Number(c.req.query('page') || '1');
      const pageSize = Number(c.req.query('pageSize') || '20');
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        return c.json({ error: 'Paginación inválida' }, 400);
      }
      try {
        const result = await wishlist.list(session.actorId, page, pageSize);
        return c.json({ success: true, items: result.items.map((item) => ({ id: item.id, productId: item.productId, createdAt: item.createdAt })), total: result.total, page, pageSize });
      } catch { return c.json({ error: 'No fue posible cargar tus favoritos' }, 500); }
    });

    app.post('/api/v1/customer/wishlist/items', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const session = await customerSession(c);
      if (!session) return c.json({ error: 'No autorizado' }, 401);
      let body: unknown;
      try { body = await c.req.json(); } catch { return c.json({ error: 'JSON inválido' }, 400); }
      const parsed = addItemSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
      let product: CatalogProductDto;
      try { product = await catalog.getProductById(parsed.data.productId); }
      catch { return c.json({ error: 'Producto no disponible' }, 404); }
      if (product.status !== 'published') return c.json({ error: 'Producto no disponible' }, 404);
      try {
        const result = await wishlist.add(session.actorId, product.id, traceId(c));
        return c.json({ success: true, alreadySaved: !result.created, item: { id: result.item.id, productId: result.item.productId, createdAt: result.item.createdAt } }, result.created ? 201 : 200);
      } catch { return c.json({ error: 'No fue posible guardar el favorito' }, 500); }
    });

    app.delete('/api/v1/customer/wishlist/items/:productId', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const session = await customerSession(c);
      if (!session) return c.json({ error: 'No autorizado' }, 401);
      const productId = c.req.param('productId');
      if (!productId || productId.length > 128) return c.json({ error: 'Producto inválido' }, 400);
      try {
        const removed = await wishlist.remove(session.actorId, productId, traceId(c));
        return c.json({ success: true, removed });
      } catch { return c.json({ error: 'No fue posible quitar el favorito' }, 500); }
    });
    return app;
  }
}