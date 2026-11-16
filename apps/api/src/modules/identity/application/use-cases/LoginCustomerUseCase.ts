import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { ICustomerLoginAttemptRepository } from '../../domain/repositories/ICustomerLoginAttemptRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { Session } from '../../domain/entities/Session.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface LoginCustomerInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginCustomerOutput {
  rawToken: string;
  expiresAt: string;
  customer: {
    id: string;
    email: string;
    fullName: string;
  };
}

export class LoginCustomerUseCase {
  private readonly customerRepo: ICustomerRepository;
  private readonly sessionRepo: ISessionRepository;
  private readonly loginAttempts: ICustomerLoginAttemptRepository;

  public constructor(customerRepo: ICustomerRepository, sessionRepo: ISessionRepository, loginAttempts: ICustomerLoginAttemptRepository) {
    this.customerRepo = customerRepo;
    this.sessionRepo = sessionRepo;
    this.loginAttempts = loginAttempts;
  }

  public async execute(input: LoginCustomerInput): Promise<Result<LoginCustomerOutput, Error>> {
    const accountKeyHash = await SessionTokenGenerator.hashToken(input.email.trim().toLowerCase());
    const remainingDelay = await this.loginAttempts.getRemainingDelay(accountKeyHash, Date.now());
    if (remainingDelay > 0) await new Promise<void>((resolve) => setTimeout(resolve, remainingDelay));
    const customer = await this.customerRepo.findByEmail(input.email);
    if (!customer || !customer.isActive) {
      await PasswordHasher.verifyAgainstDummy(input.password);
      await this.recordFailure(accountKeyHash, customer?.id || null);
      return Result.fail(new Error('Credenciales inválidas'));
    }

    const isValid = await PasswordHasher.verify(input.password, customer.passwordHash);
    if (!isValid) {
      await this.recordFailure(accountKeyHash, customer.id);
      return Result.fail(new Error('Credenciales inválidas'));
    }
    await this.loginAttempts.clear(accountKeyHash);

    const rawToken = SessionTokenGenerator.generateRawToken();
    const tokenHash = await SessionTokenGenerator.hashToken(rawToken);

    // 14 días de expiración para clientes (SEC-SES-03)
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const session = Session.create({
      id: crypto.randomUUID(),
      tokenHash,
      actorType: 'customer',
      actorId: customer.id,
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: now,
      lastActiveAt: now,
    });

    await this.sessionRepo.save(session);

    return Result.ok({
      rawToken,
      expiresAt,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
      },
    });
  }

  private async recordFailure(accountKeyHash: string, customerId: string | null): Promise<void> {
    const now = new Date();
    await this.loginAttempts.recordFailure(
      accountKeyHash, customerId, now.toISOString(), new Date(now.getTime() - 15 * 60_000).toISOString(),
    );
  }
}
