import { IAdminUserRepository } from '../../../../domain/repositories/IAdminUserRepository.js';
import { AdminMfaEnrollmentState } from '../../../../domain/repositories/IAdminUserRepository.js';
import { AdminUser } from '../../../../domain/entities/AdminUser.js';
import { D1AdminUserMapper } from './D1AdminUserMapper.js';
import { TotpSecretCipher } from '../security/TotpSecretCipher.js';

export class D1AdminUserRepository implements IAdminUserRepository {
  private readonly db: D1Database;
  private readonly mapper: D1AdminUserMapper;

  public constructor(db: D1Database, totpEncryptionKey?: string) {
    if (!totpEncryptionKey) {
      throw new Error('TOTP_ENCRYPTION_KEY is required to initialize identity persistence');
    }
    this.db = db;
    this.mapper = new D1AdminUserMapper(db, new TotpSecretCipher(totpEncryptionKey));
  }

  public async findById(id: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM identity_admins WHERE id = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(id).first();
    return row ? this.mapper.toEntity(row as Record<string, unknown>) : null;
  }

  public async findByEmail(email: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM identity_admins WHERE email = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(email.trim().toLowerCase()).first();
    return row ? this.mapper.toEntity(row as Record<string, unknown>) : null;
  }

  public async findSoleActiveSuperadmin(): Promise<AdminUser | null> {
    const query = "SELECT * FROM identity_admins WHERE role_id = 'role_superadmin' AND is_active = 1 ORDER BY created_at ASC LIMIT 2";
    const { results } = await this.db.prepare(query).all();
    if (!results || results.length !== 1) return null;
    return this.mapper.toEntity(results[0] as Record<string, unknown>);
  }

  public async countAdmins(): Promise<number> {
    const row = await this.db.prepare('SELECT COUNT(*) AS count FROM identity_admins').first();
    return Number(row?.count || 0);
  }

  public async provisionConfiguredSuperadminIfEmpty(admin: AdminUser): Promise<boolean> {
    const s = admin.toSnapshot();
    const result = await this.db.prepare(`
      INSERT INTO identity_admins (
        id, email, password_hash, full_name, role_id, mfa_secret, mfa_enabled,
        failed_login_attempts, locked_until, is_active, created_at, updated_at
      )
      SELECT ?, ?, ?, ?, 'role_superadmin', NULL, 0, 0, NULL, 1, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM identity_admins)
        AND EXISTS (SELECT 1 FROM identity_roles WHERE id = 'role_superadmin')
    `).bind(s.id, s.email, s.passwordHash, s.fullName, s.createdAt, s.updatedAt).run();
    return Number(result.meta?.changes || 0) === 1;
  }

