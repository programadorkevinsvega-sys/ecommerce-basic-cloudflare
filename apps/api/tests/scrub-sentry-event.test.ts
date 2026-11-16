import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/cloudflare';
import { scrubSentryEvent } from '../src/platform/scrubSentryEvent.js';

describe('Sentry event scrubbing', () => {
  it('removes request and identity data and redacts free-form error details', () => {
    const event: ErrorEvent = {
      type: undefined,
      event_id: 'event-1',
      message: 'private error message',
      request: { url: 'https://shop.example.test/?token=private', headers: { cookie: 'private' } },
      user: { email: 'private@example.test', ip_address: '192.0.2.1' },
      extra: { password: 'private' },
      contexts: {
        account: { email: 'private@example.test' },
        trace: {
          trace_id: 'a'.repeat(32),
          span_id: 'b'.repeat(16),
          parent_span_id: 'c'.repeat(16),
          op: 'http.server',
          description: 'private@example.test',
          data: { customerEmail: 'private@example.test' },
        },
      },
      breadcrumbs: [{ message: 'private breadcrumb' }],
      transaction: '/private/path',
      tags: {
        area: 'admin_auth',
        failure_reason: 'db_failure',
        trace_id: 'private@example.test',
        request_id: 'private@example.test',
        private: 'value',
      },
      exception: {
        values: [{
          type: 'Error',
          value: 'private exception message',
          stacktrace: { frames: [{ filename: 'worker.js', vars: { password: 'private' } }] },
        }],
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.request).toBeUndefined();
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.extra).toBeUndefined();
    expect(scrubbed.contexts).toEqual({
      trace: {
        trace_id: 'a'.repeat(32),
        span_id: 'b'.repeat(16),
        parent_span_id: 'c'.repeat(16),
        op: 'http.server',
      },
    });
    expect(scrubbed.breadcrumbs).toBeUndefined();
    expect(scrubbed.transaction).toBeUndefined();
    expect(scrubbed.tags).toEqual({ area: 'admin_auth', failure_reason: 'db_failure' });
    expect(scrubbed.message).toBe('Worker exception (details redacted)');
    expect(scrubbed.exception?.values?.[0]?.value).toBe('Worker exception (details redacted)');
    expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars).toBeUndefined();
    expect(JSON.stringify(scrubbed)).not.toContain('private');
  });

  it('keeps actionable infrastructure context without forwarding arbitrary exception text', () => {
    const event: ErrorEvent = {
      type: undefined,
      event_id: 'event-2',
      message: 'A request failed for private@example.test',
      tags: {
        area: 'rate_limit',
        failure_reason: 'rate_limit_binding_error',
        dependency: 'API_IP_WRITE_LIMITER',
      },
      exception: { values: [{ type: 'Error', value: 'private@example.test' }] },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.message).toBe('Rate-limit provider request failed (API_IP_WRITE_LIMITER)');
    expect(scrubbed.exception?.values?.[0]?.value).toBe('Rate-limit provider request failed (API_IP_WRITE_LIMITER)');
    expect(scrubbed.tags).toEqual({
      area: 'rate_limit',
      failure_reason: 'rate_limit_binding_error',
      dependency: 'API_IP_WRITE_LIMITER',
    });
    expect(JSON.stringify(scrubbed)).not.toContain('private@example.test');
  });
});
