import { AdminUser } from '../../../../domain/entities/AdminUser.js';
import { TotpSecretCipher } from '../security/TotpSecretCipher.js';

export interface StoredTotpSecret {
  secret: string;
  storageValue: string;
}

export class D1AdminUserMapper {
  private readonly db: D1Database;
  private readonly cipher: TotpSecretCipher;

  public constructor(db: D1Database, cipher: TotpSecretCipher) {
    this.db = db;
    this.cipher = cipher;
  }

  public async toEntity(row: Record<string, unknown>): Promise<AdminUser> {
    const id = row.id as string;
    const secret = await this.readSecret(id, row.mfa_secret as string | null);
    return AdminUser.create({
      id,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      fullName: row.full_name as string,
      roleId: row.role_id as string,
      mfaSecret: secret?.secret,
      mfaEnabled: Boolean(row.mfa_enabled),
      failedLoginAttempts: Number(row.failed_login_attempts || 0),
      lockedUntil: (row.locked_until as string) || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  }

  public async encryptSecret(secret: string | undefined, adminId: string): Promise<string | null> {
    return secret ? this.cipher.encrypt(secret, adminId) : null;
  }

  public async readSecret(adminId: string, stored: string | null): Promise<StoredTotpSecret | null> {
    if (!stored) return null;
    const secret = await this.cipher.decrypt(stored, adminId);
    if (this.cipher.isEncrypted(stored)) return { secret, storageValue: stored };

    const storageValue = await this.cipher.encrypt(secret, adminId);
    await this.db.prepare(`
      UPDATE identity_admins SET mfa_secret = ?
      WHERE id = ? AND mfa_secret = ?
    `).bind(storageValue, adminId, stored).run();
    return { secret, storageValue };
  }
}
