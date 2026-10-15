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

type TrackingResult = NonNullable<Awaited<ReturnType<OrdersGateway['getOrderTracking']>>>;

function publicTracking(tracking: TrackingResult) {
  return {
    orderId: tracking.orderId,
    status: tracking.status,
    createdAt: tracking.createdAt,
    minEstimatedDays: tracking.minEstimatedDays,
    maxEstimatedDays: tracking.maxEstimatedDays,
    events: tracking.events.filter((event) => ['confirmed', 'prepared', 'shipped', 'delivered'].includes(event.status)),
  };
}
