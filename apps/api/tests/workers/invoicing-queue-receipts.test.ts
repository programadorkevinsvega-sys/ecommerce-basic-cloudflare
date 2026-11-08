import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1QueueEventReceiptRepository } from '../../src/modules/invoicing/infrastructure/persistence/d1/repositories/D1QueueEventReceiptRepository.js';
import { ProcessInvoicingQueueEventUseCase } from '../../src/modules/invoicing/application/use-cases/ProcessInvoicingQueueEventUseCase.js';

async function applyInvoicingMigrations(): Promise<void> {
  for (const version of ['0001', '0002', '0003', '0004']) {
    const migration = env.TEST_MIGRATIONS.find((item) => item.name.startsWith(`invoicing__${version}_`));
    if (!migration) throw new Error(`Missing invoicing migration ${version}`);
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
}

describe('invoicing queue event receipts', () => {
  beforeAll(applyInvoicingMigrations);

  it('claims an event once under concurrency and acknowledges only a completed replay', async () => {
    const repo = new D1QueueEventReceiptRepository(env.DB);
    const eventId = crypto.randomUUID();
    const eventType = 'invoicing.invoice.issue.requested';

    const claims = await Promise.all([
      repo.claim(eventId, eventType),
      repo.claim(eventId, eventType),
    ]);
    const winner = claims.find((claim) => claim.status === 'claimed');
    expect(winner?.status).toBe('claimed');
    expect(claims.filter((claim) => claim.status === 'busy')).toHaveLength(1);
    if (winner?.status !== 'claimed') throw new Error('Concurrent event claim did not produce a lease');

    await repo.complete(eventId, winner.leaseToken);
    expect((await repo.claim(eventId, eventType)).status).toBe('processed');
    expect((await repo.claim(eventId, 'invoicing.credit_note.issue.requested')).status).toBe('conflict');
  });

  it('reclaims a released or expired receipt lease', async () => {
    const repo = new D1QueueEventReceiptRepository(env.DB);
    const releasedId = crypto.randomUUID();
    const firstLease = await repo.claim(releasedId, 'invoicing.invoice.issue.requested');
    expect(firstLease.status).toBe('claimed');
    if (firstLease.status !== 'claimed') throw new Error('Event was not claimed');
    await repo.release(releasedId, firstLease.leaseToken);
    expect((await repo.claim(releasedId, 'invoicing.invoice.issue.requested')).status).toBe('claimed');

    const expiredId = crypto.randomUUID();
    const expiringLease = await repo.claim(expiredId, 'invoicing.invoice.issue.requested');
    expect(expiringLease.status).toBe('claimed');
    if (expiringLease.status !== 'claimed') throw new Error('Event was not claimed');
    await env.DB.prepare(`
      UPDATE invoicing_queue_event_receipts
      SET lease_expires_at = '2000-01-01T00:00:00.000Z'
      WHERE event_id = ?
    `).bind(expiredId).run();
    const replacementLease = await repo.claim(expiredId, 'invoicing.invoice.issue.requested');
    expect(replacementLease.status).toBe('claimed');
    await expect(repo.complete(expiredId, expiringLease.leaseToken)).rejects.toThrow('QUEUE_EVENT_RECEIPT_COMPLETION_FAILED');
    if (replacementLease.status !== 'claimed') throw new Error('Expired lease was not reclaimed');
    await repo.complete(expiredId, replacementLease.leaseToken);
  });

  it('runs one effect for concurrent delivery and a later replay', async () => {
    const repository = new D1QueueEventReceiptRepository(env.DB);
    let finishEffect: () => void = () => undefined;
    let effectStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => { effectStarted = resolve; });
    const effect = new Promise<void>((resolve) => { finishEffect = resolve; });
    let effectCount = 0;
    const processor = {
      execute: async () => {
        effectCount++;
        effectStarted();
        await effect;
      },
      executeCreditNote: async () => undefined,
    };
    const useCase = new ProcessInvoicingQueueEventUseCase(repository, processor);
    const event = {
      eventId: crypto.randomUUID(),
      eventType: 'invoicing.invoice.issue.requested' as const,
      entityId: crypto.randomUUID(),
    };

    const first = useCase.execute(event);
    await started;
    await expect(useCase.execute(event)).resolves.toBe('busy');
    finishEffect();
    await expect(first).resolves.toBe('processed');
    await expect(useCase.execute(event)).resolves.toBe('duplicate');
    expect(effectCount).toBe(1);
  });
});
