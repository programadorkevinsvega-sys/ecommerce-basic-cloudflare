import { NotificationsModuleContainer } from './module.config.js';
import { SendEmailCommand } from './application/use-cases/SendTransactionalEmailUseCase.js';
import { EmailSendResult } from './domain/ports/IEmailPort.js';
import { NotificationLogEntry } from './domain/ports/INotificationLogRepository.js';

export class NotificationsPublicApi {
  constructor(private readonly container: NotificationsModuleContainer) {}

  public async sendEmail(cmd: SendEmailCommand): Promise<EmailSendResult> {
    return this.container.sendEmailUseCase.execute(cmd);
  }

  public async listLogs(limit = 50): Promise<NotificationLogEntry[]> {
    return this.container.logRepo.list(limit);
  }
}
