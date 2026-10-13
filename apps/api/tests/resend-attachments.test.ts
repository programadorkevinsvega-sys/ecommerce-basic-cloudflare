import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResendEmailAdapter } from '../src/modules/notifications/infrastructure/adapters/ResendEmailAdapter.js';

afterEach(() => vi.unstubAllGlobals());

describe('Resend PDF attachments', () => {
  it('sends the invoice as a base64 attachment with its PDF content type', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.attachments).toEqual([{ filename: 'FAC-000001.pdf', content: 'JVBERg==' }]);
      return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await new ResendEmailAdapter('re_test', 'orders@example.test').sendEmail({
      to: 'buyer@example.test', subject: 'Factura', html: '<p>Adjuntamos tu factura</p>', idempotencyKey: 'invoice-1',
      attachments: [{ filename: 'FAC-000001.pdf', content: 'JVBERg==' }],
    });
    expect(result.success).toBe(true);
  });
});
