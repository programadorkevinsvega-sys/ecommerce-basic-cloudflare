import { IInventoryOutboxRepository } from '../../../../domain/ports/IInventoryOutboxRepository.js';

export class D1InventoryOutboxRepository implements IInventoryOutboxRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async publish(eventName: string, payload: Record<string, unknown>): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO inventory_outbox_events (id, event_name, payload, status, created_at)
       VALUES (?, ?, ?, 'pending', ?)`
    ).bind(id, eventName, JSON.stringify(payload), now).run();
  }
}
