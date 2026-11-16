import type { CloudflareOptions } from '@sentry/cloudflare';

type SentrySpan = Parameters<NonNullable<CloudflareOptions['beforeSendSpan']>>[0];

const SAFE_OPERATIONS = new Set([
  'http.server',
  'http.client',
  'db.query',
  'db.transaction',
  'queue.process',
  'function',
  'cache.get',
  'cache.put',
  'cache.delete',
  'cache.list',
  'rpc',
]);

export function scrubSentrySpan(span: SentrySpan): SentrySpan {
  const operation = span.attributes['sentry.op'];
  const safeOperation = typeof operation === 'string' && SAFE_OPERATIONS.has(operation)
    ? operation
    : 'operation';

  span.name = safeOperation;
  span.attributes = { 'sentry.op': safeOperation };
  delete span.links;
  return span;
}
