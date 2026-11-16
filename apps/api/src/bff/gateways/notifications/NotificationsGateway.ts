import { SendEmailCommand } from '../../../modules/notifications/application/use-cases/SendTransactionalEmailUseCase.js';
import { EmailSendResult } from '../../../modules/notifications/domain/ports/IEmailPort.js';
import { NotificationLogEntry } from '../../../modules/notifications/domain/ports/INotificationLogRepository.js';

export interface CustomerAuthEmailGatewayInput {
  eventId: string;
  emailType: 'email_verification' | 'password_reset';
  recipientEmail: string;
  actionUrl: string;
}

export interface NotificationsGateway {
  sendEmail(cmd: SendEmailCommand): Promise<EmailSendResult>;
  sendCustomerAuthEmail(cmd: CustomerAuthEmailGatewayInput): Promise<EmailSendResult>;
  listLogs(limit?: number): Promise<NotificationLogEntry[]>;
}
