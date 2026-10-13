import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';

export class RealtimeController {
  public static createRoutes(realtimeGateway: RealtimeGateway, identityGateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    // GET /api/v1/realtime/notifications?channel=admin&since=...
    app.get('/api/v1/realtime/notifications', async (c) => {
      const token = getSessionToken(c.req.header('authorization'), c.req.header('cookie'));
      if (!token) return c.json({ error: 'No autenticado' }, 401);
      let session;
      try { session = await identityGateway.validateSession(token); }
      catch { return c.json({ error: 'No autenticado' }, 401); }
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
    app.post('/api/v1/realtime/notifications/read', async (c) => {
      const token = getSessionToken(c.req.header('authorization'), c.req.header('cookie'));
      if (!token) return c.json({ error: 'No autenticado' }, 401);
      let session;
      try { session = await identityGateway.validateSession(token); }
      catch { return c.json({ error: 'No autenticado' }, 401); }
      const isAdmin = session.actorType === 'admin';
      if (isAdmin && !hasNotificationPermission(session.permissions)) return c.json({ error: 'Permiso insuficiente' }, 403);
      if (!isAdmin && session.actorType !== 'customer') return c.json({ error: 'No autorizado' }, 403);
      const body = await c.req.json();
      if (Array.isArray(body.ids) && body.ids.length <= 100 && body.ids.every((id: unknown) => typeof id === 'string')) {
        const channel = isAdmin ? 'admin' : `customer:${session.actorId}`;
        const visible = await realtimeGateway.getNotifications({ channel, recipientId: isAdmin ? undefined : session.actorId, limit: 100 });
        const requested = new Set(body.ids);
        await realtimeGateway.markNotificationsRead(visible.filter((n) => !n.read && requested.has(n.id)).map((n) => n.id));
      }
      return c.json({ success: true });
    });

    return app;
  }
}

function getSessionToken(authorization?: string, cookie?: string): string | undefined {
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();
  const sessionCookie = cookie?.split(';').map((part) => part.trim()).find((part) =>
    part.startsWith('__Host-admin-session=') || part.startsWith('__Host-session='));
  return sessionCookie?.slice(sessionCookie.indexOf('=') + 1);
}

function hasNotificationPermission(permissions: string[]): boolean {
  return permissions.some((p) => p === '*' || p === 'orders:*' || p === 'orders:read' || p === 'payments:*' || p === 'payments:read');
}
