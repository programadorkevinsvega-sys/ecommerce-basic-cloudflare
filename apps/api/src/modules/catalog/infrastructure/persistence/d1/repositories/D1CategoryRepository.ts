import { Category } from '../../../../domain/entities/Category.js';
import { ICategoryRepository } from '../../../../domain/ports/ICategoryRepository.js';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export class D1CategoryRepository implements ICategoryRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Category | null> {
    const row = await this.db
      .prepare('SELECT * FROM catalog_categories WHERE id = ?')
      .bind(id)
      .first<CategoryRow>();

    return row ? this.toDomain(row) : null;
  }

  public async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.db
      .prepare('SELECT * FROM catalog_categories WHERE slug = ?')
      .bind(slug)
      .first<CategoryRow>();

    return row ? this.toDomain(row) : null;
  }

  public async save(category: Category): Promise<void> {
    const p = category.toPrimitives();
    await this.db
      .prepare(
        `INSERT INTO catalog_categories (id, name, slug, description, parent_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           slug = excluded.slug,
           description = excluded.description,
           parent_id = excluded.parent_id,
           updated_at = excluded.updated_at`
      )
      .bind(p.id, p.name, p.slug, p.description ?? null, p.parentId ?? null, p.createdAt, p.updatedAt)
      .run();
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM catalog_categories WHERE id = ?').bind(id).run();
  }

  public async list(): Promise<Category[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM catalog_categories ORDER BY name ASC')
      .all<CategoryRow>();

    return (results || []).map((r) => this.toDomain(r));
  }

  private toDomain(row: CategoryRow): Category {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      parentId: row.parent_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
