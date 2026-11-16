import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { TotpService } from '../../domain/services/TotpService.js';
import { Result } from '../../../../shared-kernel/Result.js';

export class ConfirmAdminMfaEnrollmentUseCase {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MS = 15 * 60 * 1000;

  constructor(private readonly admins: IAdminUserRepository) {}

  public async execute(adminId: string, code: string): Promise<Result<void, Error>> {
    const now = new Date();
    const timestamp = now.toISOString();
    const enrollment = await this.admins.findMfaEnrollment(adminId);
    if (!enrollment?.active || enrollment.enabled || !enrollment.secret) {
      return Result.fail(new Error('No hay un enrolamiento MFA pendiente'));
    }
    if (enrollment.lockedUntil && Date.parse(enrollment.lockedUntil) > now.getTime()) {
      return Result.fail(new Error('Código TOTP inválido o expirado'));
    }
    const counter = await TotpService.findMatchingCounter(enrollment.secret, code);
    if (counter === null) {
      await this.admins.recordMfaEnrollmentFailure({
        adminId,
        now: timestamp,
        lockUntil: new Date(now.getTime() + ConfirmAdminMfaEnrollmentUseCase.LOCK_DURATION_MS).toISOString(),
        maxAttempts: ConfirmAdminMfaEnrollmentUseCase.MAX_ATTEMPTS,
      });
      return Result.fail(new Error('Código TOTP inválido o expirado'));
    }
    if (!await this.admins.completeMfaEnrollment(adminId, enrollment.secret, counter, timestamp)) {
      return Result.fail(new Error('Código TOTP inválido o expirado'));
    }
    return Result.ok(undefined);
  }
}
