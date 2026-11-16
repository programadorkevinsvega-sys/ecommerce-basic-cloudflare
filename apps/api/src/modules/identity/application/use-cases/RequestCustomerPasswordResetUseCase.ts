import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { ICustomerAuthRepository } from '../../domain/repositories/ICustomerAuthRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { CustomerAuthEmailRequestFactory } from '../services/CustomerAuthEmailRequestFactory.js';

export class RequestCustomerPasswordResetUseCase {
  public constructor(
    private readonly customers: ICustomerRepository,
    private readonly auth: ICustomerAuthRepository,
  ) {}

  public async execute(email: string, publicOrigin: string): Promise<void> {
    CustomerAuthEmailRequestFactory.validatePublicOrigin(publicOrigin);
    await PasswordHasher.verifyAgainstDummy('auth-request-equalizer');
    const customer = await this.customers.findByEmail(email);
    if (!customer?.isActive) return;

    const rawToken = SessionTokenGenerator.generateRawToken();
    const now = new Date();
    const request = CustomerAuthEmailRequestFactory.create(
      'password_reset', customer.email, rawToken, publicOrigin, now,
    );
    await this.auth.issueEmailActionToken(
      customer.id, 'password_reset', await SessionTokenGenerator.hashToken(rawToken),
      new Date(now.getTime() + 60 * 60_000).toISOString(), now.toISOString(),
      new Date(now.getTime() - 60_000).toISOString(),
      new Date(now.getTime() - 60 * 60_000).toISOString(), request,
    );
  }
}
