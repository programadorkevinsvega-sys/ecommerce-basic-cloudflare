import { NotificationsGateway } from './NotificationsGateway.js';
import { NotificationsPublicApi } from '../../../modules/notifications/module.public-api.js';
import { SendEmailCommand } from '../../../modules/notifications/application/use-cases/SendTransactionalEmailUseCase.js';
import { EmailSendResult } from '../../../modules/notifications/domain/ports/IEmailPort.js';
import { NotificationLogEntry } from '../../../modules/notifications/domain/ports/INotificationLogRepository.js';

export class InProcessNotificationsGateway implements NotificationsGateway {
  constructor(private readonly publicApi: NotificationsPublicApi) {}

  public async sendEmail(cmd: SendEmailCommand): Promise<EmailSendResult> {
    return this.publicApi.sendEmail(cmd);
  }

  public async listLogs(limit = 50): Promise<NotificationLogEntry[]> {
    return this.publicApi.listLogs(limit);
  }
}
