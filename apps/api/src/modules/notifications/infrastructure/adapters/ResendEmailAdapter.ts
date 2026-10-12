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
      // Modo desarrollo / fallback sin API key
      console.log(`[ResendEmailAdapter:Mock] To: ${message.to} | Subject: ${message.subject} | Key: ${message.idempotencyKey}`);
      return {
        success: true,
        messageId: `mock_${crypto.randomUUID()}`,
      };
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
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Resend error (${res.status}): ${errText}` };
      }

      const data = await res.json() as { id?: string };
      return { success: true, messageId: data.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
