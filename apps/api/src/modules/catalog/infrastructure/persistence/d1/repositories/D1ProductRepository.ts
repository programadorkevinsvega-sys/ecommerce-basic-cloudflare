import { Product } from '../../../../domain/entities/Product.js';
import { IProductRepository } from '../../../../domain/ports/IProductRepository.js';
import { D1ProductMapper, ProductRow } from './D1ProductMapper.js';
import { buildCatalogFtsPrefixQuery } from '../CatalogFtsPrefixQuery.js';
import { ProductListFilters } from '../../../../domain/ports/ProductListQuery.js';
import { countAdminProducts } from './D1ProductAdminCount.js';
import { appendProductListFilters, productOrderBy } from './productListSql.js';
import { buildD1ProductSaveStatements } from './D1ProductSaveStatements.js';
import { listD1AdminProducts } from './D1ProductAdminList.js';

export class D1ProductRepository implements IProductRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Product | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_products WHERE id = ?').bind(id).first<ProductRow>();
    if (!row) return null;
    return D1ProductMapper.hydrate(row, this.db);
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_products WHERE slug = ?').bind(slug).first<ProductRow>();
    if (!row) return null;
    return D1ProductMapper.hydrate(row, this.db);
  }

  public async save(product: Product): Promise<void> {
    await this.db.batch(buildD1ProductSaveStatements(this.db, product));
  }

  public async delete(id: string): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM catalog_products WHERE id = ?').bind(id),
      this.db.prepare('DELETE FROM catalog_product_categories WHERE product_id = ?').bind(id),
      this.db.prepare('DELETE FROM catalog_product_images WHERE product_id = ?').bind(id),
      this.db.prepare('DELETE FROM catalog_product_coverage WHERE product_id = ?').bind(id),
      this.db.prepare('DELETE FROM catalog_products_fts WHERE product_id = ?').bind(id),
    ]);
  }

  public async list(limit: number, offset: number, status?: string, filters: ProductListFilters = {}): Promise<Product[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (status) {
      where.push('p.status = ?');
      params.push(status);
    }
    appendProductListFilters(where, params, filters, 'p.');
    const query = `SELECT p.* FROM catalog_products AS p${where.length ? ` WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${productOrderBy(filters.sort, 'p.', false)} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const { results } = await this.db.prepare(query).bind(...params).all<ProductRow>();
    return D1ProductMapper.hydrateMany(results || [], this.db);
  }

  public async search(query: string, limit: number, offset: number, status?: string, filters: ProductListFilters = {}): Promise<Product[]> {
    const normalizedText = query.normalize('NFC').replace(/[^\p{L}\p{N}\s_]/gu, ' ').trim().replace(/\s+/g, ' ').slice(0, 120).trim();
    if (!normalizedText) return [];
    const ftsQuery = buildCatalogFtsPrefixQuery(normalizedText);
    const candidates: string[] = [];
    const params: unknown[] = [];

    if (ftsQuery) {
      candidates.push(`SELECT catalog_products_fts.product_id AS product_id,
          0 AS match_priority, bm25(catalog_products_fts) AS relevance
        FROM catalog_products_fts
        JOIN catalog_products AS source_product ON source_product.id = catalog_products_fts.product_id
        WHERE catalog_products_fts MATCH ? ${status ? 'AND source_product.status = ?' : ''}`);
      params.push(ftsQuery);
      if (status) params.push(status);
    }

    candidates.push(`SELECT id AS product_id, 1 AS match_priority, 0.0 AS relevance
      FROM catalog_products
      WHERE instr(lower(COALESCE(brand, '')), lower(?)) > 0 ${status ? 'AND status = ?' : ''}`);
    params.push(normalizedText);
    if (status) params.push(status);

    const where: string[] = [];
    if (status) {
      where.push('p.status = ?');
      params.push(status);
    }
    appendProductListFilters(where, params, filters, 'p.');
    const sql = `WITH candidate_matches AS (${candidates.join(' UNION ALL ')}),
      ranked_matches AS (
        SELECT product_id, MIN(match_priority) AS match_priority, MIN(relevance) AS relevance
        FROM candidate_matches
        GROUP BY product_id
      )
      SELECT p.* FROM ranked_matches AS m
      JOIN catalog_products AS p ON p.id = m.product_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${productOrderBy(filters.sort, 'p.', true)} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const { results } = await this.db.prepare(sql).bind(...params).all<ProductRow>();
    return D1ProductMapper.hydrateMany(results || [], this.db);
  }

  public listAdmin(limit: number, offset: number, status?: string, query?: string) {
    return listD1AdminProducts(this.db, limit, offset, status, query);
  }

  public count(status?: string, query?: string): Promise<number> { return countAdminProducts(this.db, status, query); }
}
