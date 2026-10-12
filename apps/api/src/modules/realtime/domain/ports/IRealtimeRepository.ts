import { RealtimeNotification } from '../entities/RealtimeNotification.js';

export interface IRealtimeRepository {
  save(notification: RealtimeNotification): Promise<void>;
  list(channel: string, since?: string, recipientId?: string, limit?: number): Promise<RealtimeNotification[]>;
  markAsRead(notificationIds: string[]): Promise<void>;
}
