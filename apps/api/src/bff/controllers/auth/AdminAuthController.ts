import { Hono } from 'hono';
import { z } from 'zod';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import QRCode from 'qrcode-svg';
import { Env } from '../../../platform/Env.js';
import { verifyTurnstileToken } from '../../security/verifyTurnstileToken.js';

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
      try {
        const body = await c.req.json();
        const parsed = adminLoginSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Validación fallida' }, 400);
        }

        const verification = await verifyTurnstileToken(parsed.data.turnstileToken, c.env, c.req.url, c.req.header('cf-connecting-ip'));
        if (verification === 'unavailable') return c.json({ error: 'Inicio de sesión temporalmente no disponible' }, 503);
        if (verification !== 'valid') return c.json({ error: 'No fue posible verificar la solicitud. Inténtalo de nuevo.' }, 400);

        const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for');
        const userAgent = c.req.header('user-agent');

        const session = await gateway.loginAdmin({
          email: parsed.data.email,
          password: parsed.data.password,
          totpCode: parsed.data.totpCode,
          ipAddress: ip,
          userAgent,
        });

        // Cookie de administrador conforme a SEC-SES-02
        c.header(
          'set-cookie',
          `__Host-admin-session=${session.rawToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(session.expiresAt).toUTCString()}`
        );

        return c.json({ status: 'ok', mfaEnabled: session.mfaEnabled });
      } catch (err: unknown) {
        return c.json({ error: 'Credenciales inválidas' }, 401);
      }
    });

    router.post('/mfa/enrollment', async (c) => {
      const actor = await getPendingAdmin(c.req.raw, gateway);
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
      const actor = await getPendingAdmin(c.req.raw, gateway);
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
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
      const token = match ? match[1] : c.req.header('authorization')?.replace('Bearer ', '');

      if (token) {
        await gateway.logout(token);
      }

      c.header('set-cookie', '__Host-admin-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      return c.json({ status: 'ok' });
    });

    return router;
  }
}

async function getPendingAdmin(request: Request, gateway: IdentityGateway) {
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-admin-session=([^;]+)/)?.[1]
    || request.headers.get('authorization')?.replace(/^Bearer\s+/, '');
  if (!token) return null;
  try {
    const actor = await gateway.validateSession(token);
    return actor.actorType === 'admin' && !actor.mfaEnabled ? actor : null;
  } catch {
    return null;
  }
}
