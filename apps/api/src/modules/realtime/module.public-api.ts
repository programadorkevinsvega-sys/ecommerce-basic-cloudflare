import { RealtimeModuleContainer } from './module.config.js';
import { PublishNotificationCommand } from './application/use-cases/PublishNotificationUseCase.js';
import { GetNotificationsQuery } from './application/use-cases/GetNotificationsUseCase.js';
import { RealtimeNotification } from './domain/entities/RealtimeNotification.js';

export class RealtimePublicApi {
  private readonly container: RealtimeModuleContainer;

  public constructor(container: RealtimeModuleContainer) {
    this.container = container;
  }

  public async publishNotification(cmd: PublishNotificationCommand): Promise<RealtimeNotification> {
    return this.container.publishNotificationUseCase.execute(cmd);
  }

  public async getNotifications(query: GetNotificationsQuery): Promise<RealtimeNotification[]> {
    return this.container.getNotificationsUseCase.execute(query);
  }

  public async markNotificationsRead(ids: string[]): Promise<void> {
    return this.container.markNotificationsReadUseCase.execute(ids);
  }
}
