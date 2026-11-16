import { describe, expect, it, vi } from 'vitest';
import { AdminUser } from '../src/modules/identity/domain/entities/AdminUser.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { TotpService } from '../src/modules/identity/domain/services/TotpService.js';
import { LoginAdminUseCase } from '../src/modules/identity/application/use-cases/LoginAdminUseCase.js';
import { AdminLoginThrottle } from '../src/modules/identity/application/services/AdminLoginThrottle.js';

describe('admin TOTP replay protection', () => {
  it('allows a valid code once and rejects the same counter on a subsequent login', async () => {
    const secret = TotpService.generateSecret();
    const admin = AdminUser.create({
      id: 'mfa-admin', email: 'owner@example.test', passwordHash: await PasswordHasher.hash('correct-password'),
      fullName: 'Owner', roleId: 'role_superadmin', mfaSecret: secret, mfaEnabled: true,
      failedLoginAttempts: 0, isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    });
    let lastCounter: number | undefined;
    const adminRepo = {
      findByEmail: async () => admin,
      consumeTotpCounter: async (_id: string, counter: number) => {
        if (lastCounter !== undefined && counter <= lastCounter) return false;
        lastCounter = counter;
        return true;
      },
      save: vi.fn(async () => undefined),
    };
    const sessionRepo = { save: vi.fn(async () => undefined) };
    const attempts = {
      findActiveLock: async () => null,
      recordFailure: vi.fn(async () => ({ windowStartedAt: '', alertRequired: false })),
      clear: vi.fn(async () => undefined),
    };
    const throttle = new AdminLoginThrottle(attempts as never, { notifyAdminLoginBlocked: async () => undefined });
    const useCase = new LoginAdminUseCase(adminRepo as never, sessionRepo as never, throttle);
    const input = {
      email: admin.email, password: 'correct-password', totpCode: await TotpService.generateCurrentCode(secret),
      ipAddress: '192.0.2.10',
    };

    expect((await useCase.execute(input)).isOk()).toBe(true);
    expect((await useCase.execute(input)).isFail()).toBe(true);
    expect(adminRepo.save).toHaveBeenCalledOnce();
    expect(sessionRepo.save).toHaveBeenCalledOnce();
    expect(attempts.recordFailure).toHaveBeenCalledOnce();
  });
});
