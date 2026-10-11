import { MiddlewareHandler } from 'hono';
import { TraceContext } from '../../platform/TraceContext.js';

export const TraceIdMiddleware: MiddlewareHandler = async (c, next) => {
  const traceContext = TraceContext.fromHeaders(c.req.raw.headers);
  c.set('traceContext', traceContext);

  await next();

  c.header('x-trace-id', traceContext.traceId);
  c.header('x-request-id', traceContext.requestId);
  c.header('traceparent', traceContext.toTraceparent());
};
