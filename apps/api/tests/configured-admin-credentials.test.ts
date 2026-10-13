import { describe, expect, it, vi } from 'vitest';
import { AdminUser } from '../src/modules/identity/domain/entities/AdminUser.js';
import { LoginAdminUseCase } from '../src/modules/identity/application/use-cases/LoginAdminUseCase.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';

const password = 'A-long-test-only-password-9831';

describe('Cloudflare configured administrator credentials', () => {
  it('authenticates the sole Superadmin and synchronizes its email and password hash', async () => {
    const admin = await makeAdmin();
    const admins = {
      findSoleActiveSuperadmin: vi.fn().mockResolvedValue(admin),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, {
      email: 'admin@example.test', password,
    });

    const result = await useCase.execute({ email: 'Admin@Example.Test', password });

    expect(result.isOk()).toBe(true);
    expect(result.value.admin.email).toBe('admin@example.test');
    expect(admin.email).toBe('admin@example.test');
    expect(await PasswordHasher.verify(password, admin.passwordHash)).toBe(true);
    expect(admins.findSoleActiveSuperadmin).toHaveBeenCalledOnce();
    expect(sessions.save).toHaveBeenCalledOnce();
  });

  it('rejects incorrect configured credentials without creating a session', async () => {
    const admin = await makeAdmin();
    const admins = {
      findSoleActiveSuperadmin: vi.fn().mockResolvedValue(admin),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, {
      email: 'admin@example.test', password,
    });

    const result = await useCase.execute({ email: 'admin@example.test', password: 'wrong-secret' });

    expect(result.isFail()).toBe(true);
    expect(sessions.save).not.toHaveBeenCalled();
    expect(admins.save).toHaveBeenCalledOnce();
  });

  it('keeps legacy D1 login until both environment values are present', async () => {
    const admin = await makeAdmin();
    const legacyPassword = 'old-test-password';
    const admins = {
      findByEmail: vi.fn().mockResolvedValue(admin),
      findSoleActiveSuperadmin: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, {
      email: 'admin@example.test',
    });

    const result = await useCase.execute({ email: 'admin@vega.com', password: legacyPassword });

    expect(result.isOk()).toBe(true);
    expect(admins.findByEmail).toHaveBeenCalledWith('admin@vega.com');
    expect(admins.findSoleActiveSuperadmin).not.toHaveBeenCalled();
  });
});

async function makeAdmin(): Promise<AdminUser> {
  return AdminUser.create({
    id: 'admin-configured', email: 'admin@vega.com', passwordHash: await PasswordHasher.hash('old-test-password'),
    fullName: 'Vega Admin', roleId: 'role_superadmin', mfaEnabled: false,
    failedLoginAttempts: 0, isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  });
}
