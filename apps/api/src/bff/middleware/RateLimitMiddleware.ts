import { MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';

export const RateLimitMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) || !c.req.path.startsWith('/api/')) return next();
  const isAuth = c.req.path.startsWith('/api/v1/auth') || c.req.path.startsWith('/api/v1/admin/auth');
  const isCheckout = c.req.path === '/api/v1/orders' || c.req.path === '/api/v1/payments/wompi/init';
  const binding = isAuth ? c.env.AUTH_LIMITER : isCheckout ? c.env.CHECKOUT_LIMITER : c.env.API_WRITE_LIMITER;
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const outcome = await binding.limit({ key: ip });
  if (!outcome.success) return c.json({ error: 'Demasiadas solicitudes; inténtalo más tarde' }, 429, { 'Retry-After': '60' });
  return next();
};
