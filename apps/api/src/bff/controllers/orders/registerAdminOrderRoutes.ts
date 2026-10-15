import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { extractAdminToken } from './extractAdminToken.js';
import { notifyOrderStatusChanged } from './notifyOrderStatusChanged.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { createShipmentForEligibleOrder } from '../shipping/createShipmentForEligibleOrder.js';

export function registerAdminOrderRoutes(
  app: Hono<{ Bindings: Env }>,
  orders: OrdersGateway,
  identity: IdentityGateway,
  notifications: NotificationsGateway,
  settings: SettingsGateway,
  shipping: ShippingGateway,
): void {
  app.get('/api/v1/admin/orders', async (c) => {
    const token = extractAdminToken(c);
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const session = await identity.validateSession(token);
    if (session?.actorType !== 'admin') return c.json({ error: 'No autorizado' }, 401);
    if (!session.permissions.some((p) => p === '*' || p === 'orders:*' || p === 'orders:read')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const result = await orders.listOrders({ limit: 100 });
    return c.json({ success: true, orders: result.map((order) => order.toJSON()) });
  });

  app.patch('/api/v1/admin/orders/:orderId/status', async (c) => {
    const token = extractAdminToken(c);
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const session = await identity.validateSession(token);
    if (session?.actorType !== 'admin') return c.json({ error: 'No autorizado' }, 401);
    if (!session.permissions.some((p) => p === '*' || p === 'orders:*' || p === 'orders:edit')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const body = await c.req.json();
    const previous = await orders.getOrder(c.req.param('orderId'));
    const updated = await orders.updateOrderStatus({
      orderId: c.req.param('orderId'), status: body.status, note: body.note, actor: session.actorId,
    });
    if (previous?.paymentMethod === 'cash_on_delivery' && ['confirmed', 'prepared'].includes(updated.status) &&
        !['confirmed', 'prepared', 'shipped', 'delivered'].includes(previous.status)) {
      try { await createShipmentForEligibleOrder(updated.id, { orders, settings, shipping, notifications }); }
      catch (error) { console.error(JSON.stringify({ event: 'shipping.auto_guide_creation_failed',
        error_name: error instanceof Error ? error.name : 'UnknownError' })); }
    }
    const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown';
    await notifyOrderStatusChanged(updated, body.status, body.note, notifications, traceId);
    return c.json({ success: true, order: updated.toJSON() });
  });
}
