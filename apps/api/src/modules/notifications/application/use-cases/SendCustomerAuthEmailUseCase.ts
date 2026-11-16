import { EmailSendResult } from '../../domain/ports/IEmailPort.js';
import { SendTransactionalEmailUseCase } from './SendTransactionalEmailUseCase.js';

export interface CustomerAuthEmailInput {
  eventId: string;
  emailType: 'email_verification' | 'password_reset';
  recipientEmail: string;
  actionUrl: string;
}

export class SendCustomerAuthEmailUseCase {
  public constructor(private readonly sender: SendTransactionalEmailUseCase) {}

  public execute(input: CustomerAuthEmailInput): Promise<EmailSendResult> {
    const verification = input.emailType === 'email_verification';
    const subject = verification ? 'Verifica tu correo de Vega Store' : 'Restablece tu contraseña de Vega Store';
    const action = verification ? 'Verificar correo' : 'Cambiar contraseña';
    const safeUrl = escapeHtml(input.actionUrl);
    return this.sender.execute({
      recipientEmail: input.recipientEmail,
      templateName: verification ? 'customer_email_verification' : 'customer_password_reset',
      subject,
      html: `<p>Recibimos una solicitud para ${verification ? 'verificar tu correo' : 'restablecer tu contraseña'}.</p><p><a href="${safeUrl}">${action}</a></p><p>El enlace vence en una hora y solo puede usarse una vez. Si no solicitaste esta acción, ignora este mensaje.</p>`,
      text: `${action}: ${input.actionUrl}\nEl enlace vence en una hora y solo puede usarse una vez. Si no solicitaste esta acción, ignora este mensaje.`,
      idempotencyKey: `identity-auth:${input.eventId}`,
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char] || char));
}
