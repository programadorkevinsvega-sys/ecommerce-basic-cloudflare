import { Context } from 'hono';
import { Env } from '../../platform/Env.js';
import { captureSentryException } from '../../platform/captureSentryException.js';
import { JsonLogger } from '../../platform/JsonLogger.js';

export function createBffErrorHandler() {
  return (error: Error, context: Context<{ Bindings: Env }>) => {
    const traceContext = context.get('traceContext');
    new JsonLogger('bff', traceContext).error('Unhandled BFF request error', error, {
      reason: 'unhandled_request_error',
      status: 500,
    });
    captureSentryException(error, {
      area: 'bff',
      reason: 'unhandled_request_error',
      traceId: traceContext?.traceId,
      requestId: traceContext?.requestId,
    });
    return context.json({ error: 'Error interno del servidor' }, 500);
  };
}
