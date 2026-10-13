import { describe, expect, it, vi } from 'vitest';
import { JsonLogger } from '../src/platform/JsonLogger.js';
import { TraceContext } from '../src/platform/TraceContext.js';
import { ResendEmailAdapter } from '../src/modules/notifications/infrastructure/adapters/ResendEmailAdapter.js';

describe('JsonLogger privacy', () => {
  it('redacts personal data and exception details while retaining trace identifiers', () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new JsonLogger('test', new TraceContext('trace-123', 'request-456'));
    logger.error('failed operation', new Error('DB rejected maria@example.com at Calle 1'), {
      customer_email: 'maria@example.com', shippingAddress: { addressLine: 'Calle 1', city: 'Bogota' },
      payment: { status: 'declined' },
    });
    const entry = JSON.parse(String(output.mock.calls[0]?.[0])) as Record<string, any>;

    expect(entry.trace_id).toBe('trace-123');
    expect(JSON.stringify(entry)).not.toContain('maria@example.com');
    expect(JSON.stringify(entry)).not.toContain('Calle 1');
    expect(JSON.stringify(entry)).not.toContain('DB rejected');
    expect(entry.data.payment.status).toBe('declined');
    output.mockRestore();
  });

  it('does not report mock email delivery or log the recipient when credentials are absent', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const result = await new ResendEmailAdapter().sendEmail({
      to: 'private@example.com', subject: 'Test', html: '<p>private</p>', idempotencyKey: 'email-1',
    });

    expect(result.success).toBe(false);
    expect(output).not.toHaveBeenCalled();
    output.mockRestore();
  });
});
