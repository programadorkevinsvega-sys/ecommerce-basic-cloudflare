import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository.js';
import { Customer } from '../../../../domain/entities/Customer.js';
import { Session } from '../../../../domain/entities/Session.js';

export class D1CustomerRepository implements ICustomerRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Customer | null> {
    const query = 'SELECT * FROM identity_customers WHERE id = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(id).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async findByEmail(email: string): Promise<Customer | null> {
    const query = 'SELECT * FROM identity_customers WHERE email = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(email.trim().toLowerCase()).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async save(customer: Customer): Promise<void> {
    const s = customer.toSnapshot();
    const query = `
      INSERT INTO identity_customers (
        id, email, password_hash, full_name, phone, is_active, email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        full_name = excluded.full_name,
        phone = excluded.phone,
        is_active = excluded.is_active,
        email_verified = excluded.email_verified,
        updated_at = excluded.updated_at
    `;

    await this.db
      .prepare(query)
      .bind(
        s.id,
        s.email,
        s.passwordHash,
        s.fullName,
        s.phone || null,
        s.isActive ? 1 : 0,
        s.emailVerified ? 1 : 0,
        s.createdAt,
        s.updatedAt
      )
      .run();
  }

  public async changePasswordAndRotateSessions(customer: Customer, session: Session): Promise<void> {
    const c = customer.toSnapshot();
    const s = session.toSnapshot();
    await this.db.batch([
      this.db.prepare('UPDATE identity_customers SET password_hash = ?, updated_at = ? WHERE id = ?')
        .bind(c.passwordHash, c.updatedAt, c.id),
      this.db.prepare('DELETE FROM identity_sessions WHERE actor_type = ? AND actor_id = ?')
        .bind('customer', c.id),
      this.db.prepare(`INSERT INTO identity_sessions
        (id, token_hash, actor_type, actor_id, expires_at, ip_address, user_agent, created_at, last_active_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(s.id, s.tokenHash, s.actorType, s.actorId, s.expiresAt, s.ipAddress || null,
          s.userAgent || null, s.createdAt, s.lastActiveAt),
    ]);
  }

  public async updateProfile(customerId: string, expectedPasswordHash: string, fullName: string, phone?: string): Promise<boolean> {
    const result = await this.db.prepare('UPDATE identity_customers SET full_name = ?, phone = ?, updated_at = ? WHERE id = ? AND password_hash = ? AND is_active = 1')
      .bind(fullName, phone || null, new Date().toISOString(), customerId, expectedPasswordHash).run();
    return (result.meta?.changes || 0) > 0;
  }

  private mapToEntity(row: Record<string, unknown>): Customer {
    return Customer.create({
      id: row.id as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      fullName: row.full_name as string,
      phone: (row.phone as string) || undefined,
      isActive: Boolean(row.is_active),
      emailVerified: Boolean(row.email_verified),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  }
}
