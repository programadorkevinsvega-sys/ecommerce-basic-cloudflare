export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailPort {
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
}
