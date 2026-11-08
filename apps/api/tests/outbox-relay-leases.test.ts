import { describe, expect, it, vi } from 'vitest';
import { createTestRelay, FakeOutboxD1 } from './OutboxRelayTestD1.js';

describe('OutboxRelayService leases and quarantine', () => {
  it('prevents overlapping relays from publishing a currently leased event', async () => {
    const db = new FakeOutboxD1();
    let unblockSend: () => void = () => undefined;
    let markSendStarted: () => void = () => undefined;
    const sendStarted = new Promise<void>((resolve) => { markSendStarted = resolve; });
    const send = vi.fn(() => new Promise<void>((resolve) => {
      unblockSend = resolve;
      markSendStarted();
    }));
    const { relay, loggerOutput } = createTestRelay(db, send);

    const firstRun = relay.relayPendingEvents();
    await sendStarted;
    await expect(relay.relayPendingEvents()).resolves.toBe(0);
    unblockSend();
    await expect(firstRun).resolves.toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
    loggerOutput.mockRestore();
  });

  it('recovers expired leases and quarantines unregistered contracts', async () => {
    const db = new FakeOutboxD1();
    db.row.status = 'publishing';
    db.row.lease_expires_at = '2000-01-01T00:00:00.000Z';
    const send = vi.fn().mockResolvedValue(undefined);
    const { relay, loggerOutput } = createTestRelay(db, send);

    await expect(relay.relayPendingEvents()).resolves.toBe(1);
    expect(db.row.status).toBe('published');

    db.row.status = 'pending';
    db.row.event_type = 'wishlist.item.added.v1';
    await expect(relay.relayPendingEvents()).resolves.toBe(0);
    expect(db.row.status).toBe('failed');
    expect(send).toHaveBeenCalledTimes(1);
    loggerOutput.mockRestore();
  });

  it('fails an expired lease when the attempt budget is exhausted', async () => {
    const db = new FakeOutboxD1();
    db.row.status = 'publishing';
    db.row.attempts = 5;
    db.row.lease_expires_at = '2000-01-01T00:00:00.000Z';
    const send = vi.fn().mockResolvedValue(undefined);
    const { relay, loggerOutput } = createTestRelay(db, send);

    await expect(relay.relayPendingEvents()).resolves.toBe(0);

    expect(db.row.status).toBe('failed');
    expect(db.row.lease_expires_at).toBeNull();
    expect(send).not.toHaveBeenCalled();
    loggerOutput.mockRestore();
  });
});
