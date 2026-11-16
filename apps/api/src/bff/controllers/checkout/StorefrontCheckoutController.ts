import { Hono } from 'hono';
import { extractSessionToken } from '../../security/extractSessionToken.js';
import { Env } from '../../../platform/Env.js';
import { CartGateway } from '../../gateways/cart/CartGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCartPage } from '../../views/renderCartPage.js';
import { renderCheckoutPage } from '../../views/renderCheckoutPage.js';
import { renderCheckoutResultPage } from '../../views/renderCheckoutResultPage.js';
import { getCustomerActorId, getCustomerEmail, getStorefrontNavMenus } from '../storefront/StorefrontNavigationHelper.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { getPageMarketingContent } from '../storefront/StorefrontPageMarketing.js';
import { GuestCartCapabilityConfigurationError, hashGuestCartId } from '../../security/GuestCartCapability.js';
import { resolveGuestCartCookie } from '../../security/resolveGuestCartCookie.js';
import { resolveCartDiscounts } from '../storefront/StorefrontDiscountResolver.js';
import { getProductsForCart } from './getProductsForCart.js';

export class StorefrontCheckoutController {
  public static createRoutes(
    cartGateway: CartGateway,
    catalogGateway: CatalogGateway,
    shippingGateway: ShippingGateway,
    ordersGateway: OrdersGateway,
    cmsGateway: CmsGateway,
    identityGateway: IdentityGateway,
    settingsGateway: SettingsGateway,
    storefrontGateway: StorefrontGateway,
    promotionsGateway?: PromotionsGateway
  ): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();
    const cartIds = new WeakMap<object, string>();
    router.use('*', async (c, next) => {
      try {
        cartIds.set(c, await resolveGuestCartCookie(c));
      } catch (error) {
        if (error instanceof GuestCartCapabilityConfigurationError) {
          return c.text('El carrito no está disponible temporalmente.', 503);
        }
        throw error;
      }
      return next();
    });
    const getCartId = (c: object): string => {
      const cartId = cartIds.get(c);
      if (!cartId) throw new Error('Guest cart capability middleware was not applied');
      return cartId;
    };

    // GET /carrito
    router.get('/carrito', async (c) => {
      const cartId = getCartId(c);
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const [cart, nav] = await Promise.all([
        cartGateway.getCart(cartId),
        getStorefrontNavMenus(cmsGateway, settingsGateway),
      ]);

      const allProducts = await getProductsForCart(catalogGateway, cart.items.map((item) => item.productId));
      const productsMap = new Map<string, (typeof allProducts)[number]>();
      allProducts.forEach((p) => productsMap.set(p.id, p));

      const discounts = promotionsGateway ? await resolveCartDiscounts(cart.items, productsMap, promotionsGateway) : new Map();
      const bodyHtml = renderCartPage(cart, productsMap, discounts);
      const html = renderBaseLayout({
        title: 'Tu Carrito de Compras',
        description: 'Revisa y modifica los productos agregados a tu carrito de compras.',
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      });

      return c.html(html, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // GET /checkout
    router.get('/checkout', async (c) => {
      const cartId = getCartId(c);
      const customerId = await getCustomerActorId(c, identityGateway);
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const [cart, zones, nav, settings] = await Promise.all([
        cartGateway.getCart(cartId),
        shippingGateway.listZones(true),
        getStorefrontNavMenus(cmsGateway, settingsGateway),
        settingsGateway.getSettings(),
      ]);

      if (cart.items.length === 0) {
        return c.redirect('/carrito', 302);
      }

      const allProducts = await getProductsForCart(catalogGateway, cart.items.map((item) => item.productId));
      const productsMap = new Map<string, (typeof allProducts)[number]>();
      allProducts.forEach((p) => productsMap.set(p.id, p));
      const discounts = promotionsGateway ? await resolveCartDiscounts(cart.items, productsMap, promotionsGateway) : new Map();

      const taxRate = settings?.taxRatePercent ?? 19;
      const marketing = await getPageMarketingContent(storefrontGateway, 'checkout', 'Información para tu compra');
      const bodyHtml = `${marketing.bannersHtml}${renderCheckoutPage(
        cart, productsMap, zones, taxRate, nav.footerStoreProfile, discounts, !customerId, c.env.TURNSTILE_SITE_KEY,
      )}`;
      const html = renderBaseLayout({
        title: 'Checkout Seguro',
        description: 'Ingresa tus datos y selecciona tu método de pago preferido.',
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
        checkoutMode: true,
        announcementMessage: marketing.announcementMessage,
        announcementLink: marketing.announcementLink,
        announcementItems: marketing.announcementItems,
      });

      return c.html(html, 200, { 'Cache-Control': 'private, no-store', Vary: 'Cookie' });
    });

    // GET /checkout/resultado
    router.get('/checkout/resultado', async (c) => {
      const orderId = c.req.query('orderId');
      const ref = c.req.query('ref');
      const customerEmail = await getCustomerEmail(c, identityGateway);
      const nav = await getStorefrontNavMenus(cmsGateway, settingsGateway);

      if (!orderId) {
        return c.redirect('/', 302);
      }

      const order = await ordersGateway.getOrder(orderId);
      if (!order) {
        return c.redirect('/', 302);
      }

      if (order.customerId) {
        const token = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);
        if (!token) return c.redirect('/auth/login', 302);
        try {
          const session = await identityGateway.validateSession(token);
          if (session.actorType !== 'customer' || session.actorId !== order.customerId) return c.notFound();
        } catch { return c.notFound(); }
      } else {
        const cartHash = await hashGuestCartId(getCartId(c));
        if (!cartHash || !order.guestCartIdHash || cartHash !== order.guestCartIdHash) return c.notFound();
      }

      const bodyHtml = renderCheckoutResultPage(order, ref);
      const html = renderBaseLayout({
        title: 'Estado de tu Orden',
        description: 'Información y seguimiento de tu pedido en Vega Store.',
        bodyHtml,
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      });

      c.header('Cache-Control', 'private, no-store');
      return c.html(html);
    });

    return router;
  }
}
