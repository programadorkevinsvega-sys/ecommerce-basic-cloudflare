import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { verifyTurnstileToken } from '../../security/verifyTurnstileToken.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';

const requestResetSchema = z.object({
  email: z.string().email().max(254),
  turnstileToken: z.string().min(1).max(2048),
}).strict();
const confirmResetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(12).max(128),
  turnstileToken: z.string().min(1).max(2048),
}).strict();
const verifyEmailSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();

export class CustomerAuthFlowController {
  public static createRoutes(gateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();

    router.post('/password-reset/request', async (c) => {
      const parsed = requestResetSchema.safeParse(await readJson(c.req));
      if (!parsed.success) return c.json({ error: 'Solicitud inválida' }, 400);
      if (!c.env.PUBLIC_ORIGIN) return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
      const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
      if (turnstile === 'unavailable') return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
      if (turnstile !== 'valid') return c.json({ error: 'No fue posible verificar la solicitud' }, 400);
      try {
        await gateway.requestCustomerPasswordReset(parsed.data.email, c.env.PUBLIC_ORIGIN);
        return c.json({ message: 'Si existe una cuenta con ese correo, recibirás instrucciones.' }, 202);
      } catch {
        return c.json({ error: 'No fue posible procesar la solicitud' }, 503);
      }
    });

    router.post('/password-reset/confirm', async (c) => {
      const parsed = confirmResetSchema.safeParse(await readJson(c.req));
      if (!parsed.success) return c.json({ error: 'Solicitud inválida' }, 400);
      const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
      if (turnstile === 'unavailable') return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
      if (turnstile !== 'valid') return c.json({ error: 'No fue posible verificar la solicitud' }, 400);
      try {
        await gateway.resetCustomerPassword(parsed.data.token, parsed.data.password);
        return c.json({ message: 'Contraseña actualizada. Inicia sesión para continuar.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message === 'PASSWORD_POLICY_UNMET') return c.json({ error: 'La contraseña no cumple la política de seguridad.' }, 400);
        if (message === 'PASSWORD_COMPROMISED') return c.json({ error: 'Elige una contraseña que no haya aparecido en filtraciones.' }, 400);
        if (message === 'PASSWORD_BREACH_CHECK_UNAVAILABLE') return c.json({ error: 'No se pudo comprobar la seguridad de la contraseña. Inténtalo más tarde.' }, 503);
        if (message === 'PASSWORD_RESET_INVALID_OR_EXPIRED') return c.json({ error: 'El enlace no es válido o ya venció.' }, 400);
        return c.json({ error: 'No fue posible actualizar la contraseña' }, 503);
      }
    });

    router.post('/email-verification/confirm', async (c) => {
      const parsed = verifyEmailSchema.safeParse(await readJson(c.req));
      if (!parsed.success) return c.json({ error: 'El enlace no es válido o ya venció.' }, 400);
      try {
        await gateway.verifyCustomerEmail(parsed.data.token);
        return c.json({ message: 'Correo verificado. Ya puedes iniciar sesión.' });
      } catch (error) {
        if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED') {
          return c.json({ error: 'El enlace no es válido o ya venció.' }, 400);
        }
        return c.json({ error: 'No fue posible verificar el correo' }, 503);
      }
    });

    router.post('/email-verification/resend', async (c) => {
      const token = extractSessionToken(c.req.raw, '__Host-session', c.env?.ENVIRONMENT);
      if (!token) return c.json({ error: 'Sesión requerida' }, 401);
      let session;
      try {
        session = await gateway.validateSession(token);
      } catch {
        return c.json({ error: 'Sesión inválida' }, 401);
      }
      if (session.actorType !== 'customer') return c.json({ error: 'Acceso denegado' }, 403);
      if (!c.env.PUBLIC_ORIGIN) return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
      try {
        await gateway.requestCustomerEmailVerification(session.actorId, c.env.PUBLIC_ORIGIN);
        return c.json({ message: 'Si el correo requiere verificación, recibirás un enlace.' }, 202);
      } catch {
        return c.json({ error: 'No fue posible procesar la solicitud' }, 503);
      }
    });

    return router;
  }
}

async function readJson(request: { json(): Promise<unknown> }): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}
