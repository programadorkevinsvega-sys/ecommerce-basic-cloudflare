import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { TotpService } from '../../domain/services/TotpService.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { Session } from '../../domain/entities/Session.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface LoginAdminInput {
  email: string;
  password: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginAdminOutput {
  rawToken: string;
  expiresAt: string;
  admin: {
    id: string;
    email: string;
    fullName: string;
    roleId: string;
    mfaEnabled: boolean;
  };
}

export class LoginAdminUseCase {
  private readonly adminRepo: IAdminUserRepository;
  private readonly sessionRepo: ISessionRepository;

  public constructor(adminRepo: IAdminUserRepository, sessionRepo: ISessionRepository) {
    this.adminRepo = adminRepo;
    this.sessionRepo = sessionRepo;
  }

  public async execute(input: LoginAdminInput): Promise<Result<LoginAdminOutput, Error>> {
    const admin = await this.adminRepo.findByEmail(input.email);
    if (!admin || !admin.isActive) {
      return Result.fail(new Error('Credenciales inválidas'));
    }

    if (admin.isLocked()) {
      return Result.fail(new Error('Cuenta bloqueada temporalmente por intentos fallidos'));
    }

    const isPasswordValid = await PasswordHasher.verify(input.password, admin.passwordHash);
    if (!isPasswordValid) {
      admin.registerFailedAttempt();
      await this.adminRepo.save(admin);
      return Result.fail(new Error('Credenciales inválidas'));
    }

    // Nunca permite estado inconsistente: MFA activo sin secreto invalida el login.
    if (admin.mfaEnabled && !admin.mfaSecret) {
      return Result.fail(new Error('No se pudo validar el segundo factor'));
    }
    if (admin.mfaEnabled && admin.mfaSecret) {
      if (!input.totpCode) {
        return Result.fail(new Error('Código TOTP de segundo factor requerido'));
      }
      const isMfaValid = await TotpService.verifyCode(admin.mfaSecret, input.totpCode);
      if (!isMfaValid) {
        admin.registerFailedAttempt();
        await this.adminRepo.save(admin);
        return Result.fail(new Error('Código TOTP inválido o expirado'));
      }
    }

    admin.resetFailedAttempts();
    await this.adminRepo.save(admin);

    const rawToken = SessionTokenGenerator.generateRawToken();
    const tokenHash = await SessionTokenGenerator.hashToken(rawToken);

    // 8 horas para administradores (SEC-SES-03)
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const session = Session.create({
      id: crypto.randomUUID(),
      tokenHash,
      actorType: 'admin',
      actorId: admin.id,
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
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        roleId: admin.roleId,
        mfaEnabled: admin.mfaEnabled,
      },
    });
  }
}
