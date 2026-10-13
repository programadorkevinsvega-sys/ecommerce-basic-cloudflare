import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { TotpService } from '../../domain/services/TotpService.js';
import { ConfiguredSecretComparator } from '../../domain/services/ConfiguredSecretComparator.js';
import { AdminUser } from '../../domain/entities/AdminUser.js';
import { Result } from '../../../../shared-kernel/Result.js';

export class BeginAdminMfaEnrollmentUseCase {
  constructor(
    private readonly admins: IAdminUserRepository,
    private readonly configuredCredentials?: { email?: string; password?: string },
  ) {}

  public async execute(adminId: string, password: string): Promise<Result<{ secret: string; otpauthUri: string }, Error>> {
    const admin = await this.admins.findById(adminId);
    if (!admin || !admin.isActive || !await this.hasValidPassword(admin, password)) {
      return Result.fail(new Error('Reautenticación fallida'));
    }
    const secret = TotpService.generateSecret();
    admin.stageMfaSecret(secret);
    await this.admins.save(admin);
    const label = encodeURIComponent(`Vega Store:${admin.email}`);
    const issuer = encodeURIComponent('Vega Store');
    const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return Result.ok({ secret, otpauthUri });
  }

  private async hasValidPassword(admin: AdminUser, password: string): Promise<boolean> {
    const email = this.configuredCredentials?.email?.trim().toLowerCase();
    const configuredPassword = this.configuredCredentials?.password;
    if (email && configuredPassword) {
      const superadmin = await this.admins.findSoleActiveSuperadmin();
      return admin.roleId === 'role_superadmin'
        && superadmin?.id === admin.id
        && ConfiguredSecretComparator.matches(password, configuredPassword);
    }
    return PasswordHasher.verify(password, admin.passwordHash);
  }
}
