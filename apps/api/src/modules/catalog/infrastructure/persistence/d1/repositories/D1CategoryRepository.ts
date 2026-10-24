import { Category } from '../../../../domain/entities/Category.js';
import { ICategoryRepository } from '../../../../domain/ports/ICategoryRepository.js';
import { CatalogPageQuery } from '../../../../domain/ports/CatalogPageQuery.js';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  status: 'active' | 'inactive';
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
        `INSERT INTO catalog_categories (id, name, slug, description, parent_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           slug = excluded.slug,
           description = excluded.description,
           parent_id = excluded.parent_id,
           status = excluded.status,
           updated_at = excluded.updated_at`
      )
      .bind(p.id, p.name, p.slug, p.description ?? null, p.parentId ?? null, p.status, p.createdAt, p.updatedAt)
      .run();
  }

  public async delete(id: string): Promise<void> {
    const assigned = await this.db.prepare('SELECT product_id FROM catalog_product_categories WHERE category_id = ? LIMIT 1').bind(id).first();
    if (assigned) throw new Error('No se puede eliminar una categoría usada por productos; ocúltala para conservar esas relaciones.');
    await this.db.prepare('DELETE FROM catalog_categories WHERE id = ?').bind(id).run();
  }

  public async list(query?: CatalogPageQuery): Promise<Category[]> {
    const filters = categoryFilters(query);
    const statement = query?.limit ? this.db.prepare(`SELECT * FROM catalog_categories${filters.where} ORDER BY name ASC,id LIMIT ? OFFSET ?`).bind(...filters.values, query.limit, query.offset ?? 0)
      : this.db.prepare(`SELECT * FROM catalog_categories${filters.where} ORDER BY name ASC,id`).bind(...filters.values);
    const { results } = await statement.all<CategoryRow>();

    return (results || []).map((r) => this.toDomain(r));
  }

  public async count(includeInactive = false, query?: string): Promise<number> {
    const filters = categoryFilters({ includeInactive, query });
    const row = await this.db.prepare(`SELECT COUNT(*) AS total FROM catalog_categories${filters.where}`).bind(...filters.values).first<{ total: number }>();
    return Number(row?.total || 0);
  }

  private toDomain(row: CategoryRow): Category {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      parentId: row.parent_id ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

function categoryFilters(query?: CatalogPageQuery): { where: string; values: string[] } {
  const clauses = query?.includeInactive ? [] : ["status = 'active'"];
  const term = query?.query?.trim().normalize('NFC').slice(0, 100);
  if (term) clauses.push('instr(lower(name),lower(?))>0');
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values: term ? [term] : [] };
}
