export interface EmailAttachment {
  filename: string;
  content: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailPort {
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
}
