import { ISessionRepository } from '../../../../domain/repositories/ISessionRepository.js';
import { Session, ActorType } from '../../../../domain/entities/Session.js';

export class D1SessionRepository implements ISessionRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const query = 'SELECT * FROM identity_sessions WHERE token_hash = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(tokenHash).first();
    return row ? this.mapToEntity(row) : null;
  }

  public async save(session: Session): Promise<void> {
    const s = session.toSnapshot();
    const query = `
      INSERT INTO identity_sessions (
        id, token_hash, actor_type, actor_id, expires_at, ip_address, user_agent, created_at, last_active_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(token_hash) DO UPDATE SET
        expires_at = excluded.expires_at,
        last_active_at = excluded.last_active_at
    `;

    await this.db
      .prepare(query)
      .bind(
        s.id,
        s.tokenHash,
        s.actorType,
        s.actorId,
        s.expiresAt,
        s.ipAddress || null,
        s.userAgent || null,
        s.createdAt,
        s.lastActiveAt
      )
      .run();
  }

  public async deleteByTokenHash(tokenHash: string): Promise<void> {
    const query = 'DELETE FROM identity_sessions WHERE token_hash = ?';
    await this.db.prepare(query).bind(tokenHash).run();
  }

  public async deleteAllForActor(actorId: string): Promise<void> {
    const query = 'DELETE FROM identity_sessions WHERE actor_id = ?';
    await this.db.prepare(query).bind(actorId).run();
  }

  private mapToEntity(row: Record<string, unknown>): Session {
    return Session.create({
      id: row.id as string,
      tokenHash: row.token_hash as string,
      actorType: row.actor_type as ActorType,
      actorId: row.actor_id as string,
      expiresAt: row.expires_at as string,
      ipAddress: (row.ip_address as string) || undefined,
      userAgent: (row.user_agent as string) || undefined,
      createdAt: row.created_at as string,
      lastActiveAt: row.last_active_at as string,
    });
  }
}
