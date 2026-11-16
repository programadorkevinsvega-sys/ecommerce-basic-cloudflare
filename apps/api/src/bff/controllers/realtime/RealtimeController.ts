import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { isAdminMfaPending } from '../../middleware/AuthMiddleware.js';

export class RealtimeController {
  public static createRoutes(realtimeGateway: RealtimeGateway, identityGateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // GET /api/v1/realtime/notifications?channel=admin&since=...
    app.get('/api/v1/realtime/notifications', async (c) => {
      const token = extractSessionToken(c.req.raw, ['__Host-admin-session', '__Host-session'], c.env?.ENVIRONMENT);
      if (!token) return c.json({ error: 'No autenticado' }, 401);
      let session;
      try { session = await identityGateway.validateSession(token); }
      catch { return c.json({ error: 'No autenticado' }, 401); }
      if (isAdminMfaPending(session)) return c.json({ error: 'MFA obligatorio: completa el enrolamiento antes de usar el panel' }, 403);
      const isAdmin = session.actorType === 'admin';
      if (isAdmin && !hasNotificationPermission(session.permissions)) return c.json({ error: 'Permiso insuficiente' }, 403);
      if (!isAdmin && session.actorType !== 'customer') return c.json({ error: 'No autorizado' }, 403);
      const channel = isAdmin ? 'admin' : `customer:${session.actorId}`;
      const since = c.req.query('since');

      const notifications = await realtimeGateway.getNotifications({
        channel,
        since,
        recipientId: isAdmin ? undefined : session.actorId,
        limit: 30,
      });

      return c.json({
        success: true,
        notifications: notifications.map((n) => n.toJSON()),
        serverTime: new Date().toISOString(),
      });
    });

    // POST /api/v1/realtime/notifications/read
    app.post('/api/v1/realtime/notifications/read', bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
      const token = extractSessionToken(c.req.raw, ['__Host-admin-session', '__Host-session'], c.env?.ENVIRONMENT);
      if (!token) return c.json({ error: 'No autenticado' }, 401);
      let session;
      try { session = await identityGateway.validateSession(token); }
      catch { return c.json({ error: 'No autenticado' }, 401); }
      if (isAdminMfaPending(session)) return c.json({ error: 'MFA obligatorio: completa el enrolamiento antes de usar el panel' }, 403);
      const isAdmin = session.actorType === 'admin';
      if (isAdmin && !hasNotificationPermission(session.permissions)) return c.json({ error: 'Permiso insuficiente' }, 403);
      if (!isAdmin && session.actorType !== 'customer') return c.json({ error: 'No autorizado' }, 403);
      const parsed = readNotificationsSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Lista de notificaciones inválida' }, 400);
      const channel = isAdmin ? 'admin' : `customer:${session.actorId}`;
      const visible = await realtimeGateway.getNotifications({ channel, recipientId: isAdmin ? undefined : session.actorId, limit: 100 });
      const requested = new Set(parsed.data.ids);
      await realtimeGateway.markNotificationsRead(visible.filter((n) => !n.read && requested.has(n.id)).map((n) => n.id));
      return c.json({ success: true });
    });

    return app;
  }
}

const readNotificationsSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(128)).max(100),
}).strict();

function hasNotificationPermission(permissions: string[]): boolean {
  return permissions.some((p) => p === '*' || p === 'orders:*' || p === 'orders:read' || p === 'payments:*' || p === 'payments:read');
}
