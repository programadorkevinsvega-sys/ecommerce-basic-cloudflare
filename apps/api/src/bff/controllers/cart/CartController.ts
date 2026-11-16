import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { CartGateway } from '../../gateways/cart/CartGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { GuestCartCapabilityConfigurationError } from '../../security/GuestCartCapability.js';
import { resolveGuestCartCookie } from '../../security/resolveGuestCartCookie.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { assertSingleElectronicInvoiceMode } from './assertSingleElectronicInvoiceMode.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';

export class CartController {
  public static createRoutes(cartGateway: CartGateway, identityGateway: IdentityGateway, catalogGateway: CatalogGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    const cartIds = new WeakMap<object, string>();
    const resolveCartCapability = async (c: any, next: () => Promise<void>) => {
      try {
        cartIds.set(c, await resolveGuestCartCookie(c));
      } catch (error) {
        if (error instanceof GuestCartCapabilityConfigurationError) {
          return c.json({ error: 'Carrito temporalmente no disponible' }, 503);
        }
        throw error;
      }
      await next();
    };
    app.use('/api/v1/cart', resolveCartCapability);
    app.use('/api/v1/cart/*', resolveCartCapability);
    const getCartId = (c: object): string => {
      const cartId = cartIds.get(c);
      if (!cartId) throw new Error('Guest cart capability middleware was not applied');
      return cartId;
    };

    const getCustomerId = async (c: any): Promise<string | undefined> => {
      const token = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);
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
      const cartId = getCartId(c);
      const customerId = await getCustomerId(c);
      const cart = await cartGateway.getCart(cartId, customerId);
      return c.json({ success: true, cart }, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // POST /api/v1/cart/items
    app.post('/api/v1/cart/items', bodyLimit({ maxSize: 8 * 1024 }), async (c) => {
      const cartId = getCartId(c);
      const customerId = await getCustomerId(c);
      const parsed = addCartItemSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'productId y quantity son requeridos' }, 400);
      const { productId, quantity } = parsed.data;
      let product;
      try { product = await catalogGateway.getProductById(productId); }
      catch { return c.json({ error: 'Producto no disponible' }, 404); }
      if (product.status !== 'published') return c.json({ error: 'Producto no disponible' }, 404);
      const currentCart = await cartGateway.getCart(cartId, customerId);
      if (!currentCart.items.some((item) => item.productId === productId) && currentCart.items.length >= 50) {
        return c.json({ error: 'El carrito admite hasta 50 productos diferentes' }, 409);
      }
      try { await assertSingleElectronicInvoiceMode([...currentCart.items.map((item) => item.productId), productId], catalogGateway); }
      catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No se pudo validar la modalidad de facturación' }, 409); }
      const cart = await cartGateway.addItem(
        cartId,
        productId,
        quantity,
        product.priceInCents,
        customerId
      );
      return c.json({ success: true, cart }, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // PATCH /api/v1/cart/items/:productId
    app.patch('/api/v1/cart/items/:productId', bodyLimit({ maxSize: 8 * 1024 }), async (c) => {
      const cartId = getCartId(c);
      const productId = c.req.param('productId');
      const parsed = updateCartItemSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) {
        return c.json({ error: 'quantity válida es requerida' }, 400);
      }
      const cart = await cartGateway.updateItem(
        cartId,
        productId,
        parsed.data.quantity
      );
      return c.json({ success: true, cart }, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // DELETE /api/v1/cart/items/:productId
    app.delete('/api/v1/cart/items/:productId', async (c) => {
      const cartId = getCartId(c);
      const productId = c.req.param('productId');
      const cart = await cartGateway.removeItem(cartId, productId);
      return c.json({ success: true, cart }, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // POST /api/v1/cart/clear
    app.post('/api/v1/cart/clear', async (c) => {
      const cartId = getCartId(c);
      const cart = await cartGateway.clearCart(cartId);
      return c.json({ success: true, cart }, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // POST /api/v1/cart/merge
    app.post('/api/v1/cart/merge', async (c) => {
      const guestCartId = getCartId(c);
      const customerId = await getCustomerId(c);
      if (!customerId) {
        return c.json({ error: 'No autorizado' }, 401);
      }
      const [guestCart, customerCart] = await Promise.all([
        cartGateway.getCart(guestCartId), cartGateway.getCart(guestCartId, customerId),
      ]);
      if (new Set([...guestCart.items, ...customerCart.items].map((item) => item.productId)).size > 50) {
        return c.json({ error: 'El carrito admite hasta 50 productos diferentes' }, 409);
      }
      try { await assertSingleElectronicInvoiceMode([...guestCart.items, ...customerCart.items].map((item) => item.productId), catalogGateway); }
      catch (error) { return c.json({ error: error instanceof Error ? error.message : 'No se pudo validar la modalidad de facturación' }, 409); }
      const cart = await cartGateway.mergeCart(guestCartId, customerId);
      return c.json({ success: true, cart }, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    return app;
  }
}

const addCartItemSchema = z.object({
  productId: z.string().trim().min(1).max(128),
  quantity: z.number().int().min(1).max(99),
}).strict();

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
}).strict();
