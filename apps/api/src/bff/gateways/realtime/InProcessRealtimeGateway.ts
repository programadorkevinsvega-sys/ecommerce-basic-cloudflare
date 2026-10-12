import { RealtimeGateway } from './RealtimeGateway.js';
import { RealtimePublicApi } from '../../../modules/realtime/module.public-api.js';
import { PublishNotificationCommand } from '../../../modules/realtime/application/use-cases/PublishNotificationUseCase.js';
import { GetNotificationsQuery } from '../../../modules/realtime/application/use-cases/GetNotificationsUseCase.js';
import { RealtimeNotification } from '../../../modules/realtime/domain/entities/RealtimeNotification.js';

export class InProcessRealtimeGateway implements RealtimeGateway {
  private readonly publicApi: RealtimePublicApi;

  public constructor(publicApi: RealtimePublicApi) {
    this.publicApi = publicApi;
  }

  public async publishNotification(cmd: PublishNotificationCommand): Promise<RealtimeNotification> {
    return this.publicApi.publishNotification(cmd);
  }

  public async getNotifications(query: GetNotificationsQuery): Promise<RealtimeNotification[]> {
    return this.publicApi.getNotifications(query);
  }

  public async markNotificationsRead(ids: string[]): Promise<void> {
    return this.publicApi.markNotificationsRead(ids);
  }
}
