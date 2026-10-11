import { Redirect } from '../../../../domain/entities/Redirect.js';
import { IRedirectRepository } from '../../../../domain/ports/IRedirectRepository.js';

interface RedirectRow {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  created_at: string;
  updated_at: string;
}

export class D1RedirectRepository implements IRedirectRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findByFromPath(fromPath: string): Promise<Redirect | null> {
    const row = await this.db
      .prepare('SELECT * FROM seo_redirects WHERE from_path = ?')
      .bind(fromPath)
      .first<RedirectRow>();

    return row
      ? new Redirect({
          id: row.id,
          fromPath: row.from_path,
          toPath: row.to_path,
          statusCode: row.status_code,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      : null;
  }

  public async save(redirect: Redirect): Promise<void> {
    const p = redirect.toPrimitives();
    await this.db
      .prepare(
        `INSERT INTO seo_redirects (id, from_path, to_path, status_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(from_path) DO UPDATE SET
           to_path = excluded.to_path,
           status_code = excluded.status_code,
           updated_at = excluded.updated_at`
      )
      .bind(p.id, p.fromPath, p.toPath, p.statusCode, p.createdAt, p.updatedAt)
      .run();
  }

  public async list(limit: number, offset: number): Promise<Redirect[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM seo_redirects ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<RedirectRow>();

    return (results || []).map(
      (r) =>
        new Redirect({
          id: r.id,
          fromPath: r.from_path,
          toPath: r.to_path,
          statusCode: r.status_code,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })
    );
  }
}
