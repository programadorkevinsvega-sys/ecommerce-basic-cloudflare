import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { Env } from '../../../platform/Env.js';
import { CartGateway } from '../../gateways/cart/CartGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { isValidGuestCartId } from '../../security/GuestCartCapability.js';

export class CartController {
  public static createRoutes(cartGateway: CartGateway, identityGateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    const getOrCreateCartId = (c: any): string => {
      let cartId = getCookie(c, 'vega_cart_id');
      if (!isValidGuestCartId(cartId)) {
        cartId = `cart_${crypto.randomUUID()}`;
        setCookie(c, 'vega_cart_id', cartId, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      return cartId;
    };

    const getCustomerId = async (c: any): Promise<string | undefined> => {
      const auth = c.req.header('Authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : getCookie(c, '__Host-session');
      if (!token) return undefined;
      try {
        const session = await identityGateway.validateSession(token);
        return session?.actorType === 'customer' ? session.actorId : undefined;
      } catch {
        return undefined;
      }
    };

    // GET /api/v1/cart
    app.get('/api/v1/cart', async (c) => {
      const cartId = getOrCreateCartId(c);
      const customerId = await getCustomerId(c);
      const cart = await cartGateway.getCart(cartId, customerId);
      return c.json({ success: true, cart });
    });

    // POST /api/v1/cart/items
    app.post('/api/v1/cart/items', async (c) => {
      const cartId = getOrCreateCartId(c);
      const customerId = await getCustomerId(c);
      const body = await c.req.json();
      if (!body.productId || !body.quantity || body.quantity <= 0) {
        return c.json({ error: 'productId y quantity son requeridos' }, 400);
      }
      const cart = await cartGateway.addItem(
        cartId,
        body.productId,
        Number(body.quantity),
        Number(body.unitPriceCents || 0),
        customerId
      );
      return c.json({ success: true, cart });
    });

    // PATCH /api/v1/cart/items/:productId
    app.patch('/api/v1/cart/items/:productId', async (c) => {
      const cartId = getOrCreateCartId(c);
      const productId = c.req.param('productId');
      const body = await c.req.json();
      if (typeof body.quantity !== 'number' || body.quantity <= 0) {
        return c.json({ error: 'quantity válida es requerida' }, 400);
      }
      const cart = await cartGateway.updateItem(
        cartId,
        productId,
        body.quantity
      );
      return c.json({ success: true, cart });
    });

    // DELETE /api/v1/cart/items/:productId
    app.delete('/api/v1/cart/items/:productId', async (c) => {
      const cartId = getOrCreateCartId(c);
      const productId = c.req.param('productId');
      const cart = await cartGateway.removeItem(cartId, productId);
      return c.json({ success: true, cart });
    });

    // POST /api/v1/cart/clear
    app.post('/api/v1/cart/clear', async (c) => {
      const cartId = getOrCreateCartId(c);
      const cart = await cartGateway.clearCart(cartId);
      return c.json({ success: true, cart });
    });

    // POST /api/v1/cart/merge
    app.post('/api/v1/cart/merge', async (c) => {
      const guestCartId = getOrCreateCartId(c);
      const customerId = await getCustomerId(c);
      if (!customerId) {
        return c.json({ error: 'No autorizado' }, 401);
      }
      const cart = await cartGateway.mergeCart(guestCartId, customerId);
      return c.json({ success: true, cart });
    });

    return app;
  }
}
