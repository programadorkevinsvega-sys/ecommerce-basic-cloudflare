import { Brand } from '../../../../domain/entities/Brand.js';
import { IBrandRepository } from '../../../../domain/ports/IBrandRepository.js';

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

export class D1BrandRepository implements IBrandRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Brand | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_brands WHERE id = ?').bind(id).first<BrandRow>();
    return row ? this.toDomain(row) : null;
  }

  public async findBySlug(slug: string): Promise<Brand | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_brands WHERE slug = ?').bind(slug).first<BrandRow>();
    return row ? this.toDomain(row) : null;
  }

  public async save(brand: Brand): Promise<void> {
    const p = brand.toPrimitives();
    await this.db.prepare(
      `INSERT INTO catalog_brands (id, name, slug, description, website_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         description = excluded.description,
         website_url = excluded.website_url,
         updated_at = excluded.updated_at`
    ).bind(p.id, p.name, p.slug, p.description ?? null, p.websiteUrl ?? null, p.createdAt, p.updatedAt).run();
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM catalog_brands WHERE id = ?').bind(id).run();
  }

  public async list(): Promise<Brand[]> {
    const { results } = await this.db.prepare('SELECT * FROM catalog_brands ORDER BY name ASC').all<BrandRow>();
    return (results || []).map((r) => this.toDomain(r));
  }

  private toDomain(row: BrandRow): Brand {
    return new Brand({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      websiteUrl: row.website_url ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
