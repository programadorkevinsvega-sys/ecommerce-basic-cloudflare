import { ICartOutboxRepository } from '../../../../domain/ports/ICartOutboxRepository.js';

export class D1CartOutboxRepository implements ICartOutboxRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async publish(eventName: string, payload: Record<string, unknown>): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO cart_outbox_events (id, event_name, payload, status, created_at)
       VALUES (?, ?, ?, 'pending', ?)`
    ).bind(id, eventName, JSON.stringify(payload), now).run();
  }
}
