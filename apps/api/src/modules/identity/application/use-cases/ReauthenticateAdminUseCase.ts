import { Result } from '../../../../shared-kernel/Result.js';
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { TotpService } from '../../domain/services/TotpService.js';

export class ReauthenticateAdminUseCase {
  public constructor(private readonly admins: IAdminUserRepository) {}

  public async execute(input: {
    adminId: string;
    password: string;
    totpCode: string;
  }): Promise<Result<boolean, Error>> {
    const admin = await this.admins.findById(input.adminId);
    if (!admin?.isActive || !admin.mfaEnabled || !admin.mfaSecret
      || !await PasswordHasher.verify(input.password, admin.passwordHash)) {
      return Result.ok(false);
    }

    const counter = await TotpService.findMatchingCounter(admin.mfaSecret, input.totpCode);
    if (counter === null || !await this.admins.consumeTotpCounter(admin.id, counter)) {
      return Result.ok(false);
    }
    return Result.ok(true);
  }
}
