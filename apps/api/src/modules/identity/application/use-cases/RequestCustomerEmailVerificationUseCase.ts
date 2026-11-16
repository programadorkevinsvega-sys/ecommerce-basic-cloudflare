import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { ICustomerAuthRepository } from '../../domain/repositories/ICustomerAuthRepository.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { CustomerAuthEmailRequestFactory } from '../services/CustomerAuthEmailRequestFactory.js';

export class RequestCustomerEmailVerificationUseCase {
  public constructor(
    private readonly customers: ICustomerRepository,
    private readonly auth: ICustomerAuthRepository,
  ) {}

  public async execute(customerId: string, publicOrigin: string): Promise<void> {
    CustomerAuthEmailRequestFactory.validatePublicOrigin(publicOrigin);
    const customer = await this.customers.findById(customerId);
    if (!customer?.isActive || customer.emailVerified) return;

    const rawToken = SessionTokenGenerator.generateRawToken();
    const now = new Date();
    const request = CustomerAuthEmailRequestFactory.create(
      'email_verification', customer.email, rawToken, publicOrigin, now,
    );
    await this.auth.issueEmailActionToken(
      customer.id, 'email_verification', await SessionTokenGenerator.hashToken(rawToken),
      new Date(now.getTime() + 60 * 60_000).toISOString(), now.toISOString(),
      new Date(now.getTime() - 60_000).toISOString(),
      new Date(now.getTime() - 60 * 60_000).toISOString(), request,
    );
  }
}
