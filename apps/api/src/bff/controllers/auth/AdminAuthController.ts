import { Hono } from 'hono';
import { z } from 'zod';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
  totpCode: z.string().length(6).optional(),
}).strict();

export class AdminAuthController {
  public static createRoutes(gateway: IdentityGateway): Hono {
    const router = new Hono();

    router.post('/login', async (c) => {
      try {
        const body = await c.req.json();
        const parsed = adminLoginSchema.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: 'Validación fallida' }, 400);
        }

        const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for');
        const userAgent = c.req.header('user-agent');

        const session = await gateway.loginAdmin({
          ...parsed.data,
          ipAddress: ip,
          userAgent,
        });

        // Cookie de administrador conforme a SEC-SES-02
        c.header(
          'set-cookie',
          `__Host-admin-session=${session.rawToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(session.expiresAt).toUTCString()}`
        );

        return c.json({ status: 'ok', token: session.rawToken });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Credenciales inválidas';
        return c.json({ error: msg }, 401);
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
