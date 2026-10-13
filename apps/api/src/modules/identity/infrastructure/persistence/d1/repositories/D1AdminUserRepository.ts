import { IAdminUserRepository } from '../../../../domain/repositories/IAdminUserRepository.js';
import { AdminUser } from '../../../../domain/entities/AdminUser.js';

export class D1AdminUserRepository implements IAdminUserRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM identity_admins WHERE id = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(id).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async findByEmail(email: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM identity_admins WHERE email = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(email.trim().toLowerCase()).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async findSoleActiveSuperadmin(): Promise<AdminUser | null> {
    const query = "SELECT * FROM identity_admins WHERE role_id = 'role_superadmin' AND is_active = 1 ORDER BY created_at ASC LIMIT 2";
    const { results } = await this.db.prepare(query).all();
    if (!results || results.length !== 1) return null;
    return this.mapToEntity(results[0] as Record<string, unknown>);
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
    return (results || []).map((r) => this.mapToEntity(r as Record<string, unknown>));
  }

  public async save(admin: AdminUser): Promise<void> {
    const s = admin.toSnapshot();
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
        s.mfaSecret || null,
        s.mfaEnabled ? 1 : 0,
        s.failedLoginAttempts,
        s.lockedUntil || null,
        s.isActive ? 1 : 0,
        s.createdAt,
        s.updatedAt
      )
      .run();
  }

  private mapToEntity(row: Record<string, unknown>): AdminUser {
    return AdminUser.create({
      id: row.id as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      fullName: row.full_name as string,
      roleId: row.role_id as string,
      mfaSecret: (row.mfa_secret as string) || undefined,
      mfaEnabled: Boolean(row.mfa_enabled),
      failedLoginAttempts: Number(row.failed_login_attempts || 0),
      lockedUntil: (row.locked_until as string) || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  }
}
