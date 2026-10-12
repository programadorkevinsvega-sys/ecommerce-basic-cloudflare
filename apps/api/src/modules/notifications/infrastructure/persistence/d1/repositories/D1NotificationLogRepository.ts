import { INotificationLogRepository, NotificationLogEntry } from '../../../../domain/ports/INotificationLogRepository.js';

export class D1NotificationLogRepository implements INotificationLogRepository {
  constructor(private readonly db: D1Database) {}

  public async findByIdempotencyKey(key: string): Promise<NotificationLogEntry | null> {
    const row = await this.db
      .prepare(`SELECT * FROM notifications_log WHERE idempotency_key = ?`)
      .bind(key)
      .first<Record<string, unknown>>();

    return row ? this.mapRow(row) : null;
  }

  public async save(entry: NotificationLogEntry): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO notifications_log (
          id, recipient_email, template_name, subject, status, provider,
          provider_message_id, idempotency_key, error_message, created_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(idempotency_key) DO NOTHING
      `)
      .bind(
        entry.id,
        entry.recipientEmail,
        entry.templateName,
        entry.subject,
        entry.status,
        entry.provider,
        entry.providerMessageId || null,
        entry.idempotencyKey,
        entry.errorMessage || null,
        entry.createdAt,
        entry.sentAt || null
      )
      .run();
  }

  public async updateStatus(id: string, status: 'sent' | 'failed', providerMessageId?: string, error?: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .prepare(`UPDATE notifications_log SET status = ?, provider_message_id = ?, error_message = ?, sent_at = ? WHERE id = ?`)
      .bind(status, providerMessageId || null, error || null, status === 'sent' ? now : null, id)
      .run();
  }

  public async list(limit = 50): Promise<NotificationLogEntry[]> {
    const res = await this.db
      .prepare(`SELECT * FROM notifications_log ORDER BY created_at DESC LIMIT ?`)
      .bind(limit)
      .all<Record<string, unknown>>();

    return (res.results || []).map((r) => this.mapRow(r));
  }

  private mapRow(r: Record<string, unknown>): NotificationLogEntry {
    return {
      id: r.id as string,
      recipientEmail: r.recipient_email as string,
      templateName: r.template_name as string,
      subject: r.subject as string,
      status: r.status as any,
      provider: r.provider as string,
      providerMessageId: (r.provider_message_id as string) || null,
      idempotencyKey: r.idempotency_key as string,
      errorMessage: (r.error_message as string) || null,
      createdAt: r.created_at as string,
      sentAt: (r.sent_at as string) || null,
    };
  }
}
