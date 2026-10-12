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
import { notifyCodOrderPlaced } from './notifyCodOrderPlaced.js';
import { notifyOrderStatusChanged } from './notifyOrderStatusChanged.js';
import { normalizeShippingAddress } from './normalizeShippingAddress.js';
import { extractAdminToken } from './extractAdminToken.js';

export class OrdersController {
  public static createRoutes(
    ordersGateway: OrdersGateway,
    identityGateway: IdentityGateway,
    shippingGateway: ShippingGateway,
    catalogGateway: CatalogGateway,
    realtimeGateway: RealtimeGateway,
    inventoryGateway: InventoryGateway,
    notificationsGateway: NotificationsGateway,
    settingsGateway: SettingsGateway
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

      const allProducts = await catalogGateway.listProducts({ limit: 100 });
      const productsMap = new Map(allProducts.map((p) => [p.id, p]));

      const evaluatedItems = items.map((it: { productId: string; quantity: number }) => {
        const prod = productsMap.get(it.productId);
        return {
          product: {
            productId: it.productId,
            name: prod?.name ?? 'Producto',
            allowsCashOnDelivery: prod?.salePolicy?.allowsCashOnDelivery ?? true,
            shippingScope: (prod?.salePolicy?.shippingScope as 'national' | 'local') ?? 'national',
            localCoverageZones: prod?.salePolicy?.localCoverageZones ?? [],
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
      if (!Array.isArray(body.lines) || body.lines.length === 0) {
        return c.json({ error: 'Se requiere al menos una línea de pedido' }, 400);
      }

      // Normalizar shippingAddress al esquema del dominio
      const shippingAddress = normalizeShippingAddress(body.shippingAddress);

      const auth = c.req.header('Authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : getCookie(c, 'vega_customer_token');
      let customerId: string | null = null;
      if (token) {
        try {
          const ver = await identityGateway.validateSession(token);
          if (ver?.actorType === 'customer') customerId = ver.actorId;
        } catch {}
      }

      try {
        const order = await ordersGateway.createOrder({
          customerId,
          customerEmail:    body.customerEmail,
          customerName:     body.customerName,
          customerPhone:    body.customerPhone,
          customerTaxId:    body.customerTaxId || null,
          shippingAddress,
          shippingZoneId:   body.shippingZoneId   || 'unknown',
          shippingCostCents: Number(body.shippingCostCents)  || 0,
          subtotalCents:    Number(body.subtotalCents)  || 0,
          discountCents:    Number(body.discountCents)  || 0,
          couponCode:       body.couponCode || null,
          totalCents:       Number(body.totalCents),
          paymentMethod:    body.paymentMethod,
          lines:            body.lines,
        });

        // Reservar stock para cada línea — reduce availableQuantity al instante
        if (order.lines?.length) {
          const stockItems = order.lines.map(l => ({ productId: l.productId, quantity: l.quantity }));
          await inventoryGateway.reserveStock(order.id, stockItems, 30).catch(e =>
            console.error('[orders/create] Error reserveStock:', e.message)
          );
        }

        // Si es pago contra entrega, notificar al cliente y a la empresa por email
        if (order.paymentMethod === 'cash_on_delivery') {
          await notifyCodOrderPlaced(order, notificationsGateway, settingsGateway).catch(() => {});
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al crear el pedido';
        return c.json({ error: msg }, 400);
      }
    });

    // GET /api/v1/orders/:orderId
    app.get('/api/v1/orders/:orderId', async (c) => {
      const orderId = c.req.param('orderId');
      const order = await ordersGateway.getOrder(orderId);
      if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
      return c.json({ success: true, order: order.toJSON() });
    });

    // GET /api/v1/admin/orders
    app.get('/api/v1/admin/orders', async (c) => {
      const token = extractAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const res = await identityGateway.validateSession(token);
      if (res?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

      const orders = await ordersGateway.listOrders({ limit: 100 });
      return c.json({ success: true, orders: orders.map((o) => o.toJSON()) });
    });

    // PATCH /api/v1/admin/orders/:orderId/status
    app.patch('/api/v1/admin/orders/:orderId/status', async (c) => {
      const token = extractAdminToken(c);
      if (!token) return c.json({ error: 'No autorizado' }, 401);
      const res = await identityGateway.validateSession(token);
      if (res?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);

      const orderId = c.req.param('orderId');
      const body = await c.req.json();
      const updated = await ordersGateway.updateOrderStatus({
        orderId,
        status: body.status,
        note: body.note,
        actor: res.actorId,
      });

      await notifyOrderStatusChanged(updated, body.status, body.note, notificationsGateway).catch(() => {});

      return c.json({ success: true, order: updated.toJSON() });
    });

    return app;
  }
}
