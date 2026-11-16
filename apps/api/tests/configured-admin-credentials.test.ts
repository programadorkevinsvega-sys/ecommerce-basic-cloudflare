import { describe, expect, it, vi } from 'vitest';
import { AdminUser } from '../src/modules/identity/domain/entities/AdminUser.js';
import { LoginAdminUseCase } from '../src/modules/identity/application/use-cases/LoginAdminUseCase.js';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { AdminLoginThrottle } from '../src/modules/identity/application/services/AdminLoginThrottle.js';

const password = 'A-long-test-only-password-9831';

describe('Cloudflare configured administrator credentials', () => {
  it('authenticates the sole Superadmin and synchronizes its email and password hash', async () => {
    const admin = await makeAdmin();
    const admins = {
      findSoleActiveSuperadmin: vi.fn().mockResolvedValue(admin),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const audit = { recordCredentialSync: vi.fn().mockResolvedValue(undefined) };
    const { throttle, attempts } = makeThrottle();
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, throttle, {
      email: 'admin@example.test', password,
    }, audit);

    const result = await useCase.execute({ email: 'Admin@Example.Test', password, ipAddress: '203.0.113.8' });

    expect(result.isOk()).toBe(true);
    expect(result.value.admin.email).toBe('admin@example.test');
    expect(admin.email).toBe('admin@example.test');
    expect(await PasswordHasher.verify(password, admin.passwordHash)).toBe(true);
    expect(admins.findSoleActiveSuperadmin).toHaveBeenCalledOnce();
    expect(sessions.save).toHaveBeenCalledOnce();
    expect(attempts.clear).toHaveBeenCalledOnce();
    expect(audit.recordCredentialSync.mock.calls).toEqual([['admin-configured', 'before'], ['admin-configured', 'after']]);
  });

  it('rejects incorrect configured credentials without creating a session', async () => {
    const admin = await makeAdmin();
    const admins = {
      findSoleActiveSuperadmin: vi.fn().mockResolvedValue(admin),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const audit = { recordCredentialSync: vi.fn().mockResolvedValue(undefined) };
    const { throttle, attempts } = makeThrottle();
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, throttle, {
      email: 'admin@example.test', password,
    }, audit);

    const result = await useCase.execute({ email: 'admin@example.test', password: 'wrong-secret', ipAddress: '203.0.113.8' });

    expect(result.isFail()).toBe(true);
    expect(sessions.save).not.toHaveBeenCalled();
    expect(admins.save).not.toHaveBeenCalled();
    expect(attempts.recordFailure).toHaveBeenCalledOnce();
    expect(audit.recordCredentialSync).not.toHaveBeenCalled();
  });

  it('rejects a wrong configured email before looking up or recording an account failure', async () => {
    const admins = { findSoleActiveSuperadmin: vi.fn(), save: vi.fn() };
    const sessions = { save: vi.fn() };
    const { throttle, attempts } = makeThrottle();
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, throttle, {
      email: 'admin@example.test', password,
    });

    const result = await useCase.execute({
      email: 'attacker@example.test', password: 'wrong-secret', ipAddress: '203.0.113.9',
    });

    expect(result.isFail()).toBe(true);
    expect(admins.findSoleActiveSuperadmin).not.toHaveBeenCalled();
    expect(attempts.recordFailure).not.toHaveBeenCalled();
    expect(admins.save).not.toHaveBeenCalled();
  });

  it('lets the configured Superadmin sign in despite a legacy global account lock', async () => {
    const admin = AdminUser.create({
      ...(await makeAdmin()).toSnapshot(),
      lockedUntil: new Date(Date.now() + 600_000).toISOString(),
    });
    const admins = { findSoleActiveSuperadmin: vi.fn().mockResolvedValue(admin), save: vi.fn() };
    const sessions = { save: vi.fn().mockResolvedValue(undefined) };
    const audit = { recordCredentialSync: vi.fn().mockResolvedValue(undefined) };
    const { throttle } = makeThrottle();
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, throttle, {
      email: 'admin@example.test', password,
    }, audit);

    const result = await useCase.execute({
      email: 'admin@example.test', password, ipAddress: '203.0.113.11',
    });

    expect(result.isOk()).toBe(true);
    expect(sessions.save).toHaveBeenCalledOnce();
    expect(admin.toSnapshot().lockedUntil).toBeUndefined();
  });

  it('does not reapply a global account lock and alerts on an IP lockout', async () => {
    const admin = await makeAdmin();
    const legacyLock = new Date(Date.now() + 600_000).toISOString();
    const lockedAdmin = AdminUser.create({ ...admin.toSnapshot(), lockedUntil: legacyLock });
    const attempts = {
      findActiveLock: vi.fn().mockResolvedValue(null),
      recordFailure: vi.fn().mockResolvedValue({
        windowStartedAt: '2026-11-15T12:00:00.000Z',
        lockedUntil: '2026-11-15T12:15:00.000Z',
        alertRequired: true,
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const alert = { notifyAdminLoginBlocked: vi.fn().mockResolvedValue(undefined) };
    const throttle = new AdminLoginThrottle(attempts as never, alert);
    const admins = { findSoleActiveSuperadmin: vi.fn().mockResolvedValue(lockedAdmin), save: vi.fn() };
    const useCase = new LoginAdminUseCase(admins as never, { save: vi.fn() } as never, throttle, {
      email: 'admin@example.test', password,
    });

    const result = await useCase.execute({ email: 'admin@example.test', password: 'wrong', ipAddress: '203.0.113.10' });

    expect(result.isFail()).toBe(true);
    expect(alert.notifyAdminLoginBlocked).toHaveBeenCalledWith(expect.objectContaining({
      adminEmail: 'admin@example.test',
      idempotencyKey: expect.stringMatching(/^admin-login-lockout:admin-configured:/),
    }));
    expect(lockedAdmin.toSnapshot().lockedUntil).toBe(legacyLock);
    expect(admins.save).not.toHaveBeenCalled();
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
    const { throttle } = makeThrottle();
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, throttle, {
      email: 'admin@example.test',
    });

    const result = await useCase.execute({ email: 'legacy-admin@example.test', password: legacyPassword });

    expect(result.isOk()).toBe(true);
    expect(admins.findByEmail).toHaveBeenCalledWith('legacy-admin@example.test');
    expect(admins.findSoleActiveSuperadmin).not.toHaveBeenCalled();
  });

  it('does not change credentials when the before-change audit is unavailable', async () => {
    const admin = await makeAdmin();
    const admins = { findSoleActiveSuperadmin: vi.fn().mockResolvedValue(admin), save: vi.fn() };
    const sessions = { save: vi.fn() };
    const audit = { recordCredentialSync: vi.fn().mockRejectedValue(new Error('audit unavailable')) };
    const { throttle } = makeThrottle();
    const useCase = new LoginAdminUseCase(admins as never, sessions as never, throttle, {
      email: 'admin@example.test', password,
    }, audit);

    await expect(useCase.execute({ email: 'admin@example.test', password })).rejects.toThrow();
    expect(admin.email).toBe('legacy-admin@example.test');
    expect(admins.save).not.toHaveBeenCalled();
    expect(sessions.save).not.toHaveBeenCalled();
  });
});

function makeThrottle() {
  const attempts = {
    findActiveLock: vi.fn().mockResolvedValue(null),
    recordFailure: vi.fn().mockResolvedValue({
      windowStartedAt: '2026-11-15T12:00:00.000Z',
      alertRequired: false,
    }),
    clear: vi.fn().mockResolvedValue(undefined),
  };
  const alert = { notifyAdminLoginBlocked: vi.fn().mockResolvedValue(undefined) };
  return { attempts, throttle: new AdminLoginThrottle(attempts as never, alert) };
}

async function makeAdmin(): Promise<AdminUser> {
  return AdminUser.create({
    id: 'admin-configured', email: 'legacy-admin@example.test', passwordHash: await PasswordHasher.hash('old-test-password'),
    fullName: 'Vega Admin', roleId: 'role_superadmin', mfaEnabled: false,
    failedLoginAttempts: 0, isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  });
}
