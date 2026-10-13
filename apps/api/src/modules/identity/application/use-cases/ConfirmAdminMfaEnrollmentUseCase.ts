import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { TotpService } from '../../domain/services/TotpService.js';
import { Result } from '../../../../shared-kernel/Result.js';

export class ConfirmAdminMfaEnrollmentUseCase {
  constructor(private readonly admins: IAdminUserRepository) {}

  public async execute(adminId: string, code: string): Promise<Result<void, Error>> {
    const admin = await this.admins.findById(adminId);
    if (!admin || !admin.isActive || admin.mfaEnabled || !admin.mfaSecret) {
      return Result.fail(new Error('No hay un enrolamiento MFA pendiente'));
    }
    if (!(await TotpService.verifyCode(admin.mfaSecret, code))) {
      return Result.fail(new Error('Código TOTP inválido o expirado'));
    }
    admin.enableMfa(admin.mfaSecret);
    await this.admins.save(admin);
    return Result.ok(undefined);
  }
}
