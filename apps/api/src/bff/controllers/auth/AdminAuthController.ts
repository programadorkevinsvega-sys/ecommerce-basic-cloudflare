import { Hono } from 'hono';
import { z } from 'zod';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import QRCode from 'qrcode-svg';
import { Env } from '../../../platform/Env.js';
import { verifyTurnstileToken } from '../../security/verifyTurnstileToken.js';
import { extractSessionToken } from '../../security/extractSessionToken.js';
import { JsonLogger } from '../../../platform/JsonLogger.js';
import { captureSentryException } from '../../../platform/captureSentryException.js';
import { classifyAdminLoginFailure } from '../../security/classifyAdminLoginFailure.js';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
  totpCode: z.string().length(6).optional(),
  turnstileToken: z.string().min(1).max(2048),
}).strict();

export class AdminAuthController {
  public static createRoutes(gateway: IdentityGateway): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();

    router.post('/login', async (c) => {
      const traceContext = c.get('traceContext');
      const logger = new JsonLogger('admin-auth', traceContext);
      try {
        let body: unknown;
        try {
          body = await c.req.json();
        } catch {
          logger.warn('Admin login request rejected', { reason: 'invalid_json', status: 400 });
          return c.json({ error: 'Solicitud inválida' }, 400);
        }
        const parsed = adminLoginSchema.safeParse(body);
        if (!parsed.success) {
          logger.warn('Admin login request rejected', { reason: 'invalid_request', status: 400 });
          return c.json({ error: 'Validación fallida' }, 400);
        }

        const verification = await verifyTurnstileToken(parsed.data.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
        if (verification === 'unavailable') {
          logger.error('Admin login dependency unavailable', undefined, { reason: 'turnstile_unavailable', status: 503 });
          captureSentryException(new Error('Admin login Turnstile verification unavailable'), {
            area: 'admin_auth',
            reason: 'turnstile_unavailable',
            traceId: traceContext?.traceId,
            requestId: traceContext?.requestId,
          });
          return c.json({ error: 'Inicio de sesión temporalmente no disponible' }, 503);
        }
        if (verification !== 'valid') {
          logger.warn('Admin login request rejected', { reason: 'turnstile_rejected', status: 400 });
          return c.json({ error: 'No fue posible verificar la solicitud. Inténtalo de nuevo.' }, 400);
        }

        const traceId = traceContext?.traceId;
        const ip = c.req.header('cf-connecting-ip');
        const userAgent = c.req.header('user-agent');

        const session = await gateway.loginAdmin({
          email: parsed.data.email,
          password: parsed.data.password,
          totpCode: parsed.data.totpCode,
          ipAddress: ip,
          userAgent,
          traceId,
        });

        // Cookie de administrador conforme a SEC-SES-02
        c.header(
          'set-cookie',
          `__Host-admin-session=${session.rawToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(session.expiresAt).toUTCString()}`
        );

        logger.info('Admin login succeeded', { mfa_enabled: session.mfaEnabled });
        return c.json({ status: 'ok', mfaEnabled: session.mfaEnabled });
      } catch (err: unknown) {
        const failure = classifyAdminLoginFailure(err);
        if (failure.expectedAuthenticationFailure) {
          logger.warn('Admin login rejected', { reason: failure.reason, status: 401 });
          return c.json({ error: 'Credenciales inválidas' }, 401);
        }

        logger.error('Admin login service failed', err, {
          reason: failure.reason,
          error_name: err instanceof Error ? err.name : 'UnknownError',
          status: 503,
        });
        captureSentryException(err, {
          area: 'admin_auth',
          reason: failure.reason,
          traceId: traceContext?.traceId,
          requestId: traceContext?.requestId,
        });
        return c.json({ error: 'Inicio de sesión temporalmente no disponible' }, 503);
      }
    });

    router.post('/mfa/enrollment', async (c) => {
      const actor = await getPendingAdmin(c.req.raw, gateway, c.env?.ENVIRONMENT);
      if (!actor) return c.json({ error: 'Se requiere una sesión administrativa pendiente de MFA' }, 401);
      const body = await c.req.json().catch(() => null);
      const parsed = z.object({ password: z.string().min(1).max(128) }).strict().safeParse(body);
      if (!parsed.success) return c.json({ error: 'Solicitud inválida' }, 400);
      try {
        const enrollment = await gateway.beginAdminMfaEnrollment(actor.actorId, parsed.data.password);
        c.header('cache-control', 'no-store');
        const qrSvg = new QRCode({
          content: enrollment.otpauthUri,
          width: 256,
          height: 256,
          padding: 4,
          ecl: 'M',
          join: true,
          container: 'svg-viewbox',
        }).svg();
        return c.json({ ...enrollment, qrSvg });
      } catch {
        return c.json({ error: 'No se pudo iniciar el enrolamiento MFA' }, 403);
      }
    });

    router.post('/mfa/confirm', async (c) => {
      const actor = await getPendingAdmin(c.req.raw, gateway, c.env?.ENVIRONMENT);
      if (!actor) return c.json({ error: 'Se requiere una sesión administrativa pendiente de MFA' }, 401);
      const body = await c.req.json().catch(() => null);
      const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).strict().safeParse(body);
      if (!parsed.success) return c.json({ error: 'Código TOTP inválido' }, 400);
      try {
        await gateway.confirmAdminMfaEnrollment(actor.actorId, parsed.data.code);
        return c.json({ status: 'enabled', redirect: '/admin' });
      } catch {
        return c.json({ error: 'Código TOTP inválido o enrolamiento vencido' }, 400);
      }
    });

    router.post('/logout', async (c) => {
      const token = extractSessionToken(c.req.raw, '__Host-admin-session', c.env?.ENVIRONMENT);

      if (token) {
        await gateway.logout(token);
      }

      c.header('set-cookie', '__Host-admin-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      return c.json({ status: 'ok' });
    });

    return router;
  }
}

async function getPendingAdmin(request: Request, gateway: IdentityGateway, environment?: string) {
  const token = extractSessionToken(request, '__Host-admin-session', environment);
  if (!token) return null;
  try {
    const actor = await gateway.validateSession(token);
    return actor.actorType === 'admin' && !actor.mfaEnabled ? actor : null;
  } catch {
    return null;
  }
}
