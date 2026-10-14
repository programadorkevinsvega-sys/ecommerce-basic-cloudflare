import { Brand } from '../../../../domain/entities/Brand.js';
import { IBrandRepository } from '../../../../domain/ports/IBrandRepository.js';
import { CatalogPageQuery } from '../../../../domain/ports/CatalogPageQuery.js';

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website_url?: string;
  image_media_id?: string | null;
  status: 'active' | 'inactive';
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
      `INSERT INTO catalog_brands (id, name, slug, description, website_url, status, created_at, updated_at, image_media_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         description = excluded.description,
         website_url = excluded.website_url,
         status = excluded.status,
         image_media_id = excluded.image_media_id,
         updated_at = excluded.updated_at`
    ).bind(p.id, p.name, p.slug, p.description ?? null, p.websiteUrl ?? null, p.status, p.createdAt, p.updatedAt, p.imageMediaId ?? null).run();
  }

  public async delete(id: string): Promise<void> {
    const brand = await this.findById(id);
    if (brand) {
      const used = await this.db.prepare('SELECT id FROM catalog_products WHERE brand = ? LIMIT 1').bind(brand.name).first();
      if (used) throw new Error('No se puede eliminar una marca asignada a productos; ocúltala para mantener su catálogo.');
    }
    await this.db.prepare('DELETE FROM catalog_brands WHERE id = ?').bind(id).run();
  }

  public async list(query?: CatalogPageQuery): Promise<Brand[]> {
    const where = query?.includeInactive ? '' : " WHERE status = 'active'";
    const statement = query?.limit
      ? this.db.prepare('SELECT * FROM catalog_brands' + where + ' ORDER BY name ASC LIMIT ? OFFSET ?').bind(query.limit, query.offset ?? 0)
      : this.db.prepare('SELECT * FROM catalog_brands' + where + ' ORDER BY name ASC');
    const { results } = await statement.all<BrandRow>();
    return (results || []).map((r) => this.toDomain(r));
  }

  private toDomain(row: BrandRow): Brand {
    return new Brand({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      websiteUrl: row.website_url ?? undefined,
      imageMediaId: row.image_media_id ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
