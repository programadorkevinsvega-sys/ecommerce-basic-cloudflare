import { Hono } from 'hono';
import { z } from 'zod';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { Env } from '../../../platform/Env.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  fullName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  turnstileToken: z.string().min(1).max(2048),
}).strict();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
}).strict();

export class CustomerAuthController {
  public static createRoutes(gateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();

    router.post('/register', async (c) => {
      try {
        const body = await c.req.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Validación fallida', details: parsed.error.issues }, 400);
        }

        if (!c.env.TURNSTILE_SECRET_KEY) return c.json({ error: 'Registro temporalmente no disponible' }, 503);
        const verification = new URLSearchParams({ secret: c.env.TURNSTILE_SECRET_KEY, response: parsed.data.turnstileToken });
        const ip = c.req.header('cf-connecting-ip');
        if (ip) verification.set('remoteip', ip);
        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: verification,
        });
        if (!turnstileResponse.ok) return c.json({ error: 'No fue posible verificar la solicitud. Inténtalo de nuevo.' }, 400);
        const result = await turnstileResponse.json() as { success?: boolean; hostname?: string };
        const requestHost = new URL(c.req.url).hostname;
        if (!result.success || result.hostname !== requestHost) return c.json({ error: 'No fue posible verificar la solicitud. Inténtalo de nuevo.' }, 400);

        const { turnstileToken: _turnstileToken, ...customerInput } = parsed.data;
        const customer = await gateway.registerCustomer(customerInput);
        return c.json({ data: customer }, 201);
      } catch {
        return c.json({ error: 'No fue posible completar el registro' }, 400);
      }
    });

    router.post('/login', async (c) => {
      try {
        const body = await c.req.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Validación fallida' }, 400);
        }

        const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for');
        const userAgent = c.req.header('user-agent');

        const session = await gateway.loginCustomer({
          ...parsed.data,
          ipAddress: ip,
          userAgent,
        });

        // Cookie segura conforme a SEC-SES-02
        c.header(
          'set-cookie',
          `__Host-session=${session.rawToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(session.expiresAt).toUTCString()}`
        );

        return c.json({ status: 'ok' });
      } catch {
        return c.json({ error: 'Credenciales inválidas' }, 401);
      }
    });

    router.post('/logout', async (c) => {
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-session=([^;]+)/);
      const token = match ? match[1] : c.req.header('authorization')?.replace('Bearer ', '');

      if (token) {
        await gateway.logout(token);
      }

      c.header('set-cookie', '__Host-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      return c.json({ status: 'ok' });
    });

    router.get('/me', async (c) => {
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-session=([^;]+)/);
      const token = match ? match[1] : c.req.header('authorization')?.replace('Bearer ', '');

      if (!token) {
        return c.json({ error: 'No autenticado: sesión requerida' }, 401);
      }

      try {
        const session = await gateway.validateSession(token);
        if (session.actorType !== 'customer') {
          return c.json({ error: 'Acceso denegado: se requiere sesión de cliente' }, 403);
        }

        const profile = await gateway.getCustomerProfile(session.actorId);
        return c.json({ data: profile });
      } catch {
        return c.json({ error: 'Sesión inválida o expirada' }, 401);
      }
    });

    return router;
  }
}
