import { IRealtimeRepository } from '../../../../domain/ports/IRealtimeRepository.js';
import { RealtimeNotification } from '../../../../domain/entities/RealtimeNotification.js';

export class D1RealtimeRepository implements IRealtimeRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async save(notification: RealtimeNotification): Promise<void> {
    const q = `INSERT INTO realtime_notifications (
      id, channel, recipient_id, event_type, title, body, data_json, read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.prepare(q).bind(
      notification.id,
      notification.channel,
      notification.recipientId ?? null,
      notification.eventType,
      notification.title,
      notification.body,
      notification.data ? JSON.stringify(notification.data) : null,
      notification.read ? 1 : 0,
      notification.createdAt
    ).run();
  }

  public async list(channel: string, since?: string, recipientId?: string, limit = 50): Promise<RealtimeNotification[]> {
    let query = `SELECT * FROM realtime_notifications WHERE channel = ?`;
    const params: unknown[] = [channel];

    if (since) {
      query += ` AND created_at > ?`;
      params.push(since);
    }

    if (recipientId) {
      query += ` AND (recipient_id IS NULL OR recipient_id = ?)`;
      params.push(recipientId);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const res = await this.db.prepare(query).bind(...params).all<Record<string, unknown>>();
    return (res.results || []).map((r) => new RealtimeNotification({
      id: r.id as string,
      channel: r.channel as string,
      recipientId: (r.recipient_id as string) ?? null,
      eventType: r.event_type as string,
      title: r.title as string,
      body: r.body as string,
      data: r.data_json ? JSON.parse(r.data_json as string) : null,
      read: Number(r.read) === 1,
      createdAt: r.created_at as string,
    }));
  }

  public async markAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    const placeholders = notificationIds.map(() => '?').join(',');
    await this.db.prepare(
      `UPDATE realtime_notifications SET read = 1 WHERE id IN (${placeholders})`
    ).bind(...notificationIds).run();
  }
}
