import { MiddlewareHandler } from 'hono';
import { purgePublicHtmlCache, WorkerCachePurgePort } from '../../platform/PurgePublicHtmlCache.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CUSTOMER_REVIEW_PATH = /^\/api\/v1\/products\/[^/]+\/reviews$/;

export const PublicHtmlCacheInvalidationMiddleware: MiddlewareHandler = async (c, next) => {
  if (!isCacheRelevantMutation(c.req.method, c.req.path)) return next();
  await next();
  if (c.res.status < 200 || c.res.status >= 400) return;

  const execution = c.executionCtx as unknown as { cache?: WorkerCachePurgePort };
  try {
    await purgePublicHtmlCache(execution.cache);
  } catch (error) {
    const traceId = (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown';
    console.error(JSON.stringify({
      event: 'cache.public_html_invalidation_failed',
      trace_id: traceId,
      error_name: error instanceof Error ? error.name : 'UnknownError',
      fallback: 'short_ttl',
    }));
  }
};

function isCacheRelevantMutation(method: string, path: string): boolean {
  if (SAFE_METHODS.has(method)) return false;
  if (path.startsWith('/api/v1/admin/') || path === '/api/v1/settings' || path === '/media/upload') return true;
  if (method === 'POST' && (path === '/api/v1/orders' || path === '/api/v1/webhooks/wompi')) return true;
  return method === 'POST' && CUSTOMER_REVIEW_PATH.test(path);
}
