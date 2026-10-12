export interface NotificationLogEntry {
  id: string;
  recipientEmail: string;
  templateName: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  provider: string;
  providerMessageId?: string | null;
  idempotencyKey: string;
  errorMessage?: string | null;
  createdAt: string;
  sentAt?: string | null;
}

export interface INotificationLogRepository {
  findByIdempotencyKey(key: string): Promise<NotificationLogEntry | null>;
  save(entry: NotificationLogEntry): Promise<void>;
  updateStatus(id: string, status: 'sent' | 'failed', providerMessageId?: string, error?: string): Promise<void>;
  list(limit?: number): Promise<NotificationLogEntry[]>;
}
