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
import { notifyCodOrderPlaced } from './notifyCodOrderPlaced.js';
import { normalizeShippingAddress } from './normalizeShippingAddress.js';
import { calculateOrderPricing } from './calculateOrderPricing.js';
import { validateOrderPolicy } from './validateOrderPolicy.js';
import { hashGuestCartId } from '../../security/GuestCartCapability.js';
import { registerAdminOrderRoutes } from './registerAdminOrderRoutes.js';

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
      const zoneAllowsCod = !!zone && zone.allowsCashOnDelivery;

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

      return c.json({ success: true, policy: result });
    });

    // POST /api/v1/orders
    app.post('/api/v1/orders', async (c) => {
      let body: any;
      try { body = await c.req.json(); }
      catch { return c.json({ error: 'Body JSON inválido' }, 400); }

      // Validar campos mínimos requeridos
      if (!body.customerEmail || !body.customerName || !body.customerPhone) {
        return c.json({ error: 'customerEmail, customerName y customerPhone son requeridos' }, 400);
      }
      if (!body.paymentMethod || !['wompi', 'cash_on_delivery'].includes(body.paymentMethod)) {
        return c.json({ error: 'paymentMethod debe ser wompi o cash_on_delivery' }, 400);
      }
      if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 50) {
        return c.json({ error: 'Se requiere al menos una línea de pedido' }, 400);
      }

      const auth = c.req.header('Authorization'); const token = auth?.startsWith('Bearer ') ? auth.slice(7) : getCookie(c, '__Host-session');
      let customerId: string | null = null;
      if (token) {
        try {
          const session = await identityGateway.validateSession(token);
          if (session.actorType !== 'customer') return c.json({ error: 'No autorizado' }, 403);
          customerId = session.actorId;
        } catch { return c.json({ error: 'Sesión inválida' }, 401); }
      }
      const guestCartIdHash = customerId ? null : await hashGuestCartId(getCookie(c, 'vega_cart_id'));
      if (!customerId && !guestCartIdHash) return c.json({ error: 'Carrito invitado inválido' }, 400);

      const zone = await shippingGateway.getZone(String(body.shippingZoneId || ''));
      if (!zone?.isActive) return c.json({ error: 'Zona de envío no disponible' }, 400);
      const shippingCostCents = zone.priceInCents;
      let pricing;
      try { pricing = await calculateOrderPricing(catalogGateway, promotionsGateway, settingsGateway, body.lines, body.couponCode, customerId, shippingCostCents, body.paymentMethod); }
      catch { return c.json({ error: 'No fue posible calcular el pedido' }, 400); }

      // Normalizar shippingAddress al esquema del dominio
      const shippingAddress = normalizeShippingAddress(body.shippingAddress);
      const policyError = await validateOrderPolicy(ordersGateway, zone, pricing, body.paymentMethod, shippingAddress.daneCode, shippingGateway);
      if (policyError) return c.json({ error: policyError }, 400);

      try {
        const order = await ordersGateway.createOrder({
          customerId,
          guestCartIdHash,
          customerEmail:    body.customerEmail,
          customerName:     body.customerName,
          customerPhone:    body.customerPhone,
          customerTaxId:    body.customerTaxId || null,
          shippingAddress,
          shippingZoneId: zone.id,
          shippingCostCents,
          subtotalCents: pricing.subtotalCents,
          discountCents: pricing.discountCents,
          couponCode: pricing.couponCode,
          totalCents: pricing.totalCents,
          taxCents: pricing.taxCents,
          pricingVersion: pricing.pricingVersion,
          estimatedPaymentFeeCents: pricing.estimatedPaymentFeeCents,
          transactionFeeCents: pricing.transactionFeeCents,
          paymentMethod:    body.paymentMethod,
          lines: pricing.lines,
        });

        // Reservar stock para cada línea — reduce availableQuantity al instante
        if (order.lines?.length) {
          const stockItems = order.lines.map(l => ({ productId: l.productId, quantity: l.quantity }));
          try {
            const reservation = await inventoryGateway.reserveStock(order.id, stockItems, 30);
            if (!reservation.success) throw new Error('reservation_failed');
          } catch {
            await ordersGateway.updateOrderStatus({
              orderId: order.id,
              status: 'cancelled',
              note: 'Reserva de inventario no disponible',
              actor: 'system',
            });
            return c.json({ error: 'No fue posible reservar el inventario. Intenta nuevamente.' }, 409);
          }
        }

        // Si es pago contra entrega, notificar al cliente y a la empresa por email
        if (order.paymentMethod === 'cash_on_delivery') {
          await notifyCodOrderPlaced(order, notificationsGateway, settingsGateway, (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown');
        }

        await realtimeGateway.publishNotification({
          channel: 'admin',
          eventType: 'orders.new_order',
          title: `Nuevo Pedido #${order.id}`,
          body: `Cliente: ${order.customerName} - Total: $${(order.totalCents / 100).toLocaleString('es-CO')} COP`,
          data: {
            orderId: order.id,
            totalCents: order.totalCents,
            customerName: order.customerName,
            paymentMethod: order.paymentMethod,
          },
        });

        return c.json({ success: true, order: order.toJSON() }, 201);
      } catch {
        return c.json({ error: 'No fue posible crear el pedido' }, 400);
      }
    });

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

    registerAdminOrderRoutes(app, ordersGateway, identityGateway, notificationsGateway);

    return app;
  }
}
