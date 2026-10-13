import { MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';

export const RateLimitMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) || (!c.req.path.startsWith('/api/') && c.req.path !== '/media/upload')) return next();
  const isAuth = c.req.path.startsWith('/api/v1/auth') || c.req.path.startsWith('/api/v1/admin/auth');
  const isCheckout = c.req.path === '/api/v1/orders' || c.req.path === '/api/v1/payments/wompi/init';
  const binding = isAuth ? c.env.AUTH_LIMITER : isCheckout ? c.env.CHECKOUT_LIMITER : c.env.API_WRITE_LIMITER;
  const scope = isAuth ? 'auth' : isCheckout ? 'checkout' : 'api_write';
  const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown';
  if (!binding) {
    console.error(JSON.stringify({ event: 'security.rate_limit_binding_missing', scope, trace_id: traceId }));
    return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
  }
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  let outcome;
  try { outcome = await binding.limit({ key: ip }); }
  catch (error) {
    console.error(JSON.stringify({ event: 'security.rate_limit_binding_error', scope, trace_id: traceId, error_name: error instanceof Error ? error.name : 'UnknownError' }));
    return c.json({ error: 'Servicio temporalmente no disponible' }, 503);
  }
  if (!outcome.success) return c.json({ error: 'Demasiadas solicitudes; inténtalo más tarde' }, 429, { 'Retry-After': '60' });
  return next();
};
