import { describe, expect, it, vi } from 'vitest';
import { createTestRelay, FakeOutboxD1 } from './OutboxRelayTestD1.js';

describe('OutboxRelayService publication', () => {
  it('publishes a versioned event and marks the row published', async () => {
    const db = new FakeOutboxD1();
    const send = vi.fn().mockResolvedValue(undefined);
    const { relay, loggerOutput } = createTestRelay(db, send);

    await expect(relay.relayPendingEvents()).resolves.toBe(1);

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      eventId: db.row.event_id,
      eventType: db.row.event_type,
      eventVersion: 1,
      producerModule: 'invoicing',
    }));
    expect(db.row.status).toBe('published');
    loggerOutput.mockRestore();
  });

  it('releases the claim after a send failure and retries it', async () => {
    const db = new FakeOutboxD1();
    const send = vi.fn().mockRejectedValueOnce(new Error('queue unavailable')).mockResolvedValue(undefined);
    const { relay, loggerOutput } = createTestRelay(db, send);

    await expect(relay.relayPendingEvents()).resolves.toBe(0);
    expect(db.row.status).toBe('pending');
    await expect(relay.relayPendingEvents()).resolves.toBe(1);
    expect(db.row.status).toBe('published');
    expect(send).toHaveBeenCalledTimes(2);
    loggerOutput.mockRestore();
  });

  it('resends the same event id after Queue accepts but the outbox update fails', async () => {
    const db = new FakeOutboxD1();
    db.failPublishedUpdate = true;
    const sentIds: string[] = [];
    const send = vi.fn(async (event: { eventId: string }) => { sentIds.push(event.eventId); });
    const { relay, loggerOutput } = createTestRelay(db, send);

    await expect(relay.relayPendingEvents()).resolves.toBe(0);
    expect(sentIds[0]).toBe(db.row.event_id);
    expect(db.row.status).toBe('pending');
    db.failPublishedUpdate = false;
    await expect(relay.relayPendingEvents()).resolves.toBe(1);
    expect(sentIds[1]).toBe(sentIds[0]);
    loggerOutput.mockRestore();
  });
});
