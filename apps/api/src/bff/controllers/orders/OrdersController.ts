import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { extractSessionToken } from '../../security/extractSessionToken.js';
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
import { isAdminMfaPending } from '../../middleware/AuthMiddleware.js';

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
    app.post('/api/v1/orders/checkout/evaluate', bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
      const parsed = checkoutEvaluationSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Datos de checkout inválidos' }, 400);
      const { destinationZoneId, items } = parsed.data;

      const zone = await shippingGateway.getZone(destinationZoneId);
      const isDestinationCovered = !!zone && zone.isActive;
      const nationalCarrierAvailable = zone?.type === 'national' && await shippingGateway.getCarrierAvailability();
      if (zone?.type === 'national' && !nationalCarrierAvailable) {
        return c.json({ error: 'MiPaquete no está disponible para cotizar este destino en este momento.' }, 503);
      }
      const zoneAllowsCod = !!zone && (zone.type === 'national' ? nationalCarrierAvailable : zone.allowsCashOnDelivery);

      const products = await catalogGateway.getProductsByIds([...new Set(items.map((item) => item.productId))]);
      const productsMap = new Map(products.filter((product) => product.status === 'published').map((product) => [product.id, product]));
      if (items.some((item) => !productsMap.has(item.productId))) {
        return c.json({ error: 'Hay productos no disponibles en el carrito' }, 400);
      }

      const evaluatedItems = [];
      const pricingInputs = [];
      for (const item of items) {
        const product = productsMap.get(item.productId);
        if (!product) return c.json({ error: 'Hay productos no disponibles en el carrito' }, 400);
        evaluatedItems.push({
          product: {
            productId: product.id,
            name: product.name,
            allowsCashOnDelivery: product.salePolicy.allowsCashOnDelivery,
            shippingScope: product.salePolicy.shippingScope,
            localCoverageZones: product.salePolicy.localCoverageZones,
            allowedPaymentMethods: product.allowedPaymentMethods ?? ['wompi', 'cash_on_delivery'],
          },
          quantity: item.quantity,
        });
        pricingInputs.push({
          productId: product.id,
          categoryIds: product.categoryIds,
          unitPriceCents: product.priceInCents,
          quantity: item.quantity,
        });
      }

      const result = await ordersGateway.evaluateCheckoutPolicy({
        destinationZoneId,
        zoneAllowsCod,
        isDestinationCovered,
        items: evaluatedItems,
      });
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
      const orderId = c.req.param('orderId');
      const token = extractSessionToken(c.req.raw, ['__Host-admin-session', '__Host-session'], c.env?.ENVIRONMENT);
      if (!token) return c.json({ error: 'Pedido no encontrado' }, 404);
      let session;
      try { session = await identityGateway.validateSession(token); }
      catch { return c.json({ error: 'Pedido no encontrado' }, 404); }
      if (isAdminMfaPending(session)) return c.json({ error: 'MFA obligatorio: completa el enrolamiento antes de usar el panel' }, 403);
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

    registerAdminOrderRoutes(app, ordersGateway, identityGateway, notificationsGateway, settingsGateway, shippingGateway, promotionsGateway);

    return app;
  }
}

const checkoutEvaluationSchema = z.object({
  destinationZoneId: z.string().trim().min(1).max(128),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(128),
    quantity: z.number().int().min(1).max(99),
  }).strict()).min(1).max(50),
}).strict();
