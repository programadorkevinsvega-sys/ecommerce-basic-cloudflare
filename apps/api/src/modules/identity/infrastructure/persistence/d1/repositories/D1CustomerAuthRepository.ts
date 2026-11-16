import { Customer } from '../../../../domain/entities/Customer.js';
import { ICustomerAuthRepository } from '../../../../domain/repositories/ICustomerAuthRepository.js';
import { CustomerAuthEmailRequest, CustomerAuthEmailType } from '../../../../domain/ports/CustomerAuthEmailRequest.js';

export class D1CustomerAuthRepository implements ICustomerAuthRepository {
  public constructor(private readonly db: D1Database) {}

  public async registerWithVerification(
    customer: Customer, tokenHash: string, expiresAt: string, email: CustomerAuthEmailRequest
  ): Promise<boolean> {
    const c = customer.toSnapshot();
    const result = await this.db.batch([
      this.db.prepare(`INSERT INTO identity_customers
        (id, email, password_hash, full_name, phone, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?) ON CONFLICT(email) DO NOTHING`)
        .bind(c.id, c.email, c.passwordHash, c.fullName, c.phone || null, c.isActive ? 1 : 0, c.createdAt, c.updatedAt),
      this.insertToken(c.id, 'email_verification', tokenHash, expiresAt, email.createdAt),
      this.insertEmailOutbox(tokenHash, email),
    ]);
    return (result[0]?.meta?.changes || 0) === 1;
  }

  public async issueEmailActionToken(
    customerId: string, purpose: CustomerAuthEmailType, tokenHash: string, expiresAt: string,
    issuedAt: string, oneMinuteAgo: string, oneHourAgo: string, email: CustomerAuthEmailRequest
  ): Promise<boolean> {
    const result = await this.db.batch([
      this.db.prepare(`INSERT INTO identity_customer_auth_tokens
        (id, customer_id, token_hash, purpose, expires_at, consumed_at, created_at)
        SELECT ?, ?, ?, ?, ?, NULL, ? FROM identity_customers
        WHERE id = ? AND is_active = 1 AND (? != 'email_verification' OR email_verified = 0)
        AND NOT EXISTS (SELECT 1 FROM identity_customer_auth_tokens
          WHERE customer_id = ? AND purpose = ? AND created_at >= ?)
        AND (SELECT COUNT(*) FROM identity_customer_auth_tokens
          WHERE customer_id = ? AND purpose = ? AND created_at >= ?) < 5`)
        .bind(crypto.randomUUID(), customerId, tokenHash, purpose, expiresAt, issuedAt, customerId,
          purpose, customerId, purpose, oneMinuteAgo, customerId, purpose, oneHourAgo),
      this.db.prepare(`UPDATE identity_customer_auth_tokens SET consumed_at = ?
        WHERE customer_id = ? AND purpose = ? AND token_hash != ? AND consumed_at IS NULL
        AND EXISTS (SELECT 1 FROM identity_customer_auth_tokens WHERE token_hash = ?)`)
        .bind(issuedAt, customerId, purpose, tokenHash, tokenHash),
      this.insertEmailOutbox(tokenHash, email),
    ]);
    return (result[0]?.meta?.changes || 0) === 1;
  }

  public async verifyEmail(tokenHash: string, now: string): Promise<boolean> {
    const result = await this.db.batch([
      this.db.prepare(`UPDATE identity_customers SET email_verified = 1, updated_at = ?
        WHERE is_active = 1 AND email_verified = 0 AND id = (
          SELECT customer_id FROM identity_customer_auth_tokens
          WHERE token_hash = ? AND purpose = 'email_verification' AND consumed_at IS NULL AND expires_at > ?
        )`).bind(now, tokenHash, now),
      this.db.prepare(`UPDATE identity_customer_auth_tokens SET consumed_at = ?
        WHERE token_hash = ? AND purpose = 'email_verification' AND consumed_at IS NULL AND expires_at > ?`)
        .bind(now, tokenHash, now),
    ]);
    return (result[0]?.meta?.changes || 0) === 1;
  }

  public async resetPassword(tokenHash: string, passwordHash: string, now: string): Promise<boolean> {
    const result = await this.db.batch([
      this.db.prepare(`UPDATE identity_customers SET password_hash = ?, updated_at = ?
        WHERE is_active = 1 AND id = (
          SELECT customer_id FROM identity_customer_auth_tokens
          WHERE token_hash = ? AND purpose = 'password_reset' AND consumed_at IS NULL AND expires_at > ?
        )`).bind(passwordHash, now, tokenHash, now),
      this.db.prepare(`UPDATE identity_customer_auth_tokens SET consumed_at = ?
        WHERE token_hash = ? AND purpose = 'password_reset' AND consumed_at IS NULL AND expires_at > ?`)
        .bind(now, tokenHash, now),
      this.db.prepare(`UPDATE identity_customer_auth_tokens SET consumed_at = ? WHERE consumed_at IS NULL
        AND customer_id = (SELECT customer_id FROM identity_customer_auth_tokens WHERE token_hash = ?)`)
        .bind(now, tokenHash),
      this.db.prepare(`DELETE FROM identity_sessions WHERE actor_type = 'customer'
        AND actor_id = (SELECT customer_id FROM identity_customer_auth_tokens WHERE token_hash = ?)`)
        .bind(tokenHash),
      this.db.prepare(`DELETE FROM identity_customer_login_attempts
        WHERE customer_id = (SELECT customer_id FROM identity_customer_auth_tokens WHERE token_hash = ?)`)
        .bind(tokenHash),
    ]);
    return (result[0]?.meta?.changes || 0) === 1;
  }

  private insertToken(customerId: string, purpose: CustomerAuthEmailType, tokenHash: string, expiresAt: string, now: string): D1PreparedStatement {
    return this.db.prepare(`INSERT INTO identity_customer_auth_tokens
      (id, customer_id, token_hash, purpose, expires_at, consumed_at, created_at)
      SELECT ?, ?, ?, ?, ?, NULL, ? WHERE EXISTS (
        SELECT id FROM identity_customers WHERE id = ? AND email_verified = 0
      )`).bind(crypto.randomUUID(), customerId, tokenHash, purpose, expiresAt, now, customerId);
  }

  private insertEmailOutbox(tokenHash: string, email: CustomerAuthEmailRequest): D1PreparedStatement {
    const payload = JSON.stringify({
      emailType: email.emailType, recipientEmail: email.recipientEmail, actionUrl: email.actionUrl,
    });
    return this.db.prepare(`INSERT INTO identity_outbox_events
      (id, event_id, event_type, event_version, payload, trace_id, status, attempts, created_at)
      SELECT ?, ?, ?, 1, ?, ?, 'pending', 0, ?
      WHERE EXISTS (SELECT id FROM identity_customer_auth_tokens WHERE token_hash = ?)`)
      .bind(crypto.randomUUID(), email.eventId, email.eventType, payload, email.traceId, email.createdAt, tokenHash);
  }
}
