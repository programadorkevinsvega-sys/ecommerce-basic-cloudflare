import { IRealtimeRepository } from '../../domain/ports/IRealtimeRepository.js';
import { RealtimeNotification } from '../../domain/entities/RealtimeNotification.js';

export interface GetNotificationsQuery {
  channel: string;
  since?: string;
  recipientId?: string;
  limit?: number;
}

export class GetNotificationsUseCase {
  public constructor(private readonly repo: IRealtimeRepository) {}

  public async execute(query: GetNotificationsQuery): Promise<RealtimeNotification[]> {
    return this.repo.list(query.channel, query.since, query.recipientId, query.limit);
  }
}
