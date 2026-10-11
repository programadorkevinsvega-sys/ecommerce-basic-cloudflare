import { Attribute, AttributeType } from '../../../../domain/entities/Attribute.js';
import { IAttributeRepository } from '../../../../domain/ports/IAttributeRepository.js';

interface AttributeRow {
  id: string;
  name: string;
  code: string;
  type: string;
  options: string;
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
      `INSERT INTO catalog_attributes (id, name, code, type, options, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         code = excluded.code,
         type = excluded.type,
         options = excluded.options,
         updated_at = excluded.updated_at`
    ).bind(p.id, p.name, p.code, p.type, JSON.stringify(p.options), p.createdAt, p.updatedAt).run();
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM catalog_attributes WHERE id = ?').bind(id).run();
  }

  public async list(): Promise<Attribute[]> {
    const { results } = await this.db.prepare('SELECT * FROM catalog_attributes ORDER BY name ASC').all<AttributeRow>();
    return (results || []).map((r) => this.toDomain(r));
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
