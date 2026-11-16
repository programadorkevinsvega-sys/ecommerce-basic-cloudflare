import { CustomerAuthEmailRequest, CustomerAuthEmailType } from '../../domain/ports/CustomerAuthEmailRequest.js';

const eventTypes: Record<CustomerAuthEmailType, string> = {
  email_verification: 'identity.customer.email_verification.requested',
  password_reset: 'identity.customer.password_reset.requested',
};

export class CustomerAuthEmailRequestFactory {
  public static create(
    type: CustomerAuthEmailType, email: string, token: string, publicOrigin: string, now = new Date()
  ): CustomerAuthEmailRequest {
    const origin = this.validatePublicOrigin(publicOrigin);
    const path = type === 'email_verification' ? '/auth/verify-email' : '/auth/reset-password';
    const actionUrl = new URL(path, origin);
    actionUrl.hash = new URLSearchParams({ token }).toString();
    return {
      eventId: crypto.randomUUID(),
      eventType: eventTypes[type],
      emailType: type,
      recipientEmail: email,
      actionUrl: actionUrl.toString(),
      traceId: crypto.randomUUID(),
      createdAt: now.toISOString(),
    };
  }

  public static validatePublicOrigin(publicOrigin: string): URL {
    const origin = new URL(publicOrigin);
    if (origin.protocol !== 'https:' && origin.hostname !== 'localhost') {
      throw new Error('PUBLIC_AUTH_ORIGIN_MUST_USE_HTTPS');
    }
    if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
      throw new Error('PUBLIC_AUTH_ORIGIN_INVALID');
    }
    return origin;
  }
}
