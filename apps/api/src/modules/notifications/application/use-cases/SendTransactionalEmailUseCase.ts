import { IEmailPort, EmailAttachment, EmailSendResult } from '../../domain/ports/IEmailPort.js';
import { INotificationLogRepository } from '../../domain/ports/INotificationLogRepository.js';

export interface SendEmailCommand {
  recipientEmail: string;
  templateName: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  attachments?: EmailAttachment[];
}

export class SendTransactionalEmailUseCase {
  constructor(
    private readonly emailPort: IEmailPort,
    private readonly logRepo: INotificationLogRepository
  ) {}

  public async execute(cmd: SendEmailCommand): Promise<EmailSendResult> {
    // 1. Idempotencia: si ya se envió con esta clave, retornar éxito
    const existing = await this.logRepo.findByIdempotencyKey(cmd.idempotencyKey);
    if (existing && existing.status === 'sent') {
      return { success: true, messageId: existing.providerMessageId || 'already_sent' };
    }

    const logId = existing?.id || `notif_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    if (!existing) {
      await this.logRepo.save({
        id: logId,
        recipientEmail: cmd.recipientEmail,
        templateName: cmd.templateName,
        subject: cmd.subject,
        status: 'pending',
        provider: 'resend',
        idempotencyKey: cmd.idempotencyKey,
        createdAt: now,
      });
    }

    // 2. Enviar por el puerto de email
    const result = await this.emailPort.sendEmail({
      to: cmd.recipientEmail,
      subject: cmd.subject,
      html: cmd.html,
      idempotencyKey: cmd.idempotencyKey,
      attachments: cmd.attachments,
    });

    // 3. Actualizar bitácora
    if (result.success) {
      await this.logRepo.updateStatus(logId, 'sent', result.messageId);
    } else {
      await this.logRepo.updateStatus(logId, 'failed', undefined, result.error);
    }

    return result;
  }
}
