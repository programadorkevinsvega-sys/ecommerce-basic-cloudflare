import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { renderCustomerProfilePage } from '../../views/account/renderCustomerProfilePage.js';
import { renderCustomerSecurityPage } from '../../views/account/renderCustomerSecurityPage.js';

const profileSchema = z.object({ fullName: z.string().trim().min(2).max(100), phone: z.string().trim().max(20).optional(), currentPassword: z.string().min(1).max(128) }).strict();
const passwordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(12).max(128) }).strict();

export class CustomerAccountSecurityController {
  public static createRoutes(identity: IdentityGateway): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    const authenticate = async (c: any) => {
      const token = getCookie(c, '__Host-session');
      if (!token) return null;
      try {
        const session = await identity.validateSession(token);
        return session.actorType === 'customer' ? { session, token } : null;
      } catch { return null; }
    };
    app.get('/cuenta/perfil', async (c) => {
      const auth = await authenticate(c);
      if (!auth) return c.redirect('/auth/login?redirect=/cuenta/perfil');
      const profile = await identity.getCustomerProfile(auth.session.actorId);
      c.header('Cache-Control', 'private, no-store');
      return c.html(renderCustomerProfilePage(profile));
    });
    app.get('/cuenta/seguridad', async (c) => {
      const auth = await authenticate(c);
      if (!auth) return c.redirect('/auth/login?redirect=/cuenta/seguridad');
      const [sessions, profile] = await Promise.all([
        identity.listCustomerSessions(auth.session.actorId, auth.token),
        identity.getCustomerProfile(auth.session.actorId),
      ]);
      c.header('Cache-Control', 'private, no-store');
      return c.html(renderCustomerSecurityPage(sessions, profile.email));
    });
    app.patch('/api/v1/customer/profile', async (c) => {
      const auth = await authenticate(c);
      if (!auth) return c.json({ error: 'Sesión inválida o expirada' }, 401);
      const limited = await rateLimit(c, auth.session.actorId);
      if (limited) return limited;
      if (Number(c.req.header('content-length') || 0) > 8192) return c.json({ error: 'Solicitud demasiado grande' }, 413);
      const parsed = profileSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'Revisa los datos ingresados' }, 400);
      try {
        const profile = await identity.updateCustomerProfile({ customerId: auth.session.actorId, ...parsed.data });
        c.header('Cache-Control', 'private, no-store');
        return c.json({ data: profile });
      } catch { return c.json({ error: 'No fue posible actualizar el perfil' }, 400); }
    });
    app.post('/api/v1/customer/password', async (c) => {
      const auth = await authenticate(c);
      if (!auth) return c.json({ error: 'Sesión inválida o expirada' }, 401);
      const limited = await rateLimit(c, auth.session.actorId);
      if (limited) return limited;
      if (Number(c.req.header('content-length') || 0) > 8192) return c.json({ error: 'Solicitud demasiado grande' }, 413);
      const parsed = passwordSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: 'La nueva contraseña debe tener entre 12 y 128 caracteres' }, 400);
      try {
        const rotated = await identity.changeCustomerPassword({
          customerId: auth.session.actorId, ...parsed.data, currentSessionToken: auth.token,
          ipAddress: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
        });
        c.header('set-cookie', `__Host-session=${rotated.rawToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(rotated.expiresAt).toUTCString()}`);
        c.header('Cache-Control', 'private, no-store');
        return c.json({ status: 'ok', message: 'Contraseña actualizada. Se cerraron las demás sesiones.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible cambiar la contraseña';
        return c.json({ error: message }, 400);
      }
    });
    app.get('/api/v1/customer/sessions', async (c) => {
      const auth = await authenticate(c);
      if (!auth) return c.json({ error: 'Sesión inválida o expirada' }, 401);
      c.header('Cache-Control', 'private, no-store');
      return c.json({ data: await identity.listCustomerSessions(auth.session.actorId, auth.token) });
    });
    app.delete('/api/v1/customer/sessions/:sessionId', async (c) => {
      const auth = await authenticate(c);
      if (!auth) return c.json({ error: 'Sesión inválida o expirada' }, 401);
      const deleted = await identity.revokeCustomerSession(c.req.param('sessionId'), auth.session.actorId);
      if (!deleted) return c.json({ error: 'Sesión no encontrada' }, 404);
      return c.json({ status: 'ok' });
    });
    return app;
  }
}

async function rateLimit(c: any, customerId: string): Promise<Response | null> {
  try {
    const result = await c.env.API_WRITE_LIMITER.limit({ key: `account_security:${customerId}` });
    return result.success ? null : c.json({ error: 'Demasiadas solicitudes; inténtalo más tarde' }, 429, { 'Retry-After': '60' });
  } catch {
    return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
  }
}
