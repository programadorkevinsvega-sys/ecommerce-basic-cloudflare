import { IntegrationEvent } from '../messaging/IntegrationEvent.js';
import { JsonLogger } from '../JsonLogger.js';

export class OutboxRelayService {
  private readonly db: D1Database;
  private readonly queue: Queue;
  private readonly logger: JsonLogger;

  public constructor(db: D1Database, queue: Queue) {
    this.db = db;
    this.queue = queue;
    this.logger = new JsonLogger('outbox-relay');
  }

  public async relayPendingEvents(tableName: string, producerModule: string, limit = 50): Promise<number> {
    const query = `
      SELECT id, event_id, event_type, event_version, payload, trace_id, created_at, attempts
      FROM ${tableName}
      WHERE status = 'pending' AND attempts < 5
      ORDER BY created_at ASC
      LIMIT ?
    `;

    const { results } = await this.db.prepare(query).bind(limit).all();
    if (!results || results.length === 0) {
      return 0;
    }

    let publishedCount = 0;

    for (const row of results) {
      const id = row.id as string;
      const eventId = row.event_id as string;
      const eventType = row.event_type as string;
      const eventVersion = Number(row.event_version);
      const rawPayload = row.payload as string;
      const traceId = row.trace_id as string;
      const createdAt = row.created_at as string;

      try {
        const payload = JSON.parse(rawPayload);
        const event: IntegrationEvent = {
          eventId,
          eventType,
          eventVersion,
          occurredAt: createdAt,
          producerModule,
          payload,
          traceId,
        };

        await this.queue.send(event);

        await this.db
          .prepare(`UPDATE ${tableName} SET status = 'published', published_at = ? WHERE id = ?`)
          .bind(new Date().toISOString(), id)
          .run();

        publishedCount++;
      } catch (err) {
        this.logger.error(`Error publicando outbox event ${id} de ${tableName}`, err);
        await this.db
          .prepare(`UPDATE ${tableName} SET attempts = attempts + 1, status = CASE WHEN attempts >= 4 THEN 'failed' ELSE 'pending' END WHERE id = ?`)
          .bind(id)
          .run();
      }
    }

    return publishedCount;
  }
}
