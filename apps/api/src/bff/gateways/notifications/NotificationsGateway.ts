import { SendEmailCommand } from '../../../modules/notifications/application/use-cases/SendTransactionalEmailUseCase.js';
import { EmailSendResult } from '../../../modules/notifications/domain/ports/IEmailPort.js';
import { NotificationLogEntry } from '../../../modules/notifications/domain/ports/INotificationLogRepository.js';

export interface NotificationsGateway {
  sendEmail(cmd: SendEmailCommand): Promise<EmailSendResult>;
  listLogs(limit?: number): Promise<NotificationLogEntry[]>;
}
