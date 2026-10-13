import { MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const CsrfProtectionMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) return next();
  if (c.req.path === '/api/v1/webhooks/wompi') return next();

  const fetchSite = c.req.header('sec-fetch-site');
  if (fetchSite === 'cross-site') return c.json({ error: 'Origen de solicitud no permitido' }, 403);
  const cookie = c.req.header('cookie') || '';
  const hasSession = /(?:^|;\s*)__Host-(?:session|admin-session)=/.test(cookie);
  const origin = c.req.header('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(c.req.url).origin) return c.json({ error: 'Origen de solicitud no permitido' }, 403);
    } catch { return c.json({ error: 'Origen de solicitud no permitido' }, 403); }
  } else if (hasSession) {
    return c.json({ error: 'La solicitud requiere un origen verificable' }, 403);
  }
  return next();
};