  public async countSuperadmins(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM identity_admins 
      WHERE role_id = 'role_superadmin' AND is_active = 1
    `;
    const row = await this.db.prepare(query).first();
    return Number(row?.count || 0);
  }

  public async list(limit: number, offset: number): Promise<AdminUser[]> {
    const query = 'SELECT * FROM identity_admins ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const { results } = await this.db.prepare(query).bind(limit, offset).all();
    return Promise.all((results || []).map((row) => this.mapper.toEntity(row as Record<string, unknown>)));
  }

  public async save(admin: AdminUser): Promise<void> {
    const s = admin.toSnapshot();
    const encryptedSecret = await this.mapper.encryptSecret(s.mfaSecret, s.id);
    const query = `
      INSERT INTO identity_admins (
        id, email, password_hash, full_name, role_id, mfa_secret, mfa_enabled,
        failed_login_attempts, locked_until, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        full_name = excluded.full_name,
        role_id = excluded.role_id,
        mfa_secret = excluded.mfa_secret,
        mfa_enabled = excluded.mfa_enabled,
        failed_login_attempts = excluded.failed_login_attempts,
        locked_until = excluded.locked_until,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `;

    await this.db
      .prepare(query)
      .bind(
        s.id,
        s.email,
        s.passwordHash,
        s.fullName,
        s.roleId,
        encryptedSecret,
        s.mfaEnabled ? 1 : 0,
        s.failedLoginAttempts,
        s.lockedUntil || null,
        s.isActive ? 1 : 0,
        s.createdAt,
        s.updatedAt
      )
      .run();
  }

  public async stageMfaEnrollment(adminId: string, secret: string): Promise<boolean> {
    const encryptedSecret = await this.mapper.encryptSecret(secret, adminId);
    const result = await this.db.prepare(`
      UPDATE identity_admins
      SET mfa_secret = ?, mfa_enabled = 0, mfa_last_used_counter = NULL,
        updated_at = ?
      WHERE id = ? AND is_active = 1 AND mfa_enabled = 0
    `).bind(encryptedSecret, new Date().toISOString(), adminId).run();
    return Number(result.meta?.changes || 0) === 1;
  }

  public async findMfaEnrollment(adminId: string): Promise<AdminMfaEnrollmentState | null> {
    const row = await this.db.prepare(`
      SELECT is_active, mfa_enabled, mfa_secret, mfa_enrollment_failed_attempts, mfa_enrollment_locked_until
      FROM identity_admins WHERE id = ? LIMIT 1
    `).bind(adminId).first<Record<string, unknown>>();
    if (!row) return null;
    const secret = await this.mapper.readSecret(adminId, (row.mfa_secret as string) || null);
    return {
      active: Boolean(row.is_active),
      enabled: Boolean(row.mfa_enabled),
      secret: secret?.secret,
      failedAttempts: Number(row.mfa_enrollment_failed_attempts || 0),
      lockedUntil: (row.mfa_enrollment_locked_until as string) || undefined,
    };
  }

  public async recordMfaEnrollmentFailure(input: {
    adminId: string; now: string; lockUntil: string; maxAttempts: number;
  }): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE identity_admins
      SET mfa_enrollment_failed_attempts = CASE
            WHEN mfa_enrollment_locked_until IS NOT NULL AND mfa_enrollment_locked_until <= ? THEN 1
            ELSE mfa_enrollment_failed_attempts + 1
          END,
          mfa_enrollment_locked_until = CASE
            WHEN CASE
              WHEN mfa_enrollment_locked_until IS NOT NULL AND mfa_enrollment_locked_until <= ? THEN 1
              ELSE mfa_enrollment_failed_attempts + 1
            END >= ? THEN ?
            ELSE NULL
          END,
          updated_at = ?
      WHERE id = ? AND is_active = 1 AND mfa_enabled = 0 AND mfa_secret IS NOT NULL
        AND (mfa_enrollment_locked_until IS NULL OR mfa_enrollment_locked_until <= ?)
    `).bind(
      input.now, input.now, input.maxAttempts, input.lockUntil, input.now, input.adminId, input.now,
    ).run();
    return Number(result.meta?.changes || 0) === 1;
  }

  public async completeMfaEnrollment(
    adminId: string, secret: string, counter: number, now: string,
  ): Promise<boolean> {
    const row = await this.db.prepare(`
      SELECT mfa_secret FROM identity_admins WHERE id = ? LIMIT 1
    `).bind(adminId).first<{ mfa_secret: string | null }>();
    const storedSecret = await this.mapper.readSecret(adminId, row?.mfa_secret || null);
    if (!storedSecret || storedSecret.secret !== secret) return false;
    const result = await this.db.prepare(`
      UPDATE identity_admins
      SET mfa_enabled = 1, mfa_last_used_counter = ?,
        mfa_enrollment_failed_attempts = 0, mfa_enrollment_locked_until = NULL,
        updated_at = ?
      WHERE id = ? AND is_active = 1 AND mfa_enabled = 0 AND mfa_secret = ?
        AND (mfa_enrollment_locked_until IS NULL OR mfa_enrollment_locked_until <= ?)
        AND (mfa_last_used_counter IS NULL OR mfa_last_used_counter < ?)
    `).bind(counter, now, adminId, storedSecret.storageValue, now, counter).run();
    return Number(result.meta?.changes || 0) === 1;
  }

  public async consumeTotpCounter(adminId: string, counter: number): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE identity_admins SET mfa_last_used_counter = ?, updated_at = ?
      WHERE id = ? AND is_active = 1 AND mfa_enabled = 1 AND mfa_secret IS NOT NULL
        AND (mfa_last_used_counter IS NULL OR mfa_last_used_counter < ?)
    `).bind(counter, new Date().toISOString(), adminId, counter).run();
    return Number(result.meta?.changes || 0) === 1;
  }
}
