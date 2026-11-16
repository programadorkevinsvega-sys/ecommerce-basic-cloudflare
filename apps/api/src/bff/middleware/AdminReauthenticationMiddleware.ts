import { Context, MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';
import { IdentityGateway } from '../gateways/identity/IdentityGateway.js';
import { extractSessionToken } from '../security/extractSessionToken.js';

const REAUTHENTICATION_HEADER = 'x-admin-reauth';

export function createAdminReauthenticationMiddleware(identity: IdentityGateway): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (!requiresReauthentication(c)) return next();

    const sessionToken = getAdminSessionToken(c);
    if (!sessionToken) return c.json({ error: 'Sesión inválida' }, 401);
    const encodedPassword = c.req.header(`${REAUTHENTICATION_HEADER}-password`);
    const totpCode = c.req.header(`${REAUTHENTICATION_HEADER}-totp`);
    if (!encodedPassword || !totpCode) return c.json({ error: 'Reautenticación requerida' }, 428);
    let password: string;
    try { password = decodeURIComponent(encodedPassword); }
    catch { return c.json({ error: 'Reautenticación inválida' }, 403); }

    let session;
    try { session = await identity.validateSession(sessionToken); }
    catch { return c.json({ error: 'Sesión inválida o expirada' }, 401); }
    if (session.actorType !== 'admin' || !session.mfaEnabled) {
      return c.json({ error: 'Reautenticación no disponible' }, 403);
    }
    if (!await identity.reauthenticateAdmin({ adminId: session.actorId, password, totpCode })) {
      return c.json({ error: 'Reautenticación inválida' }, 403);
    }
    await next();
  };
}

function getAdminSessionToken(c: Context<{ Bindings: Env }>): string | null {
  return extractSessionToken(c.req.raw, '__Host-admin-session', c.env?.ENVIRONMENT);
}

function requiresReauthentication(c: Context<{ Bindings: Env }>): boolean {
  const method = c.req.method.toUpperCase();
  const path = new URL(c.req.url).pathname.replace(/\/+$/, '') || '/';
  return (path === '/api/v1/settings' && method === 'PATCH')
    || (path === '/api/v1/admin/shipping/mipaquete/config' && method === 'PUT')
    || (/^\/api\/v1\/admin\/factus\/numbering-ranges(?:\/[^/]+(?:\/(?:status|current|restore))?)?$/.test(path)
      && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method))
    || (path === '/api/v1/admin/payments/cod/collect' && method === 'POST')
    || (/^\/api\/v1\/admin\/invoices\/[^/]+\/credit-notes$/.test(path) && method === 'POST');
}
