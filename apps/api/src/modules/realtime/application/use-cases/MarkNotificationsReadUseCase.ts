import { IRealtimeRepository } from '../../domain/ports/IRealtimeRepository.js';

export class MarkNotificationsReadUseCase {
  public constructor(private readonly repo: IRealtimeRepository) {}

  public async execute(notificationIds: string[]): Promise<void> {
    await this.repo.markAsRead(notificationIds);
  }
}
