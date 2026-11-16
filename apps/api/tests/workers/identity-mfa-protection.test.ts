import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1AdminUserRepository } from '../../src/modules/identity/infrastructure/persistence/d1/repositories/D1AdminUserRepository.js';
import { TotpService } from '../../src/modules/identity/domain/services/TotpService.js';

const repository = new D1AdminUserRepository(env.DB, env.TOTP_ENCRYPTION_KEY);
const adminIds: string[] = [];

async function createAdmin(mfaEnabled: boolean, secret: string | null = null): Promise<string> {
  const id = `mfa-${crypto.randomUUID()}`;
  adminIds.push(id);
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO identity_admins (
      id, email, password_hash, full_name, role_id, mfa_secret, mfa_enabled,
      failed_login_attempts, locked_until, is_active, created_at, updated_at
    ) VALUES (?, ?, 'hash', 'MFA Test', 'role_superadmin', ?, ?, 0, NULL, 1, ?, ?)
  `).bind(id, `${id}@example.test`, secret, mfaEnabled ? 1 : 0, now, now).run();
  return id;
}

beforeAll(async () => {
  for (const migration of env.TEST_MIGRATIONS) {
    for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
      if (statement.trim()) await env.DB.prepare(statement).run();
    }
  }
});

afterAll(async () => {
  for (const id of adminIds) {
    await env.DB.prepare('DELETE FROM identity_admins WHERE id = ?').bind(id).run();
  }
});

describe('admin TOTP D1 protection', () => {
  it('stores new MFA secrets encrypted and upgrades legacy plaintext on access', async () => {
    const newAdminId = await createAdmin(false);
    const newSecret = TotpService.generateSecret();
    expect(await repository.stageMfaEnrollment(newAdminId, newSecret)).toBe(true);
    const newStored = await env.DB.prepare(
      'SELECT mfa_secret FROM identity_admins WHERE id = ?',
    ).bind(newAdminId).first<{ mfa_secret: string }>();
    expect(newStored?.mfa_secret).toMatch(/^enc:v1:/);
    expect(newStored?.mfa_secret).not.toContain(newSecret);

    const legacySecret = TotpService.generateSecret();
    const legacyAdminId = await createAdmin(false, legacySecret);
    const legacyAdmin = await repository.findById(legacyAdminId);
    expect(legacyAdmin?.mfaSecret).toBe(legacySecret);
    const upgraded = await env.DB.prepare(
      'SELECT mfa_secret FROM identity_admins WHERE id = ?',
    ).bind(legacyAdminId).first<{ mfa_secret: string }>();
    expect(upgraded?.mfa_secret).toMatch(/^enc:v1:/);
    expect(upgraded?.mfa_secret).not.toContain(legacySecret);
  });

  it('atomically accepts an enrollment counter only once', async () => {
    const adminId = await createAdmin(false);
    const secret = TotpService.generateSecret();
    expect(await repository.stageMfaEnrollment(adminId, secret)).toBe(true);

    const timestamp = Date.UTC(2026, 0, 1, 0, 0, 0);
    const code = await TotpService.generateCurrentCode(secret, timestamp);
    const counter = await TotpService.findMatchingCounter(secret, code, 1, timestamp);
    if (counter === null) throw new Error('Generated TOTP code did not match its counter');
    const now = new Date(timestamp).toISOString();
    const attempts = await Promise.all([
      repository.completeMfaEnrollment(adminId, secret, counter, now),
      repository.completeMfaEnrollment(adminId, secret, counter, now),
    ]);

    expect(attempts.filter(Boolean)).toHaveLength(1);
    expect((await repository.findMfaEnrollment(adminId))?.enabled).toBe(true);
  });

  it('persists and enforces a five-attempt enrollment lockout', async () => {
    const adminId = await createAdmin(false);
    expect(await repository.stageMfaEnrollment(adminId, TotpService.generateSecret())).toBe(true);
    const now = '2026-01-01T00:00:00.000Z';
    const lockUntil = '2026-01-01T00:15:00.000Z';

    for (let attempt = 0; attempt < 5; attempt++) {
      expect(await repository.recordMfaEnrollmentFailure({
        adminId, now, lockUntil, maxAttempts: 5,
      })).toBe(true);
    }
    expect(await repository.recordMfaEnrollmentFailure({
      adminId, now, lockUntil, maxAttempts: 5,
    })).toBe(false);
    const state = await repository.findMfaEnrollment(adminId);
    expect(state?.failedAttempts).toBe(5);
    expect(state?.lockedUntil).toBe(lockUntil);
    expect(await repository.stageMfaEnrollment(adminId, TotpService.generateSecret())).toBe(true);
    const restartedEnrollment = await repository.findMfaEnrollment(adminId);
    expect(restartedEnrollment?.failedAttempts).toBe(5);
    expect(restartedEnrollment?.lockedUntil).toBe(lockUntil);
  });

  it('rejects reused or older TOTP counters at login', async () => {
    const secret = TotpService.generateSecret();
    const adminId = await createAdmin(true, secret);
    const timestamp = Date.UTC(2026, 0, 1, 0, 0, 0);
    const currentCode = await TotpService.generateCurrentCode(secret, timestamp);
    const currentCounter = await TotpService.findMatchingCounter(secret, currentCode, 1, timestamp);
    if (currentCounter === null) throw new Error('Generated TOTP code did not match its counter');

    expect(await repository.consumeTotpCounter(adminId, currentCounter)).toBe(true);
    expect(await repository.consumeTotpCounter(adminId, currentCounter)).toBe(false);
    expect(await repository.consumeTotpCounter(adminId, currentCounter - 1)).toBe(false);
  });
});
