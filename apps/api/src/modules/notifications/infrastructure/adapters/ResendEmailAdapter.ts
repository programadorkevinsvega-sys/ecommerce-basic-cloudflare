import { IEmailPort, EmailMessage, EmailSendResult } from '../../domain/ports/IEmailPort.js';

export class ResendEmailAdapter implements IEmailPort {
  private readonly defaultFrom: string;

  constructor(
    private readonly apiKey?: string,
    fromEmail?: string
  ) {
    if (!fromEmail) {
      this.defaultFrom = 'Vega Store <pedidos@vegastore.com>';
    } else if (fromEmail.includes('<') && fromEmail.includes('>')) {
      this.defaultFrom = fromEmail;
    } else {
      this.defaultFrom = `Vega Store <${fromEmail}>`;
    }
  }

  public async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.apiKey) {
      return { success: false, error: 'El proveedor de correo no está configurado' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.idempotencyKey,
        },
        body: JSON.stringify({
          from: this.defaultFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          attachments: message.attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
          })),
        }),
      });

      if (!res.ok) {
        return { success: false, error: `El proveedor de correo rechazó la solicitud (${res.status})` };
      }

      const data = await res.json() as { id?: string };
      return { success: true, messageId: data.id };
    } catch {
      return { success: false, error: 'No fue posible contactar al proveedor de correo' };
    }
  }
}
