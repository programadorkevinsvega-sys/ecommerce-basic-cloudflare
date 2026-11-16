export type CustomerAuthEmailType = 'email_verification' | 'password_reset';

export interface CustomerAuthEmailRequest {
  eventId: string;
  eventType: string;
  emailType: CustomerAuthEmailType;
  recipientEmail: string;
  actionUrl: string;
  traceId: string;
  createdAt: string;
}
