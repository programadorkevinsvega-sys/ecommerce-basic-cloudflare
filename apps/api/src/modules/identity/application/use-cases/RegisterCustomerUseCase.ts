import { ICustomerAuthRepository } from '../../domain/repositories/ICustomerAuthRepository.js';
import { Customer } from '../../domain/entities/Customer.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { PasswordPolicy } from '../../domain/services/PasswordPolicy.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { CustomerAuthEmailRequestFactory } from '../services/CustomerAuthEmailRequestFactory.js';
import { ICustomerPasswordBreachChecker } from '../ports/ICustomerPasswordBreachChecker.js';
import { PasswordBreachCheckUnavailableError } from '../errors/PasswordBreachCheckUnavailableError.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface RegisterCustomerInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  publicOrigin: string;
}

export interface RegisterCustomerOutput { accepted: true; }

export class RegisterCustomerUseCase {
  public constructor(
    private readonly repository: ICustomerAuthRepository,
    private readonly breachChecker: ICustomerPasswordBreachChecker,
  ) {}

  public async execute(input: RegisterCustomerInput): Promise<Result<RegisterCustomerOutput, Error>> {
    CustomerAuthEmailRequestFactory.validatePublicOrigin(input.publicOrigin);
    if (!PasswordPolicy.isAcceptable(input.password)) return Result.fail(new Error('PASSWORD_POLICY_UNMET'));
    try {
      if (await this.breachChecker.isCompromised(input.password)) {
        return Result.fail(new Error('PASSWORD_COMPROMISED'));
      }
    } catch (error) {
      if (error instanceof PasswordBreachCheckUnavailableError) return Result.fail(error);
      throw error;
    }

    const passwordHash = await PasswordHasher.hash(input.password);
    const now = new Date().toISOString();

    const customer = Customer.create({
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim(),
      isActive: true,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    const rawToken = SessionTokenGenerator.generateRawToken();
    const email = CustomerAuthEmailRequestFactory.create(
      'email_verification', customer.email, rawToken, input.publicOrigin, new Date(now),
    );
    await this.repository.registerWithVerification(
      customer, await SessionTokenGenerator.hashToken(rawToken),
      new Date(Date.parse(now) + 60 * 60_000).toISOString(), email,
    );
    return Result.ok({ accepted: true });
  }
}
