import * as Sentry from '@sentry/cloudflare';
import { getSafeErrorType } from './getSafeErrorType.js';

export interface SentryErrorContext {
  area: string;
  reason?: string;
  dependency?: string;
  fallbackDependency?: string;
  traceId?: string;
  requestId?: string;
}

export function captureSentryException(error: unknown, context: SentryErrorContext): void {
  Sentry.withScope((scope) => {
    scope.setTag('area', context.area);
    if (context.reason) scope.setTag('failure_reason', context.reason);
    if (context.dependency) scope.setTag('dependency', context.dependency);
    if (context.fallbackDependency) scope.setTag('fallback_dependency', context.fallbackDependency);
    scope.setTag('error_type', getSafeErrorType(error));
    if (context.traceId) scope.setTag('trace_id', context.traceId);
    if (context.requestId) scope.setTag('request_id', context.requestId);
    Sentry.captureException(error);
  });
}
