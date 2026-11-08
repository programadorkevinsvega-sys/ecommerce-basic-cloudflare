import { beforeEach, describe, expect, it, vi } from 'vitest';

const { processQueueEvent } = vi.hoisted(() => ({ processQueueEvent: vi.fn() }));

vi.mock('../src/composition-root.js', () => ({
  buildCompositionRoot: vi.fn(() => ({ invoicingGateway: { processQueueEvent } })),
}));

import worker from '../src/index.js';

function message(body: unknown) {
  return { id: 'test-message', body, ack: vi.fn(), retry: vi.fn() };
}

function envelope(eventType: string, payload: Record<string, string>, producerModule = 'invoicing') {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    producerModule,
    payload,
    traceId: crypto.randomUUID(),
  };
}

async function consume(item: ReturnType<typeof message>): Promise<void> {
  await worker.queue({
    queue: 'events',
    messages: [item],
  } as any, {} as any, {} as any);
}

describe('queue consumer security', () => {
  beforeEach(() => processQueueEvent.mockReset());

  it('retries unsupported event types without acking them', async () => {
    const item = message(envelope('wishlist.item.added.v1', { customerId: 'customer-1' }, 'wishlist'));

    await consume(item);

    expect(item.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
    expect(item.ack).not.toHaveBeenCalled();
    expect(processQueueEvent).not.toHaveBeenCalled();
  });

  it('acks supported events only after processing resolves', async () => {
    processQueueEvent.mockResolvedValue('processed');
    const item = message(envelope('invoicing.invoice.issue.requested', { invoiceId: 'inv_123' }));

    await consume(item);

    expect(processQueueEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventId: expect.any(String),
      eventType: 'invoicing.invoice.issue.requested',
      entityId: 'inv_123',
    }));
    expect(item.retry).not.toHaveBeenCalled();
    expect(item.ack).toHaveBeenCalledTimes(1);
  });

  it('retries when the persistent receipt claim is busy', async () => {
    processQueueEvent.mockResolvedValue('busy');
    const item = message(envelope('invoicing.credit_note.issue.requested', { creditNoteId: 'cn_456' }));

    await consume(item);

    expect(item.retry).toHaveBeenCalledWith({ delaySeconds: 10 });
    expect(item.ack).not.toHaveBeenCalled();
  });

  it('acks a replay only when the consumer reports a completed duplicate', async () => {
    processQueueEvent.mockResolvedValue('duplicate');
    const item = message(envelope('invoicing.invoice.issue.requested', { invoiceId: 'inv_123' }));

    await consume(item);

    expect(item.ack).toHaveBeenCalledTimes(1);
    expect(item.retry).not.toHaveBeenCalled();
  });

  it('retries an event version without a registered handler', async () => {
    const body = envelope('invoicing.invoice.issue.requested', { invoiceId: 'inv_123' });
    body.eventVersion = 2;
    const item = message(body);

    await consume(item);

    expect(item.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
    expect(item.ack).not.toHaveBeenCalled();
    expect(processQueueEvent).not.toHaveBeenCalled();
  });

  it('rejects malformed supported events rather than acknowledging them', async () => {
    const item = message(envelope('invoicing.invoice.issue.requested', { invoiceId: '' }));

    await consume(item);

    expect(item.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
    expect(item.ack).not.toHaveBeenCalled();
    expect(processQueueEvent).not.toHaveBeenCalled();
  });
});
