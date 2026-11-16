import { Context, MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';
import { getRateLimitRouteScope } from '../security/getRateLimitRouteScope.js';
import { IdentityGateway } from '../gateways/identity/IdentityGateway.js';
import { extractSessionToken } from '../security/extractSessionToken.js';
import { JsonLogger } from '../../platform/JsonLogger.js';
import { captureSentryException } from '../../platform/captureSentryException.js';

export function createRateLimitMiddleware(identityGateway?: IdentityGateway): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const path = c.req.path;
    if (!path.startsWith('/api/') && path !== '/media/upload') return next();
    if (c.req.method === 'GET') {
      const isSearch = path === '/api/v1/search' || path.startsWith('/api/v1/search/');
      const isPublicRead = path === '/api/v1/shipping/locations' || path === '/api/v1/cart' || path.startsWith('/api/v1/cart/');
      if (!isSearch && !isPublicRead) return next();
      const binding = isSearch ? c.env.PUBLIC_SEARCH_LIMITER : c.env.PUBLIC_READ_LIMITER;
      const scope = isSearch ? 'public_search' : 'public_read';
      const bindingName = isSearch ? 'PUBLIC_SEARCH_LIMITER' : 'PUBLIC_READ_LIMITER';
      const limited = await applyLimit(c, binding, bindingName, `${scope}:${c.req.header('cf-connecting-ip') || 'unknown'}`, scope);
      return limited || next();
    }
    if (['HEAD', 'OPTIONS'].includes(c.req.method)) return next();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) return next();
    const isAuth = c.req.path.startsWith('/api/v1/auth') || c.req.path.startsWith('/api/v1/admin/auth');
    const isCheckout = c.req.path === '/api/v1/orders' || c.req.path === '/api/v1/orders/tracking' || c.req.path === '/api/v1/payments/wompi/init';
    const scope = isAuth ? 'auth' : isCheckout ? 'checkout' : 'api_write';
    const binding = isAuth ? c.env.AUTH_LIMITER : isCheckout ? c.env.CHECKOUT_LIMITER : c.env.API_IP_WRITE_LIMITER;
    const bindingName = isAuth ? 'AUTH_LIMITER' : isCheckout ? 'CHECKOUT_LIMITER' : 'API_IP_WRITE_LIMITER';
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const key = isAuth || isCheckout
      ? ip
      : `ip:${ip}:${c.req.method}:${getRateLimitRouteScope(path)}`;
    const limited = await applyLimit(c, binding, bindingName, key, scope);
    if (limited) return limited;

    if (identityGateway && scope === 'api_write') {
      const token = extractSessionToken(c.req.raw, ['__Host-admin-session', '__Host-session'], c.env?.ENVIRONMENT);
      if (token) {
        let actorId: string;
        try {
          actorId = (await identityGateway.validateSession(token)).actorId;
        } catch (error) {
          console.error(JSON.stringify({
            event: 'security.rate_limit_session_lookup_failed',
            error_name: error instanceof Error ? error.name : 'UnknownError',
          }));
          return next();
        }
        const actorLimit = await applyLimit(
          c,
          c.env?.API_WRITE_LIMITER,
          'API_WRITE_LIMITER',
          `actor:${actorId}:${c.req.method}:${getRateLimitRouteScope(path)}`,
          'api_actor_write',
        );
        if (actorLimit) return actorLimit;
      }
    }
    return next();
  };
}

async function applyLimit(
  c: Context<{ Bindings: Env }>,
  binding: Env['AUTH_LIMITER'] | undefined,
  bindingName: string,
  key: string,
  scope = 'public_read',
): Promise<Response | null> {
  const traceContext = c.get('traceContext');
  const traceId = traceContext?.traceId || 'unknown';
  if (!binding) {
    const error = new Error('Rate-limit binding is not configured');
    new JsonLogger('rate-limit', traceContext).error('Rate limit dependency unavailable', error, {
      failure_reason: 'rate_limit_binding_missing', binding_name: bindingName, scope,
    });
    captureSentryException(error, {
      area: 'rate_limit', reason: 'rate_limit_binding_missing', dependency: bindingName,
      traceId: traceContext?.traceId, requestId: traceContext?.requestId,
    });
    return c.json({
      error: 'No se pudo validar el límite de solicitudes; la operación no se procesó. Intenta de nuevo y comparte el código de seguimiento si persiste.',
      errorCode: 'RATE_LIMIT_UNAVAILABLE',
      traceId,
    }, 503);
  }
  let outcome;
  try { outcome = await binding.limit({ key }); }
  catch (error) {
    new JsonLogger('rate-limit', traceContext).error('Rate limit dependency unavailable', error, {
      failure_reason: 'rate_limit_binding_error', binding_name: bindingName, scope,
    });
    captureSentryException(error, {
      area: 'rate_limit', reason: 'rate_limit_binding_error', dependency: bindingName,
      traceId: traceContext?.traceId, requestId: traceContext?.requestId,
    });
    return c.json({
      error: 'No se pudo validar el límite de solicitudes; la operación no se procesó. Intenta de nuevo y comparte el código de seguimiento si persiste.',
      errorCode: 'RATE_LIMIT_UNAVAILABLE',
      traceId,
    }, 503);
  }
  if (!outcome.success) return c.json({ error: 'Demasiadas solicitudes; inténtalo más tarde' }, 429, { 'Retry-After': '60' });
  return null;
}
