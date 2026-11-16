import { MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';
import { IdentityGateway } from '../gateways/identity/IdentityGateway.js';
import { extractSessionToken } from '../security/extractSessionToken.js';

const ADMIN_LOGIN_PATH = '/api/v1/admin/auth/login';
const ADMIN_LOGOUT_PATH = '/api/v1/admin/auth/logout';
const LOCAL_ENVIRONMENTS = new Set(['development', 'test']);

export function createAdminCountryAccessMiddleware(
  identity: IdentityGateway,
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const env = c.env ?? {} as Env;
    if (!isPolicyEnabled(env)) return next();

    if (c.req.path === ADMIN_LOGIN_PATH && c.req.method === 'POST') {
      const body = await c.req.raw.clone().json().catch(() => null) as { email?: unknown } | null;
      const email = typeof body?.email === 'string' ? body.email : '';
      return isPermittedAdmin(email, getCountry(c.req.raw), env)
        ? next()
        : c.json({ error: 'Credenciales inválidas' }, 401);
    }

    if (c.req.path === ADMIN_LOGOUT_PATH) return next();
    const path = c.req.path;
    if (!path.startsWith('/api/') && !path.startsWith('/admin/') && path !== '/admin' &&
      path !== '/media/upload') return next();

    const token = extractSessionToken(c.req.raw, '__Host-admin-session', env.ENVIRONMENT);
    if (!token) return next();
    let session;
    try { session = await identity.validateSession(token); } catch { return next(); }
    if (session.actorType !== 'admin') return next();
    if (!session.email || !isPermittedAdmin(session.email, getCountry(c.req.raw), env)) {
      return c.json({ error: 'Acceso administrativo no permitido desde esta ubicación' }, 403);
    }
    return next();
  };
}

function isPermittedAdmin(email: string, country: string | undefined, env: Env): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const primaryEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  const demoEmail = env.ADMIN_DEMO_EMAIL?.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (primaryEmail && normalizedEmail === primaryEmail) {
    return country === 'CO' || (!country && LOCAL_ENVIRONMENTS.has(env.ENVIRONMENT || ''));
  }
  return Boolean(demoEmail && normalizedEmail === demoEmail);
}

function isPolicyEnabled(env: Env): boolean {
  const environment = env.ENVIRONMENT?.trim().toLowerCase();
  return Boolean(env.ADMIN_EMAIL || env.ADMIN_DEMO_EMAIL) ||
    ['preview', 'staging', 'production'].includes(environment || '');
}

function getCountry(request: Request): string | undefined {
  const country = (request.cf as { country?: unknown } | undefined)?.country;
  return typeof country === 'string' ? country : undefined;
}
