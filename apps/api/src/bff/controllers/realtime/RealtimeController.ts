import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';

export class RealtimeController {
  public static createRoutes(realtimeGateway: RealtimeGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // GET /api/v1/realtime/notifications?channel=admin&since=...
    app.get('/api/v1/realtime/notifications', async (c) => {
      const channel = c.req.query('channel') || 'admin';
      const since = c.req.query('since');
      const recipientId = c.req.query('recipientId');

      const notifications = await realtimeGateway.getNotifications({
        channel,
        since,
        recipientId,
        limit: 30,
      });

      return c.json({
        success: true,
        notifications: notifications.map((n) => n.toJSON()),
        serverTime: new Date().toISOString(),
      });
    });

    // POST /api/v1/realtime/notifications/read
    app.post('/api/v1/realtime/notifications/read', async (c) => {
      const body = await c.req.json();
      if (Array.isArray(body.ids)) {
        await realtimeGateway.markNotificationsRead(body.ids);
      }
      return c.json({ success: true });
    });

    return app;
  }
}
