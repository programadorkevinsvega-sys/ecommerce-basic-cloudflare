import { describe, expect, it, vi } from 'vitest';
import { AdminLoginThrottle } from '../src/modules/identity/application/services/AdminLoginThrottle.js';
import { LoginAdminUseCase } from '../src/modules/identity/application/use-cases/LoginAdminUseCase.js';
import { AdminUser } from '../src/modules/identity/domain/entities/AdminUser.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';

describe('configured demo administrator login', () => {
  it('authenticates the configured demo email against its active D1 account', async () => {
    const demo = await makeDemoAdmin();
    const admins = {
      findByEmail: vi.fn().mockResolvedValue(demo),
      findSoleActiveSuperadmin: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, makeThrottle(), {
      email: 'admin@example.test',
      password: 'configured-superadmin-password',
      demoEmail: 'demo@example.test',
    });

    const result = await useCase.execute({ email: 'DEMO@example.test', password: 'demo-d1-password' });

    expect(result.isOk()).toBe(true);
    expect(admins.findByEmail).toHaveBeenCalledWith('demo@example.test');
    expect(admins.findSoleActiveSuperadmin).not.toHaveBeenCalled();
    expect(sessions.save).toHaveBeenCalledOnce();
  });

  it('does not let the configured Superadmin password authenticate the demo account', async () => {
    const admins = {
      findByEmail: vi.fn().mockResolvedValue(await makeDemoAdmin()),
      findSoleActiveSuperadmin: vi.fn(),
      save: vi.fn(),
    };
    const sessions = { save: vi.fn() };
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, makeThrottle(), {
      email: 'admin@example.test',
      password: 'configured-superadmin-password',
      demoEmail: 'demo@example.test',
    });

    const result = await useCase.execute({
      email: 'demo@example.test', password: 'configured-superadmin-password',
    });

    expect(result.isFail()).toBe(true);
    expect(sessions.save).not.toHaveBeenCalled();
  });
});

function makeThrottle(): AdminLoginThrottle {
  const attempts = {
    findActiveLock: vi.fn().mockResolvedValue(null),
    recordFailure: vi.fn().mockResolvedValue({ windowStartedAt: new Date().toISOString(), alertRequired: false }),
    clear: vi.fn().mockResolvedValue(undefined),
  };
  return new AdminLoginThrottle(attempts as never, { notifyAdminLoginBlocked: vi.fn() });
}

async function makeDemoAdmin(): Promise<AdminUser> {
  return AdminUser.create({
    id: 'demo-admin',
    email: 'demo@example.test',
    passwordHash: await PasswordHasher.hash('demo-d1-password'),
    fullName: 'Demo Admin',
    roleId: 'role_editor',
    mfaEnabled: false,
    failedLoginAttempts: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
