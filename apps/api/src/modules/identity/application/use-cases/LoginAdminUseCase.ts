import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { TotpService } from '../../domain/services/TotpService.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { Session } from '../../domain/entities/Session.js';
import { AdminUser } from '../../domain/entities/AdminUser.js';
import { ConfiguredSecretComparator } from '../../domain/services/ConfiguredSecretComparator.js';
import { IConfiguredAdminCredentialAuditPort } from '../ports/IConfiguredAdminCredentialAuditPort.js';
import { Result } from '../../../../shared-kernel/Result.js';
import { AdminLoginThrottle } from '../services/AdminLoginThrottle.js';

export interface LoginAdminInput {
  email: string;
  password: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
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
  private readonly configuredEmail?: string;
  private readonly demoEmail?: string;
  private readonly configuredPassword?: string;
  private readonly credentialAudit?: IConfiguredAdminCredentialAuditPort;
  private readonly loginThrottle: AdminLoginThrottle;

  public constructor(
    adminRepo: IAdminUserRepository,
    sessionRepo: ISessionRepository,
    loginThrottle: AdminLoginThrottle,
    credentials?: { email?: string; password?: string; demoEmail?: string },
    credentialAudit?: IConfiguredAdminCredentialAuditPort,
  ) {
    this.adminRepo = adminRepo;
    this.sessionRepo = sessionRepo;
    this.configuredEmail = credentials?.email?.trim().toLowerCase() || undefined;
    this.demoEmail = credentials?.demoEmail?.trim().toLowerCase() || undefined;
    this.configuredPassword = credentials?.password || undefined;
    this.credentialAudit = credentialAudit;
    this.loginThrottle = loginThrottle;
  }

  public async execute(input: LoginAdminInput): Promise<Result<LoginAdminOutput, Error>> {
    const isConfiguredAdmin = this.matchesConfiguredEmail(input.email);
    const isDemoAdmin = this.matchesDemoEmail(input.email);
    const configuredCredentials = Boolean(this.configuredEmail && this.configuredPassword);
    if ((configuredCredentials || this.demoEmail) && !isConfiguredAdmin && !isDemoAdmin) {
      return Result.fail(new Error('Credenciales inválidas'));
    }
    let admin = configuredCredentials && isConfiguredAdmin
      ? await this.adminRepo.findSoleActiveSuperadmin()
      : await this.adminRepo.findByEmail(input.email.trim().toLowerCase());

    let provisioned = false;
    if (!admin && configuredCredentials && await this.adminRepo.countAdmins() === 0
      && isConfiguredAdmin && this.matchesConfiguredCredentials(input)) {
      if (!this.credentialAudit?.recordConfiguredAdminProvision) {
        return Result.fail(new Error('Auditoría de aprovisionamiento no configurada'));
      }
      const now = new Date().toISOString();
      const candidate = AdminUser.create({
        id: crypto.randomUUID(),
        email: this.configuredEmail as string,
        passwordHash: await PasswordHasher.hash(this.configuredPassword as string),
        fullName: 'Superadmin',
        roleId: 'role_superadmin',
        mfaEnabled: false,
        failedLoginAttempts: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      await this.credentialAudit.recordConfiguredAdminProvision(candidate.id, 'before');
      provisioned = await this.adminRepo.provisionConfiguredSuperadminIfEmpty(candidate);
      if (provisioned) {
        admin = candidate;
        await this.credentialAudit.recordConfiguredAdminProvision(candidate.id, 'after');
      } else {
        admin = await this.adminRepo.findSoleActiveSuperadmin();
      }
    }

    if (!admin || !admin.isActive) {
      if (!configuredCredentials || isDemoAdmin) await PasswordHasher.verifyAgainstDummy(input.password);
      return Result.fail(new Error('Credenciales inválidas'));
    }

    if (await this.loginThrottle.isBlocked(admin.id, input.ipAddress)) {
      if (!configuredCredentials || isDemoAdmin) await PasswordHasher.verifyAgainstDummy(input.password);
      return Result.fail(new Error('Credenciales inválidas'));
    }

    const isPasswordValid = configuredCredentials && isConfiguredAdmin
      ? this.matchesConfiguredCredentials(input)
      : await PasswordHasher.verify(input.password, admin.passwordHash);
    if (!isPasswordValid) {
      await this.loginThrottle.recordFailure(
        admin, isConfiguredAdmin && this.configuredEmail ? this.configuredEmail : admin.email, input.ipAddress, input.traceId,
      );
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
      const counter = await TotpService.findMatchingCounter(admin.mfaSecret, input.totpCode);
      const isMfaValid = counter !== null && await this.adminRepo.consumeTotpCounter(admin.id, counter);
      if (!isMfaValid) {
        await this.loginThrottle.recordFailure(
          admin, isConfiguredAdmin && this.configuredEmail ? this.configuredEmail : admin.email, input.ipAddress, input.traceId,
        );
        return Result.fail(new Error('Código TOTP inválido o expirado'));
      }
    }

    if (configuredCredentials && isConfiguredAdmin && !provisioned) {
      if (!this.credentialAudit) return Result.fail(new Error('Auditoría de credenciales no configurada'));
      await this.credentialAudit.recordCredentialSync(admin.id, 'before');
      const passwordHash = await PasswordHasher.hash(this.configuredPassword as string);
      admin.synchronizeConfiguredCredentials(this.configuredEmail || admin.email, passwordHash);
    }

    admin.resetFailedAttempts();
    await this.adminRepo.save(admin);
    await this.loginThrottle.clear(admin.id, input.ipAddress);
    if (configuredCredentials && isConfiguredAdmin && !provisioned) {
      await this.credentialAudit?.recordCredentialSync(admin.id, 'after');
    }

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

  private matchesConfiguredCredentials(input: LoginAdminInput): boolean {
    return Boolean(this.configuredEmail && this.configuredPassword)
      && this.matchesConfiguredEmail(input.email)
      && ConfiguredSecretComparator.matches(input.password, this.configuredPassword as string);
  }

  private matchesConfiguredEmail(email: string): boolean {
    return email.trim().toLowerCase() === this.configuredEmail;
  }

  private matchesDemoEmail(email: string): boolean {
    return Boolean(this.demoEmail && email.trim().toLowerCase() === this.demoEmail);
  }
}
