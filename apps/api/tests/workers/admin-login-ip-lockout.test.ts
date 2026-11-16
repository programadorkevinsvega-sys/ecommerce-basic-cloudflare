import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { D1AdminLoginAttemptRepository } from '../../src/modules/identity/infrastructure/persistence/d1/repositories/D1AdminLoginAttemptRepository.js';

describe('Bloqueo de login admin aislado por cuenta y origen', () => {
  const repository = new D1AdminLoginAttemptRepository(env.DB);

  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      if (!migration.name.startsWith('identity__')) continue;
      for (const sql of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (sql.trim()) await env.DB.prepare(sql).run();
      }
    }
  });

  it('bloquea el origen después de cinco fallos y permite otros orígenes', async () => {
    const adminId = crypto.randomUUID();
    const sourceHash = `source-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    let result;
    for (let attempt = 0; attempt < 5; attempt++) result = await repository.recordFailure(input(adminId, sourceHash, now));

    expect(result?.alertRequired).toBe(true);
    expect(result?.lockedUntil).toBeTruthy();
    expect(await repository.findActiveLock(adminId, sourceHash, now)).toBe(result?.lockedUntil);
    expect(await repository.findActiveLock(adminId, `${sourceHash}-other`, now)).toBeNull();
    expect(await repository.findActiveLock(`${adminId}-other`, sourceHash, now)).toBeNull();
    const afterExpiry = new Date(Date.parse(now) + 16 * 60_000).toISOString();
    expect(await repository.findActiveLock(adminId, sourceHash, afterExpiry)).toBeNull();
    const reset = await repository.recordFailure(input(adminId, sourceHash, afterExpiry));
    expect(reset.lockedUntil).toBeUndefined();
    expect(reset.alertRequired).toBe(false);
    await repository.clear(adminId, sourceHash);
  });

  it('serializa fallos concurrentes, conserva el umbral y reclama una sola alerta', async () => {
    const adminId = crypto.randomUUID();
    const sourceHash = `source-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => repository.recordFailure(input(adminId, sourceHash, now))),
    );
    const row = await env.DB.prepare(`
      SELECT failed_attempts, alert_claimed_at FROM identity_admin_login_attempts
      WHERE admin_id = ? AND source_hash = ?
    `).bind(adminId, sourceHash).first<{ failed_attempts: number; alert_claimed_at: string | null }>();

    expect(row?.failed_attempts).toBe(5);
    expect(row?.alert_claimed_at).toBeTruthy();
    expect(results.filter((result) => result.alertRequired)).toHaveLength(1);
    await repository.clear(adminId, sourceHash);
  });

  it('limpia intentos tras autenticar correctamente', async () => {
    const adminId = crypto.randomUUID();
    const sourceHash = `source-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await repository.recordFailure(input(adminId, sourceHash, now));
    await repository.clear(adminId, sourceHash);
    expect(await repository.findActiveLock(adminId, sourceHash, now)).toBeNull();
    const row = await env.DB.prepare(`
      SELECT admin_id FROM identity_admin_login_attempts WHERE admin_id = ? AND source_hash = ?
    `).bind(adminId, sourceHash).first();
    expect(row).toBeNull();
  });
});

function input(adminId: string, sourceHash: string, timestamp: string) {
  const now = new Date(timestamp);
  return {
    adminId,
    sourceHash,
    now: timestamp,
    windowStartedAtCutoff: new Date(now.getTime() - 15 * 60_000).toISOString(),
    lockUntil: new Date(now.getTime() + 15 * 60_000).toISOString(),
    maxAttempts: 5,
    retentionCutoff: new Date(now.getTime() - 24 * 60 * 60_000).toISOString(),
  };
}
