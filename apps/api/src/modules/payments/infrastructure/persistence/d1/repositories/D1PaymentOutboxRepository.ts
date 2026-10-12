import { IPaymentOutboxRepository, PaymentOutboxEvent } from '../../../../domain/ports/IPaymentOutboxRepository.js';

export class D1PaymentOutboxRepository implements IPaymentOutboxRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async save(event: PaymentOutboxEvent): Promise<void> {
    await this.db.prepare(
      // Escribe en columnas nuevas (event_type, payload_json) Y originales NOT NULL (event_name, payload)
      `INSERT INTO payments_outbox_events (id, event_type, payload_json, event_name, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`
    ).bind(event.id, event.eventType, event.payload, event.eventType, event.payload, event.createdAt).run();
  }
}
