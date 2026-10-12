import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { CartGateway } from '../../gateways/cart/CartGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCartPage } from '../../views/renderCartPage.js';
import { renderCheckoutPage } from '../../views/renderCheckoutPage.js';
import { renderCheckoutResultPage } from '../../views/renderCheckoutResultPage.js';
import { getCustomerEmail, getStorefrontNavMenus } from '../storefront/StorefrontNavigationHelper.js';

export class StorefrontCheckoutController {
  public static createRoutes(
    cartGateway: CartGateway,
    catalogGateway: CatalogGateway,
    shippingGateway: ShippingGateway,
    ordersGateway: OrdersGateway,
    cmsGateway: CmsGateway,
    identityGateway: IdentityGateway
  ): Hono {
    const router = new Hono();

    const getOrCreateCartId = (c: any): string => {
      let cartId = getCookie(c, 'vega_cart_id');
      if (!cartId) {
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

    // GET /carrito
    router.get('/carrito', async (c) => {
      const cartId = getOrCreateCartId(c);
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const [cart, nav, allProducts] = await Promise.all([
        cartGateway.getCart(cartId),
        getStorefrontNavMenus(cmsGateway),
        catalogGateway.listProducts({ limit: 100 }),
      ]);

      const productsMap = new Map();
      allProducts.forEach((p) => productsMap.set(p.id, p));

      const bodyHtml = renderCartPage(cart, productsMap);
      const html = renderBaseLayout({
        title: 'Tu Carrito de Compras',
        description: 'Revisa y modifica los productos agregados a tu carrito de compras.',
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
      });

      return c.html(html);
    });

    // GET /checkout
    router.get('/checkout', async (c) => {
      const cartId = getOrCreateCartId(c);
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const [cart, zones, nav, allProducts] = await Promise.all([
        cartGateway.getCart(cartId),
        shippingGateway.listZones(true),
        getStorefrontNavMenus(cmsGateway),
        catalogGateway.listProducts({ limit: 100 }),
      ]);

      if (cart.items.length === 0) {
        return c.redirect('/carrito', 302);
      }

      const productsMap = new Map();
      allProducts.forEach((p) => productsMap.set(p.id, p));

      const bodyHtml = renderCheckoutPage(cart, productsMap, zones);
      const html = renderBaseLayout({
        title: 'Checkout Seguro',
        description: 'Ingresa tus datos y selecciona tu método de pago preferido.',
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
      });

      return c.html(html);
    });

    // GET /checkout/resultado
    router.get('/checkout/resultado', async (c) => {
      const orderId = c.req.query('orderId');
      const ref = c.req.query('ref');
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const nav = await getStorefrontNavMenus(cmsGateway);

      if (!orderId) {
        return c.redirect('/', 302);
      }

      const order = await ordersGateway.getOrder(orderId);
      if (!order) {
        return c.redirect('/', 302);
      }

      const bodyHtml = renderCheckoutResultPage(order, ref);
      const html = renderBaseLayout({
        title: 'Estado de tu Orden',
        description: 'Información y seguimiento de tu pedido en Vega Store.',
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
      });

      return c.html(html);
    });

    return router;
  }
}
