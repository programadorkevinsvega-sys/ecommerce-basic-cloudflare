import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { Env } from '../../../platform/Env.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { registerAdminOrderRoutes } from './registerAdminOrderRoutes.js';
import { registerOrderCreationRoute } from './registerOrderCreationRoute.js';
import { evaluateFreeShippingRule } from './evaluateFreeShippingRule.js';

export class OrdersController {
  public static createRoutes(
    ordersGateway: OrdersGateway,
    identityGateway: IdentityGateway,
    shippingGateway: ShippingGateway,
    catalogGateway: CatalogGateway,
    realtimeGateway: RealtimeGateway,
    inventoryGateway: InventoryGateway,
    notificationsGateway: NotificationsGateway,
    settingsGateway: SettingsGateway,
    promotionsGateway: PromotionsGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // POST /api/v1/orders/checkout/evaluate
    app.post('/api/v1/orders/checkout/evaluate', async (c) => {
      const body = await c.req.json();
      const { destinationZoneId, items } = body;

      if (!destinationZoneId || !Array.isArray(items)) {
        return c.json({ error: 'destinationZoneId e items son requeridos' }, 400);
      }

      const zone = await shippingGateway.getZone(destinationZoneId);
      const isDestinationCovered = !!zone && zone.isActive;
      const nationalCarrierAvailable = zone?.type === 'national' && await shippingGateway.getCarrierAvailability();
      const zoneAllowsCod = !!zone && (zone.type === 'national' ? nationalCarrierAvailable : zone.allowsCashOnDelivery);

      const allProducts = await catalogGateway.listProducts({ limit: 100, status: 'published' });
      const productsMap = new Map(allProducts.filter((product) => product.status === 'published').map((p) => [p.id, p]));

      const evaluatedItems = items.map((it: { productId: string; quantity: number }) => {
        const prod = productsMap.get(it.productId);
        return {
          product: {
            productId: it.productId,
            name: prod?.name ?? 'Producto',
            allowsCashOnDelivery: prod?.salePolicy?.allowsCashOnDelivery ?? true,
            shippingScope: (prod?.salePolicy?.shippingScope as 'national' | 'local') ?? 'national',
            localCoverageZones: prod?.salePolicy?.localCoverageZones ?? [],
            allowedPaymentMethods: prod?.allowedPaymentMethods ?? ['wompi', 'cash_on_delivery'],
          },
          quantity: it.quantity,
        };
      });

      const result = await ordersGateway.evaluateCheckoutPolicy({
        destinationZoneId,
        zoneAllowsCod,
        isDestinationCovered,
        items: evaluatedItems,
      });
      const pricingInputs = items.map((it: { productId: string; quantity: number }) => {
        const product = productsMap.get(it.productId);
        return product ? { productId: product.id, categoryIds: product.categoryIds, unitPriceCents: product.priceInCents, quantity: it.quantity } : null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);
      const discounts = await promotionsGateway.evaluateCartDiscounts(pricingInputs);
      const discountByProduct = new Map(discounts.map((item) => [item.productId, item]));
      const subtotalCents = pricingInputs.reduce((sum, item) => sum + (discountByProduct.get(item.productId)?.finalPriceCents ?? item.unitPriceCents) * item.quantity, 0);
      const freeShippingRule = result.canProceed ? await evaluateFreeShippingRule({ catalog: catalogGateway, orders: ordersGateway,
        shipping: shippingGateway, lines: pricingInputs.map(({ productId, quantity }) => ({ productId, quantity })), subtotalCents, discountCents: 0 }) : null;
      return c.json({ success: true, policy: result, freeShippingRule });
    });

    registerOrderCreationRoute(app, { orders: ordersGateway, identity: identityGateway, shipping: shippingGateway, catalog: catalogGateway, realtime: realtimeGateway, inventory: inventoryGateway, notifications: notificationsGateway, settings: settingsGateway, promotions: promotionsGateway });

    // GET /api/v1/orders/:orderId
    app.get('/api/v1/orders/:orderId', async (c) => {
      const orderId = c.req.param('orderId'); const authHeader = c.req.header('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : getCookie(c, '__Host-session');
      if (!token) return c.json({ error: 'Pedido no encontrado' }, 404);
      let session;
      try { session = await identityGateway.validateSession(token); }
      catch { return c.json({ error: 'Pedido no encontrado' }, 404); }
      const order = await ordersGateway.getOrder(orderId); if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
      if (session.actorType === 'admin') {
        if (!session.permissions.some((p) => p === '*' || p === 'orders:*' || p === 'orders:read')) {
          return c.json({ error: 'Pedido no encontrado' }, 404);
        }
      } else if (session.actorType !== 'customer' || order.customerId !== session.actorId) {
        return c.json({ error: 'Pedido no encontrado' }, 404);
      }
      return c.json({ success: true, order: order.toJSON() });
    });

    registerAdminOrderRoutes(app, ordersGateway, identityGateway, notificationsGateway, settingsGateway, shippingGateway);

    return app;
  }
}
