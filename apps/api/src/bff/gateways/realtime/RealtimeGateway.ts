import { PublishNotificationCommand } from '../../../modules/realtime/application/use-cases/PublishNotificationUseCase.js';
import { GetNotificationsQuery } from '../../../modules/realtime/application/use-cases/GetNotificationsUseCase.js';
import { RealtimeNotification } from '../../../modules/realtime/domain/entities/RealtimeNotification.js';

export interface RealtimeGateway {
  publishNotification(cmd: PublishNotificationCommand): Promise<RealtimeNotification>;
  getNotifications(query: GetNotificationsQuery): Promise<RealtimeNotification[]>;
  markNotificationsRead(ids: string[]): Promise<void>;
}
