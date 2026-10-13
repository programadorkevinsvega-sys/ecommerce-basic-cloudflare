import { describe, expect, it } from 'vitest';
import { AdminUser } from '../src/modules/identity/domain/entities/AdminUser.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { TotpService } from '../src/modules/identity/domain/services/TotpService.js';
import { BeginAdminMfaEnrollmentUseCase } from '../src/modules/identity/application/use-cases/BeginAdminMfaEnrollmentUseCase.js';
import { ConfirmAdminMfaEnrollmentUseCase } from '../src/modules/identity/application/use-cases/ConfirmAdminMfaEnrollmentUseCase.js';

describe('admin MFA enrollment', () => {
  it('requires password reauthentication and enables MFA only after a valid TOTP', async () => {
    const admin = AdminUser.create({
      id: 'admin-1', email: 'owner@example.test', passwordHash: await PasswordHasher.hash('CorrectHorseBatteryStaple!23'),
      fullName: 'Owner', roleId: 'role_superadmin', mfaEnabled: false, failedLoginAttempts: 0,
      isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const repository = { findById: async () => admin, save: async () => undefined };
    const begin = new BeginAdminMfaEnrollmentUseCase(repository as never);
    const confirm = new ConfirmAdminMfaEnrollmentUseCase(repository as never);

    expect((await begin.execute(admin.id, 'wrong password')).isFail()).toBe(true);
    const enrollment = await begin.execute(admin.id, 'CorrectHorseBatteryStaple!23');
    expect(enrollment.isOk()).toBe(true);
    if (enrollment.isFail()) throw enrollment.error;
    expect(enrollment.value.otpauthUri).toContain(enrollment.value.secret);
    expect((await confirm.execute(admin.id, '000000')).isFail()).toBe(true);
    expect(admin.mfaEnabled).toBe(false);
    const code = await TotpService.generateCurrentCode(enrollment.value.secret);
    expect((await confirm.execute(admin.id, code)).isOk()).toBe(true);
    expect(admin.mfaEnabled).toBe(true);
  });
});
