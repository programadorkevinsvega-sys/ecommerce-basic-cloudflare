import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { hashOrderTrackingToken } from '../../security/OrderTrackingCapability.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderOrderTrackingPage } from '../../views/renderOrderTrackingPage.js';
import { extractAdminToken } from './extractAdminToken.js';
import { getCustomerActorId, getCustomerEmail, getStorefrontNavMenus } from '../storefront/StorefrontNavigationHelper.js';

const TrackingRequest = z.object({
  orderId: z.string().min(8).max(80),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional(),
}).strict();

export class OrderTrackingController {
  public static createRoutes(orders: OrdersGateway, cms: CmsGateway, identity: IdentityGateway, settings: SettingsGateway): Hono {
    const app = new Hono();
    app.get('/seguimiento-pedido', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const [nav, customerEmail, customerId] = await Promise.all([
        getStorefrontNavMenus(cms, settings), getCustomerEmail(c, identity), getCustomerActorId(c, identity),
      ]);
      return c.html(renderBaseLayout({
        title: 'Seguimiento de pedidos',
        description: 'Consulta de forma segura el estado y entrega estimada de tu pedido.',
        bodyHtml: renderOrderTrackingPage(Boolean(customerId)), customerEmail,
        headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      }));
    });
    app.post('/api/v1/orders/tracking', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const raw = await c.req.json().catch(() => null);
      const parsed = TrackingRequest.safeParse(raw);
      if (!parsed.success) return c.json({ error: 'Pedido no encontrado' }, 404);

      const session = await this.customerSession(c, identity);
      if (session) {
        const owned = await orders.getCustomerOrderTracking(parsed.data.orderId, session.actorId);
        if (!owned) return c.json({ error: 'Pedido no encontrado' }, 404);
        return c.json({ success: true, tracking: publicTracking(owned) });
      }

      if (!parsed.data.token) return c.json({ error: 'Pedido no encontrado' }, 404);
      const guest = await orders.getOrderTracking(
        parsed.data.orderId,
        await hashOrderTrackingToken(parsed.data.token),
      );
      if (!guest) return c.json({ error: 'Pedido no encontrado' }, 404);
      return c.json({ success: true, tracking: publicTracking(guest) });
    });
    app.get('/api/v1/admin/orders/tracking', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const admin = await adminSession(c, identity);
      if (!admin) return c.json({ error: 'No autorizado' }, 401);
      if (!hasPermission(admin.permissions, 'orders:read')) return c.json({ error: 'Permiso insuficiente' }, 403);
      const page = Number(c.req.query('page') || 1);
      const pageSize = Number(c.req.query('pageSize') || 10);
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        return c.json({ error: 'Paginación inválida' }, 400);
      }
      const result = await orders.listAdminOrderTracking({
        page, pageSize, query: (c.req.query('q') || '').slice(0, 120), status: c.req.query('status'),
      });
      return c.json({ success: true, ...result, page, pageSize });
    });
    app.get('/api/v1/admin/orders/tracking/:orderId', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const admin = await adminSession(c, identity);
      if (!admin) return c.json({ error: 'No autorizado' }, 401);
      if (!hasPermission(admin.permissions, 'orders:read')) return c.json({ error: 'Permiso insuficiente' }, 403);
      const tracking = await orders.getAdminOrderTracking(c.req.param('orderId'));
      return tracking ? c.json({ success: true, tracking }) : c.json({ error: 'Pedido no encontrado' }, 404);
    });
    app.patch('/api/v1/admin/orders/tracking/:orderId/shipping', async (c) => {
      const admin = await adminSession(c, identity);
      if (!admin) return c.json({ error: 'No autorizado' }, 401);
      if (!hasPermission(admin.permissions, 'orders:edit')) return c.json({ error: 'Permiso insuficiente' }, 403);
      const parsed = shippingDetailsSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Revisa los datos de transporte' }, 400);
      const saved = await orders.saveOrderShippingDetails(c.req.param('orderId'), parsed.data);
      if (!saved) return c.json({ error: 'Pedido no encontrado' }, 404);
      const updated = await orders.getAdminOrderTracking(c.req.param('orderId'));
      if (!updated) return c.json({ error: 'Pedido no encontrado' }, 404);
      return c.json({ success: true, tracking: updated });
    });
    return app;
  }

  private static async customerSession(
    c: Context,
    identity: IdentityGateway,
  ): Promise<{ actorId: string } | null> {
    const authorization = c.req.header('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : getCookie(c, '__Host-session');
    if (!token) return null;
    try {
      const session = await identity.validateSession(token);
      return session.actorType === 'customer' ? { actorId: session.actorId } : null;
    } catch {
      return null;
    }
  }
}

const shippingDetailsSchema = z.object({
  shippingCarrier: z.string().trim().max(100).nullable(),
  shippingTrackingNumber: z.string().trim().max(120).nullable(),
  shippingTrackingUrl: z.string().trim().max(500).nullable(),
  estimatedDeliveryDate: z.string().date().nullable(),
}).strict().refine((value) => !value.shippingTrackingUrl || /^https:\/\//i.test(value.shippingTrackingUrl), {
  message: 'El enlace de seguimiento debe usar HTTPS',
});

async function adminSession(c: Context, identity: IdentityGateway) {
  const token = extractAdminToken(c);
  if (!token) return null;
  try {
    const session = await identity.validateSession(token);
    return session.actorType === 'admin' ? session : null;
  } catch { return null; }
}

function hasPermission(permissions: string[], required: string): boolean {
  const [resource, action] = required.split(':');
  return permissions.some((permission) => permission === '*' || permission === `${resource}:*` || permission === required || permission === `${resource}:${action}`);
}

type TrackingResult = NonNullable<Awaited<ReturnType<OrdersGateway['getOrderTracking']>>>;

function publicTracking(tracking: TrackingResult) {
  return {
    orderId: tracking.orderId,
    status: tracking.status,
    createdAt: tracking.createdAt,
    minEstimatedDays: tracking.minEstimatedDays,
    maxEstimatedDays: tracking.maxEstimatedDays,
    shippingCarrier: tracking.shippingCarrier,
    shippingTrackingNumber: tracking.shippingTrackingNumber,
    shippingTrackingUrl: tracking.shippingTrackingUrl,
    estimatedDeliveryDate: tracking.estimatedDeliveryDate,
    events: tracking.events.filter((event) => ['confirmed', 'prepared', 'shipped', 'delivered'].includes(event.status)),
  };
}
