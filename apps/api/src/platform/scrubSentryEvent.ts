import type { ErrorEvent } from '@sentry/cloudflare';

type TraceContext = NonNullable<NonNullable<ErrorEvent['contexts']>['trace']>;
type SafeTraceContext = Pick<TraceContext, 'trace_id' | 'span_id'> &
  Partial<Pick<TraceContext, 'parent_span_id' | 'op' | 'status'>>;

const SAFE_TAGS = new Set(['area', 'failure_reason', 'dependency', 'fallback_dependency', 'error_type', 'trace_id', 'request_id']);
const SAFE_TRACE_OPERATIONS = new Set(['http.server', 'http.client', 'db.query', 'queue.process', 'function']);
const REDACTED_MESSAGE = 'Worker exception (details redacted)';
const SAFE_FAILURE_SUMMARIES: Record<string, string> = {
  rate_limit_binding_missing: 'Rate-limit protection is not configured',
  rate_limit_binding_error: 'Rate-limit provider request failed',
  rate_limit_binding_fallback: 'Rate-limit binding fallback used',
  media_storage_verification_failed: 'Media storage verification failed',
  media_metadata_registration_failed: 'Media metadata could not be registered',
  media_upload_failed: 'Media upload failed',
  product_update_failed: 'Catalog product update failed',
  catalog_save_failed_after_inventory_update: 'Catalog save failed after inventory was updated',
};

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  const traceContext = event.contexts?.trace;
  delete event.request;
  delete event.user;
  delete event.extra;
  delete event.contexts;
  delete event.breadcrumbs;
  delete event.transaction;
  event.tags = Object.fromEntries(
    Object.entries(event.tags || {}).filter(([key, value]) => SAFE_TAGS.has(key) && isSafeTagValue(key, value)),
  );
  const safeTraceContext = sanitizeTraceContext(traceContext);
  if (safeTraceContext) event.contexts = { trace: safeTraceContext };
  const summary = sentryFailureSummary(event.tags);
  const safeMessage = summary || REDACTED_MESSAGE;
  event.message = event.message ? safeMessage : event.message;

  if (event.logentry) event.logentry = { message: safeMessage };
  for (const exception of event.exception?.values || []) {
    exception.value = safeMessage;
    for (const frame of exception.stacktrace?.frames || []) delete frame.vars;
  }
  return event;
}

function sentryFailureSummary(tags: Record<string, unknown> | undefined): string | undefined {
  const reason = tags?.failure_reason;
  if (typeof reason !== 'string' || !SAFE_FAILURE_SUMMARIES[reason]) return undefined;
  const dependency = tags?.dependency;
  const details: string[] = [];
  if (typeof dependency === 'string' && /^[A-Z_]{1,40}$/.test(dependency)) details.push(dependency);
  const fallbackDependency = tags?.fallback_dependency;
  if (typeof fallbackDependency === 'string' && /^[A-Z_]{1,40}$/.test(fallbackDependency)) details.push(fallbackDependency);
  const errorType = tags?.error_type;
  if (typeof errorType === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(errorType)) details.push(errorType);
  const detailLabel = details.length ? ` (${details.join('; ')})` : '';
  return `${SAFE_FAILURE_SUMMARIES[reason]}${detailLabel}`;
}

function sanitizeTraceContext(context: TraceContext | undefined): SafeTraceContext | undefined {
  if (!context) return undefined;
  if (!isHexId(context.trace_id, 32) || !isHexId(context.span_id, 16)) return undefined;
  const safeContext: SafeTraceContext = {
    trace_id: context.trace_id,
    span_id: context.span_id,
  };
  if (context.parent_span_id && isHexId(context.parent_span_id, 16)) {
    safeContext.parent_span_id = context.parent_span_id;
  }
  if (context.op && SAFE_TRACE_OPERATIONS.has(context.op)) safeContext.op = context.op;
  if (context.status && /^[a-z_]{1,32}$/.test(context.status)) safeContext.status = context.status;
  return safeContext;
}

function isHexId(value: string, length: number): boolean {
  return value.length === length && /^[a-f\d]+$/i.test(value);
}

function isSafeTagValue(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (key === 'trace_id') return isHexId(value, 32);
  if (key === 'error_type') return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value);
  if (key === 'dependency' || key === 'fallback_dependency') return /^[A-Z_]{1,40}$/.test(value);
  if (key === 'request_id') {
    return /^[a-f\d]{16}-[a-z]{3}$/i.test(value) ||
      /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);
  }
  return /^[a-z\d_-]{1,64}$/i.test(value);
}
