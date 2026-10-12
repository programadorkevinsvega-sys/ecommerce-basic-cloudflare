import { IPaymentOutboxRepository, PaymentOutboxEvent } from '../../../../domain/ports/IPaymentOutboxRepository.js';

export class D1PaymentOutboxRepository implements IPaymentOutboxRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async save(event: PaymentOutboxEvent): Promise<void> {
    await this.db.prepare(
      `INSERT INTO payments_outbox_events (id, event_type, payload_json, created_at)
       VALUES (?, ?, ?, ?)`
    ).bind(event.id, event.eventType, event.payload, event.createdAt).run();
  }
}
