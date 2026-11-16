import { AdminUser } from '../../domain/entities/AdminUser.js';
import { IAdminLoginAttemptRepository } from '../../domain/repositories/IAdminLoginAttemptRepository.js';
import { IAdminLoginLockoutAlertPort } from '../ports/IAdminLoginLockoutAlertPort.js';

const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export class AdminLoginThrottle {
  public constructor(
    private readonly attempts: IAdminLoginAttemptRepository,
    private readonly alert: IAdminLoginLockoutAlertPort,
  ) {}

  public async isBlocked(adminId: string, ipAddress?: string): Promise<boolean> {
    const sourceHash = await this.hashSource(ipAddress);
    if (!sourceHash) return false;
    return Boolean(await this.attempts.findActiveLock(adminId, sourceHash, new Date().toISOString()));
  }

  public async recordFailure(
    admin: AdminUser,
    adminEmail: string,
    ipAddress?: string,
    traceId?: string,
  ): Promise<void> {
    const sourceHash = await this.hashSource(ipAddress);
    if (!sourceHash) return;

    const now = new Date();
    const timestamp = now.toISOString();
    const result = await this.attempts.recordFailure({
      adminId: admin.id,
      sourceHash,
      now: timestamp,
      windowStartedAtCutoff: new Date(now.getTime() - WINDOW_MS).toISOString(),
      lockUntil: new Date(now.getTime() + LOCK_MS).toISOString(),
      maxAttempts: ATTEMPT_LIMIT,
      retentionCutoff: new Date(now.getTime() - RETENTION_MS).toISOString(),
    });

    if (result.alertRequired && result.lockedUntil) {
      console.warn(JSON.stringify({
        timestamp,
        service: 'ecommerce-api',
        module: 'identity',
        level: 'warn',
        trace_id: traceId || 'unknown',
        event: 'security.admin_login_ip_locked',
        admin_id: admin.id,
        source_hash: sourceHash,
        locked_until: result.lockedUntil,
      }));
      await this.alert.notifyAdminLoginBlocked({
        adminEmail,
        idempotencyKey: `admin-login-lockout:${admin.id}:${sourceHash}:${result.windowStartedAt}`,
        traceId,
      });
    }
  }

  public async clear(adminId: string, ipAddress?: string): Promise<void> {
    const sourceHash = await this.hashSource(ipAddress);
    if (sourceHash) await this.attempts.clear(adminId, sourceHash);
  }

  private async hashSource(ipAddress?: string): Promise<string | null> {
    const source = ipAddress?.trim();
    if (!source || source.length > 64) return null;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
