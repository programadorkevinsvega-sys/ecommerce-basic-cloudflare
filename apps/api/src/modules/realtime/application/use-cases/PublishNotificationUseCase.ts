import { IRealtimeRepository } from '../../domain/ports/IRealtimeRepository.js';
import { RealtimeNotification } from '../../domain/entities/RealtimeNotification.js';

export interface PublishNotificationCommand {
  channel: string;
  recipientId?: string;
  eventType: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class PublishNotificationUseCase {
  public constructor(private readonly repo: IRealtimeRepository) {}

  public async execute(cmd: PublishNotificationCommand): Promise<RealtimeNotification> {
    const notification = new RealtimeNotification({
      id: crypto.randomUUID(),
      channel: cmd.channel,
      recipientId: cmd.recipientId,
      eventType: cmd.eventType,
      title: cmd.title,
      body: cmd.body,
      data: cmd.data,
      read: false,
      createdAt: new Date().toISOString(),
    });

    await this.repo.save(notification);
    return notification;
  }
}
