import { describe, expect, it } from 'vitest';
import type { CloudflareOptions } from '@sentry/cloudflare';
import { scrubSentrySpan } from '../src/platform/scrubSentrySpan.js';

type SentrySpan = Parameters<NonNullable<CloudflareOptions['beforeSendSpan']>>[0];

describe('Sentry span scrubbing', () => {
  it('keeps timing and safe operation names while removing request and custom attributes', () => {
    const span: SentrySpan = {
      trace_id: 'a'.repeat(32),
      span_id: 'b'.repeat(16),
      name: 'GET /api/v1/orders/private-order-id',
      start_timestamp: 1,
      end_timestamp: 2,
      status: 'ok',
      is_segment: true,
      attributes: {
        'sentry.op': 'http.server',
        'http.target': '/api/v1/orders/private-order-id?email=private@example.test',
        'http.request.method': 'GET',
        'custom.customer_email': 'private@example.test',
      },
    };

    const scrubbed = scrubSentrySpan(span);

    expect(scrubbed.name).toBe('http.server');
    expect(scrubbed.attributes).toEqual({ 'sentry.op': 'http.server' });
    expect(scrubbed.start_timestamp).toBe(1);
    expect(scrubbed.end_timestamp).toBe(2);
    expect(JSON.stringify(scrubbed)).not.toContain('private');
  });

  it('replaces unrecognized operation names with a generic safe label', () => {
    const span: SentrySpan = {
      trace_id: 'a'.repeat(32),
      span_id: 'b'.repeat(16),
      name: 'customer@example.test',
      start_timestamp: 1,
      status: 'ok',
      is_segment: false,
      attributes: { 'sentry.op': 'customer@example.test' },
    };

    expect(scrubSentrySpan(span).name).toBe('operation');
  });
});
