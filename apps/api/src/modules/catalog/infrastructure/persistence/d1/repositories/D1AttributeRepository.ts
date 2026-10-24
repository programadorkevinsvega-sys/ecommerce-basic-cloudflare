import { Attribute, AttributeType } from '../../../../domain/entities/Attribute.js';
import { IAttributeRepository } from '../../../../domain/ports/IAttributeRepository.js';
import { CatalogPageQuery } from '../../../../domain/ports/CatalogPageQuery.js';

interface AttributeRow {
  id: string;
  name: string;
  code: string;
  type: string;
  options: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export class D1AttributeRepository implements IAttributeRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Attribute | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_attributes WHERE id = ?').bind(id).first<AttributeRow>();
    return row ? this.toDomain(row) : null;
  }

  public async findByCode(code: string): Promise<Attribute | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_attributes WHERE code = ?').bind(code).first<AttributeRow>();
    return row ? this.toDomain(row) : null;
  }

  public async save(attribute: Attribute): Promise<void> {
    const p = attribute.toPrimitives();
    await this.db.prepare(
      `INSERT INTO catalog_attributes (id, name, code, type, options, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         code = excluded.code,
         type = excluded.type,
         options = excluded.options,
         status = excluded.status,
         updated_at = excluded.updated_at`
    ).bind(p.id, p.name, p.code, p.type, JSON.stringify(p.options), p.status, p.createdAt, p.updatedAt).run();
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM catalog_attributes WHERE id = ?').bind(id).run();
  }

  public async list(query?: CatalogPageQuery): Promise<Attribute[]> {
    const where = query?.includeInactive ? '' : " WHERE status = 'active'";
    const statement = query?.limit
      ? this.db.prepare('SELECT * FROM catalog_attributes' + where + ' ORDER BY name ASC,id LIMIT ? OFFSET ?').bind(query.limit, query.offset ?? 0)
      : this.db.prepare('SELECT * FROM catalog_attributes' + where + ' ORDER BY name ASC,id');
    const { results } = await statement.all<AttributeRow>();
    return (results || []).map((r) => this.toDomain(r));
  }

  public async count(includeInactive = false): Promise<number> {
    const where = includeInactive ? '' : " WHERE status = 'active'";
    const row = await this.db.prepare(`SELECT COUNT(*) AS total FROM catalog_attributes${where}`).first<{ total: number }>();
    return Number(row?.total || 0);
  }

  private toDomain(row: AttributeRow): Attribute {
    let opts: string[] = [];
    try { opts = JSON.parse(row.options || '[]'); } catch { opts = []; }

    return new Attribute({
      id: row.id,
      name: row.name,
      code: row.code,
      type: row.type as AttributeType,
      options: opts,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
