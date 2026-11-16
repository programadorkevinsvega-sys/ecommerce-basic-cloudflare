import { Hono } from 'hono';
import { z } from 'zod';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { Env } from '../../../platform/Env.js';
import { verifyTurnstileToken } from '../../security/verifyTurnstileToken.js';
import { CustomerAuthFlowController } from './CustomerAuthFlowController.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  fullName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  turnstileToken: z.string().min(1).max(2048),
}).strict();

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().min(1).max(2048),
}).strict();

export class CustomerAuthController {
  public static createRoutes(gateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();

    router.post('/register', async (c) => {
      try {
        const body = await c.req.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Solicitud inválida' }, 400);
        }

        const verification = await verifyTurnstileToken(parsed.data.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
        if (verification === 'unavailable') return c.json({ error: 'Registro temporalmente no disponible' }, 503);
        if (verification !== 'valid') return c.json({ error: 'No fue posible verificar la solicitud. Inténtalo de nuevo.' }, 400);

        if (!c.env.PUBLIC_ORIGIN) return c.json({ error: 'Registro temporalmente no disponible' }, 503);
        const { turnstileToken: _turnstileToken, ...customerInput } = parsed.data;
        await gateway.registerCustomer({ ...customerInput, publicOrigin: c.env.PUBLIC_ORIGIN });
        return c.json({ message: 'Si el registro fue aceptado, recibirás instrucciones para verificar tu correo.' }, 202);
      } catch (error) {
        if (error instanceof Error && error.message === 'PASSWORD_POLICY_UNMET') {
          return c.json({ error: 'La contraseña no cumple la política de seguridad.' }, 400);
        }
        if (error instanceof Error && error.message === 'PASSWORD_COMPROMISED') {
          return c.json({ error: 'Elige una contraseña que no haya aparecido en filtraciones.' }, 400);
        }
        if (error instanceof Error && error.message === 'PASSWORD_BREACH_CHECK_UNAVAILABLE') {
          return c.json({ error: 'No se pudo comprobar la seguridad de la contraseña. Inténtalo más tarde.' }, 503);
        }
        return c.json({ error: 'No fue posible completar el registro' }, 503);
      }
    });

    router.post('/login', async (c) => {
      try {
        const body = await c.req.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Validación fallida' }, 400);
        }

        const verification = await verifyTurnstileToken(parsed.data.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
        if (verification === 'unavailable') return c.json({ error: 'Inicio de sesión temporalmente no disponible' }, 503);
        if (verification !== 'valid') return c.json({ error: 'No fue posible verificar la solicitud. Inténtalo de nuevo.' }, 400);

        const ip = c.req.header('cf-connecting-ip');
        const userAgent = c.req.header('user-agent');

        const session = await gateway.loginCustomer({
          email: parsed.data.email,
          password: parsed.data.password,
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
      const token = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);

      if (token) {
        await gateway.logout(token);
      }

      c.header('set-cookie', '__Host-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      return c.json({ status: 'ok' });
    });

    router.get('/me', async (c) => {
      const token = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);

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

    router.route('/', CustomerAuthFlowController.createRoutes(gateway));
    return router;
  }
}
