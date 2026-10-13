import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { TotpService } from '../../domain/services/TotpService.js';
import { Result } from '../../../../shared-kernel/Result.js';

export class BeginAdminMfaEnrollmentUseCase {
  constructor(private readonly admins: IAdminUserRepository) {}

  public async execute(adminId: string, password: string): Promise<Result<{ secret: string; otpauthUri: string }, Error>> {
    const admin = await this.admins.findById(adminId);
    if (!admin || !admin.isActive || !(await PasswordHasher.verify(password, admin.passwordHash))) {
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
}
