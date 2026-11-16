import { IAdminLoginAttemptRepository, AdminLoginAttemptResult } from '../../../../domain/repositories/IAdminLoginAttemptRepository.js';

export class D1AdminLoginAttemptRepository implements IAdminLoginAttemptRepository {
  public constructor(private readonly db: D1Database) {}

  public async findActiveLock(adminId: string, sourceHash: string, now: string): Promise<string | null> {
    const row = await this.db.prepare(`
      SELECT locked_until FROM identity_admin_login_attempts
      WHERE admin_id = ? AND source_hash = ? AND locked_until > ?
      LIMIT 1
    `).bind(adminId, sourceHash, now).first<{ locked_until: string }>();
    return row?.locked_until || null;
  }

  public async recordFailure(input: {
    adminId: string;
    sourceHash: string;
    now: string;
    windowStartedAtCutoff: string;
    lockUntil: string;
    maxAttempts: number;
    retentionCutoff: string;
  }): Promise<AdminLoginAttemptResult> {
    const { adminId, sourceHash, now, windowStartedAtCutoff, lockUntil, maxAttempts, retentionCutoff } = input;
    const cleanup = this.db.prepare(
      'DELETE FROM identity_admin_login_attempts WHERE updated_at <= ?'
    ).bind(retentionCutoff);
    const upsert = this.db.prepare(`
      INSERT INTO identity_admin_login_attempts
        (admin_id, source_hash, failed_attempts, window_started_at, locked_until, alert_claimed_at, updated_at)
      VALUES (?, ?, 1, ?, NULL, NULL, ?)
      ON CONFLICT(admin_id, source_hash) DO UPDATE SET
        failed_attempts = CASE
          WHEN identity_admin_login_attempts.locked_until > ? THEN identity_admin_login_attempts.failed_attempts
          WHEN identity_admin_login_attempts.window_started_at <= ? THEN 1
          ELSE identity_admin_login_attempts.failed_attempts + 1
        END,
        window_started_at = CASE
          WHEN identity_admin_login_attempts.locked_until > ? THEN identity_admin_login_attempts.window_started_at
          WHEN identity_admin_login_attempts.window_started_at <= ? THEN excluded.window_started_at
          ELSE identity_admin_login_attempts.window_started_at
        END,
        locked_until = CASE
          WHEN identity_admin_login_attempts.locked_until > ? THEN identity_admin_login_attempts.locked_until
          WHEN identity_admin_login_attempts.window_started_at <= ? THEN NULL
          WHEN identity_admin_login_attempts.failed_attempts + 1 >= ? THEN ?
          ELSE NULL
        END,
        alert_claimed_at = CASE
          WHEN identity_admin_login_attempts.locked_until > ? THEN identity_admin_login_attempts.alert_claimed_at
          WHEN identity_admin_login_attempts.window_started_at <= ? THEN NULL
          WHEN identity_admin_login_attempts.failed_attempts + 1 >= ? THEN NULL
          ELSE identity_admin_login_attempts.alert_claimed_at
        END,
        updated_at = excluded.updated_at
    `).bind(
      adminId, sourceHash, now, now,
      now, windowStartedAtCutoff, now, windowStartedAtCutoff,
      now, windowStartedAtCutoff, maxAttempts, lockUntil,
      now, windowStartedAtCutoff, maxAttempts,
    );
    const claimAlert = this.db.prepare(`
      UPDATE identity_admin_login_attempts
      SET alert_claimed_at = ?
      WHERE admin_id = ? AND source_hash = ? AND locked_until > ?
        AND failed_attempts >= ? AND alert_claimed_at IS NULL
    `).bind(now, adminId, sourceHash, now, maxAttempts);

    const [, , alertResult] = await this.db.batch([cleanup, upsert, claimAlert]);
    if (!alertResult) throw new Error('D1 no devolvió el resultado de reclamación de alerta');
    const row = await this.db.prepare(`
      SELECT window_started_at, locked_until
      FROM identity_admin_login_attempts
      WHERE admin_id = ? AND source_hash = ?
      LIMIT 1
    `).bind(adminId, sourceHash).first<{ window_started_at: string; locked_until: string | null }>();
    if (!row) throw new Error('No se pudo persistir el intento fallido de acceso administrativo');

    return {
      windowStartedAt: row.window_started_at,
      lockedUntil: row.locked_until || undefined,
      alertRequired: Number(alertResult.meta?.changes || 0) === 1,
    };
  }

  public async clear(adminId: string, sourceHash: string): Promise<void> {
    await this.db.prepare(`
      DELETE FROM identity_admin_login_attempts WHERE admin_id = ? AND source_hash = ?
    `).bind(adminId, sourceHash).run();
  }
}
