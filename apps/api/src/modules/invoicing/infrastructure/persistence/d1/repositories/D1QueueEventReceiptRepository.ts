import { QueueEventClaim, IQueueEventReceiptRepository } from '../../../../domain/ports/IQueueEventReceiptRepository.js';

type ReceiptRow = { status: 'processing' | 'pending' | 'processed'; event_type: string };

export class D1QueueEventReceiptRepository implements IQueueEventReceiptRepository {
  constructor(private readonly db: D1Database) {}

  public async claim(eventId: string, eventType: string): Promise<QueueEventClaim> {
    const now = new Date();
    const nowIso = now.toISOString();
    const leaseToken = crypto.randomUUID();
    const leaseUntil = new Date(now.getTime() + 90_000).toISOString();
    const result = await this.db.prepare(`
      INSERT INTO invoicing_queue_event_receipts
        (event_id, event_type, status, attempts, lease_expires_at, lease_token, created_at, updated_at)
      VALUES (?, ?, 'processing', 1, ?, ?, ?, ?)
      ON CONFLICT(event_id) DO UPDATE SET
        status = 'processing',
        attempts = invoicing_queue_event_receipts.attempts + 1,
        lease_expires_at = excluded.lease_expires_at,
        lease_token = excluded.lease_token,
        updated_at = excluded.updated_at
      WHERE invoicing_queue_event_receipts.event_type = excluded.event_type
        AND invoicing_queue_event_receipts.status != 'processed'
        AND (invoicing_queue_event_receipts.status != 'processing'
          OR invoicing_queue_event_receipts.lease_expires_at <= ?)
    `).bind(eventId, eventType, leaseUntil, leaseToken, nowIso, nowIso, nowIso).run();

    if ((result.meta?.changes || 0) > 0) return { status: 'claimed', leaseToken };
    const existing = await this.db.prepare(
      'SELECT status, event_type FROM invoicing_queue_event_receipts WHERE event_id = ?'
    ).bind(eventId).first<ReceiptRow>();
    if (existing && existing.event_type !== eventType) return { status: 'conflict' };
    if (existing?.status === 'processed') return { status: 'processed' };
    return { status: 'busy' };
  }

  public async complete(eventId: string, leaseToken: string): Promise<void> {
    const result = await this.db.prepare(`
      UPDATE invoicing_queue_event_receipts
      SET status = 'processed', lease_expires_at = NULL, lease_token = NULL, completed_at = ?, updated_at = ?
      WHERE event_id = ? AND status = 'processing' AND lease_token = ?
    `).bind(new Date().toISOString(), new Date().toISOString(), eventId, leaseToken).run();
    if ((result.meta?.changes || 0) !== 1) throw new Error('QUEUE_EVENT_RECEIPT_COMPLETION_FAILED');
  }

  public async release(eventId: string, leaseToken: string): Promise<void> {
    await this.db.prepare(`
      UPDATE invoicing_queue_event_receipts
      SET status = 'pending', lease_expires_at = NULL, lease_token = NULL, updated_at = ?
      WHERE event_id = ? AND status = 'processing' AND lease_token = ?
    `).bind(new Date().toISOString(), eventId, leaseToken).run();
  }
}
