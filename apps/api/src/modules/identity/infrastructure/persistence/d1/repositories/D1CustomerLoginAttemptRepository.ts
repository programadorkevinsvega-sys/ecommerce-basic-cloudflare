import { ICustomerLoginAttemptRepository } from '../../../../domain/repositories/ICustomerLoginAttemptRepository.js';

interface LoginAttemptRow {
  failed_attempts: number;
  last_failed_at: string;
}

export class D1CustomerLoginAttemptRepository implements ICustomerLoginAttemptRepository {
  public constructor(private readonly db: D1Database) {}

  public async getRemainingDelay(accountKeyHash: string, now: number): Promise<number> {
    const row = await this.db.prepare(`
      SELECT failed_attempts, last_failed_at FROM identity_customer_login_attempts WHERE account_key_hash = ?
    `).bind(accountKeyHash).first<LoginAttemptRow>();
    if (!row || now - Date.parse(row.last_failed_at) > 15 * 60_000) return 0;
    const delay = Math.min(250 * 2 ** Math.min(row.failed_attempts - 1, 4), 4_000);
    return Math.max(0, delay - (now - Date.parse(row.last_failed_at)));
  }

  public async recordFailure(accountKeyHash: string, customerId: string | null, now: string, resetBefore: string): Promise<void> {
    await this.db.prepare(`
      INSERT INTO identity_customer_login_attempts (account_key_hash, customer_id, failed_attempts, last_failed_at, updated_at)
      VALUES (?, ?, 1, ?, ?)
      ON CONFLICT(account_key_hash) DO UPDATE SET
        customer_id = COALESCE(excluded.customer_id, identity_customer_login_attempts.customer_id),
        failed_attempts = CASE WHEN last_failed_at < ? THEN 1 ELSE MIN(failed_attempts + 1, 5) END,
        last_failed_at = excluded.last_failed_at,
        updated_at = excluded.updated_at
    `).bind(accountKeyHash, customerId, now, now, resetBefore).run();
  }

  public async clear(accountKeyHash: string): Promise<void> {
    await this.db.prepare('DELETE FROM identity_customer_login_attempts WHERE account_key_hash = ?')
      .bind(accountKeyHash).run();
  }
}
