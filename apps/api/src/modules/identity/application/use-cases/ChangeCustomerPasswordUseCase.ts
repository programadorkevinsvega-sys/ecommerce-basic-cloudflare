import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { Session } from '../../domain/entities/Session.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface ChangeCustomerPasswordInput {
  customerId: string; currentPassword: string; newPassword: string;
  currentSessionToken: string; ipAddress?: string; userAgent?: string;
}

export class ChangeCustomerPasswordUseCase {
  public constructor(private readonly customers: ICustomerRepository, private readonly sessions: ISessionRepository) {}

  public async execute(input: ChangeCustomerPasswordInput): Promise<Result<{ rawToken: string; expiresAt: string }, Error>> {
    if (input.newPassword.length < 12 || input.newPassword.length > 128 || input.newPassword === input.currentPassword) {
      return Result.fail(new Error('La nueva contraseña debe tener 12 a 128 caracteres y ser diferente'));
    }
    const customer = await this.customers.findById(input.customerId);
    if (!customer || !customer.isActive || !await PasswordHasher.verify(input.currentPassword, customer.passwordHash)) {
      return Result.fail(new Error('La contraseña actual no es correcta'));
    }
    const oldHash = await SessionTokenGenerator.hashToken(input.currentSessionToken);
    const oldSession = await this.sessions.findByTokenHash(oldHash);
    if (!oldSession || oldSession.actorType !== 'customer' || oldSession.actorId !== input.customerId) {
      return Result.fail(new Error('La sesión expiró. Inicia sesión de nuevo'));
    }
    const rawToken = SessionTokenGenerator.generateRawToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    customer.changePassword(await PasswordHasher.hash(input.newPassword));
    await this.customers.changePasswordAndRotateSessions(customer, Session.create({
      id: crypto.randomUUID(), tokenHash: await SessionTokenGenerator.hashToken(rawToken),
      actorType: 'customer', actorId: input.customerId, expiresAt,
      ipAddress: input.ipAddress || oldSession.toSnapshot().ipAddress,
      userAgent: input.userAgent || oldSession.userAgent, createdAt: now, lastActiveAt: now,
    }));
    return Result.ok({ rawToken, expiresAt });
  }
}
