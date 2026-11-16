import { Customer } from '../entities/Customer.js';
import { CustomerAuthEmailRequest, CustomerAuthEmailType } from '../ports/CustomerAuthEmailRequest.js';

export interface ICustomerAuthRepository {
  registerWithVerification(
    customer: Customer, tokenHash: string, expiresAt: string, email: CustomerAuthEmailRequest
  ): Promise<boolean>;
  issueEmailActionToken(
    customerId: string, purpose: CustomerAuthEmailType, tokenHash: string, expiresAt: string,
    issuedAt: string, oneMinuteAgo: string, oneHourAgo: string, email: CustomerAuthEmailRequest
  ): Promise<boolean>;
  verifyEmail(tokenHash: string, now: string): Promise<boolean>;
  resetPassword(tokenHash: string, passwordHash: string, now: string): Promise<boolean>;
}
