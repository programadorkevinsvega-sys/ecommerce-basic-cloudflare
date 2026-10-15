import { Hono } from 'hono';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { hashOrderTrackingToken } from '../../security/OrderTrackingCapability.js';
import { renderOrderTrackingPage } from '../../views/renderOrderTrackingPage.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { getCustomerEmail, getStorefrontNavMenus } from '../storefront/StorefrontNavigationHelper.js';
import { z } from 'zod';

const TrackingRequest = z.object({
  orderId: z.string().min(8).max(80),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

export class OrderTrackingController {
  public static createRoutes(orders: OrdersGateway, cms: CmsGateway, identity: IdentityGateway, settings: SettingsGateway): Hono {
    const app = new Hono();
    app.get('/seguimiento-pedido', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      const [nav, customerEmail] = await Promise.all([
        getStorefrontNavMenus(cms, settings), getCustomerEmail(c, identity),
      ]);
      return c.html(renderBaseLayout({
        title: 'Seguimiento de pedidos',
        description: 'Consulta de forma segura el estado y entrega estimada de tu pedido.',
        bodyHtml: renderOrderTrackingPage(), customerEmail,
        headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      }));
    });
    app.post('/api/v1/orders/tracking', async (c) => {
      c.header('Cache-Control', 'private, no-store');
      let raw: unknown;
      try { raw = await c.req.json(); } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      const parsed = TrackingRequest.safeParse(raw);
      if (!parsed.success) {
        return c.json({ error: 'Pedido no encontrado' }, 404);
      }
      const tracking = await orders.getOrderTracking(parsed.data.orderId, await hashOrderTrackingToken(parsed.data.token));
      if (!tracking) return c.json({ error: 'Pedido no encontrado' }, 404);
      return c.json({
        success: true,
        tracking: {
          orderId: tracking.orderId,
          status: tracking.status,
          createdAt: tracking.createdAt,
          minEstimatedDays: tracking.minEstimatedDays,
          maxEstimatedDays: tracking.maxEstimatedDays,
          events: tracking.events.filter((event) => ['confirmed', 'prepared', 'shipped', 'delivered'].includes(event.status)),
        },
      });
    });
    return app;
  }
}
