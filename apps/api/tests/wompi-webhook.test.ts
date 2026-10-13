import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyWompiSignature } from '../src/bff/controllers/payments/verifyWompiSignature.js';
import { reconcileWompiEvent } from '../src/bff/controllers/payments/reconcileWompiEvent.js';
import { PaymentsController } from '../src/bff/controllers/payments/PaymentsController.js';

const secret = 'events_test_secret';
const payment = { id: 'wompi-tx-1', reference: 'ORDER-abc-1', amount_in_cents: 129900, currency: 'COP', status: 'APPROVED' };
async function signedEvent() {
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = `${payment.id}${payment.reference}${payment.amount_in_cents}${payment.currency}${timestamp}${secret}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const checksum = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return { event: 'transaction.updated', data: { transaction: payment }, environment: 'test', timestamp, signature: { checksum, properties: ['transaction.id', 'transaction.reference', 'transaction.amount_in_cents', 'transaction.currency'] } };
}

afterEach(() => vi.restoreAllMocks());

describe('Wompi webhook signature and reconciliation', () => {
  it('accepts a signed event and rejects tampering or stale timestamps', async () => {
    const body = await signedEvent();
    expect(await verifyWompiSignature(body, secret)).toBe(true);
    expect(await verifyWompiSignature({ ...body, data: { transaction: { ...payment, amount_in_cents: 1 } } }, secret)).toBe(false);
    expect(await verifyWompiSignature({ ...body, timestamp: body.timestamp - 90000 }, secret)).toBe(false);
  });

  it('queries Wompi with the private key and requires an exact canonical match', async () => {
    const body = await signedEvent();
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: payment }), { status: 200 }));
    expect(await reconcileWompiEvent(body, { WOMPI_PRIVATE_KEY: 'prv_test_key', WOMPI_ENVIRONMENT: 'sandbox' } as any)).toEqual({ transaction: payment });
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://sandbox.wompi.co/v1/transactions/wompi-tx-1');
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer prv_test_key');
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ data: { ...payment, amount_in_cents: 1 } }), { status: 200 }));
    expect(await reconcileWompiEvent(body, { WOMPI_PRIVATE_KEY: 'prv_test_key', WOMPI_ENVIRONMENT: 'sandbox' } as any)).toBeNull();
  });

  it('processes the signed webhook route only after API reconciliation', async () => {
    const body = await signedEvent();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: payment }), { status: 200 }));
    const payments = { processWompiWebhook: vi.fn().mockResolvedValue({ success: true, ignored: true }) };
    const app = PaymentsController.createRoutes(payments as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    const response = await app.fetch(new Request('https://shop.test/api/v1/webhooks/wompi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), {
      WOMPI_EVENTS_SECRET: secret, WOMPI_PRIVATE_KEY: 'prv_test_key', WOMPI_ENVIRONMENT: 'sandbox',
    } as any);
    expect(response.status).toBe(200);
    expect(payments.processWompiWebhook).toHaveBeenCalledWith(expect.objectContaining({ eventId: body.signature.checksum, payload: expect.objectContaining({ data: expect.objectContaining({ transaction: payment }) }) }));
  });
});
