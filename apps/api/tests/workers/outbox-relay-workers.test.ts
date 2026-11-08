import { beforeAll, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { OutboxRelayService } from '../../src/platform/outbox/OutboxRelayService.js';

async function applyInvoicingMigrations(): Promise<void> {
  for (const version of ['0001', '0002', '0003', '0004']) {
    const migration = env.TEST_MIGRATIONS.find((item) => item.name.startsWith(`invoicing__${version}_`));
    if (!migration) throw new Error(`Missing invoicing migration ${version}`);
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
}

async function insertEvent(eventId: string, eventType = 'invoicing.invoice.issue.requested'): Promise<void> {
  const now = new Date().toISOString();
  const payload = JSON.stringify({ invoiceId: crypto.randomUUID() });
  await env.DB.prepare(`
    INSERT INTO invoicing_outbox_events
      (id, event_type, payload_json, created_at, event_id, event_version, payload, trace_id, status, attempts)
    VALUES (?, ?, ?, ?, ?, 1, ?, 'test-trace', 'pending', 0)
  `).bind(eventId, eventType, payload, now, eventId, payload).run();
}

function relay(send: ReturnType<typeof vi.fn>) {
  return new OutboxRelayService(env.DB, { send } as unknown as Queue);
}

describe('OutboxRelayService with D1', () => {
  beforeAll(applyInvoicingMigrations);

  it('claims and publishes once across overlapping relay invocations', async () => {
    const eventId = crypto.randomUUID();
    await insertEvent(eventId);
    let releaseSend: () => void = () => undefined;
    let signalSendStarted: () => void = () => undefined;
    const sendStarted = new Promise<void>((resolve) => { signalSendStarted = resolve; });
    const send = vi.fn(() => new Promise<void>((resolve) => {
      releaseSend = resolve;
      signalSendStarted();
    }));
    const service = relay(send);

    const first = service.relayPendingEvents();
    await sendStarted;
    await expect(service.relayPendingEvents()).resolves.toBe(0);
    releaseSend();
    await expect(first).resolves.toBe(1);

    const row = await env.DB.prepare('SELECT status, lease_token FROM invoicing_outbox_events WHERE event_id = ?')
      .bind(eventId).first<{ status: string; lease_token: string | null }>();
    expect(row).toEqual({ status: 'published', lease_token: null });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('releases after send failure and reclaims an expired lease', async () => {
    const eventId = crypto.randomUUID();
    await insertEvent(eventId);
    const send = vi.fn().mockRejectedValueOnce(new Error('queue unavailable')).mockResolvedValue(undefined);
    const service = relay(send);

    await expect(service.relayPendingEvents()).resolves.toBe(0);
    const afterFailure = await env.DB.prepare('SELECT status FROM invoicing_outbox_events WHERE event_id = ?')
      .bind(eventId).first<{ status: string }>();
    expect(afterFailure?.status).toBe('pending');

    await env.DB.prepare(`
      UPDATE invoicing_outbox_events SET status = 'publishing', lease_expires_at = '2000-01-01T00:00:00.000Z'
      WHERE event_id = ?
    `).bind(eventId).run();
    await expect(service.relayPendingEvents()).resolves.toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('quarantines an event with no registered contract without sending it', async () => {
    const eventId = crypto.randomUUID();
    await insertEvent(eventId, 'wishlist.item.added.v1');
    const send = vi.fn();

    await expect(relay(send).relayPendingEvents()).resolves.toBe(0);

    const row = await env.DB.prepare('SELECT status FROM invoicing_outbox_events WHERE event_id = ?')
      .bind(eventId).first<{ status: string }>();
    expect(row?.status).toBe('failed');
    expect(send).not.toHaveBeenCalled();
  });
});