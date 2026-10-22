import { Product } from '../../../../domain/entities/Product.js';
import { IProductRepository } from '../../../../domain/ports/IProductRepository.js';
import { D1ProductMapper, ProductRow } from './D1ProductMapper.js';
import { buildCatalogFtsPrefixQuery } from '../CatalogFtsPrefixQuery.js';
import { ProductListFilters } from '../../../../domain/ports/ProductListQuery.js';

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
    const p = product.toPrimitives();
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO catalog_products (
          id, name, slug, description, price_in_cents, supplier_cost_cents, target_margin_basis_points, pricing_target_type, target_profit_cents, packed_width_cm, packed_length_cm, packed_height_cm, packed_weight_grams, allowed_payment_methods, pricing_version, legacy_price_before_tax_cents, sku, stock_quantity,
          status, condition, specifications, brand, product_type, tags, guide_title, guide_content, related_blog_post_ids, barcode_gtin,
          seo_title, seo_description, canonical_url, og_image_id, noindex,
          allows_cash_on_delivery, shipping_scope, sale_mode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          description = excluded.description,
          price_in_cents = excluded.price_in_cents,
          supplier_cost_cents = excluded.supplier_cost_cents,
          target_margin_basis_points = excluded.target_margin_basis_points,
          pricing_target_type = excluded.pricing_target_type,
          target_profit_cents = excluded.target_profit_cents,
          packed_width_cm = excluded.packed_width_cm,
          packed_length_cm = excluded.packed_length_cm,
          packed_height_cm = excluded.packed_height_cm,
          packed_weight_grams = excluded.packed_weight_grams,
          allowed_payment_methods = excluded.allowed_payment_methods,
          pricing_version = excluded.pricing_version,
          legacy_price_before_tax_cents = excluded.legacy_price_before_tax_cents,
          sku = excluded.sku,
          stock_quantity = excluded.stock_quantity,
          status = excluded.status,
          condition = excluded.condition,
          specifications = excluded.specifications,
          brand = excluded.brand,
          product_type = excluded.product_type,
          tags = excluded.tags,
          guide_title = excluded.guide_title,
          guide_content = excluded.guide_content,
          related_blog_post_ids = excluded.related_blog_post_ids,
          barcode_gtin = excluded.barcode_gtin,
          seo_title = excluded.seo_title,
          seo_description = excluded.seo_description,
          canonical_url = excluded.canonical_url,
          og_image_id = excluded.og_image_id,
          noindex = excluded.noindex,
          allows_cash_on_delivery = excluded.allows_cash_on_delivery,
          shipping_scope = excluded.shipping_scope,
          sale_mode = excluded.sale_mode,
          updated_at = excluded.updated_at`
      ).bind(
        p.id, p.name, p.slug, p.description, p.priceInCents, p.supplierCostCents, p.targetMarginBasisPoints,
        p.pricingTargetType, p.targetProfitCents, p.packedWidthCm, p.packedLengthCm,
        p.packedHeightCm, p.packedWeightGrams,
        JSON.stringify(p.allowedPaymentMethods), p.pricingVersion, p.legacyPriceBeforeTaxCents, p.sku, p.stockQuantity,
        p.status, p.condition, JSON.stringify(p.specifications), p.brand ?? null,
        p.productType ?? null, JSON.stringify(p.tags), p.guideTitle ?? null, p.guideContent ?? null, JSON.stringify(p.relatedBlogPostIds), p.barcodeGtin ?? null,
        p.seoTitle ?? null, p.seoDescription ?? null, p.canonicalUrl ?? null,
        p.ogImageId ?? null, p.noindex ? 1 : 0,
        p.salePolicy.allowsCashOnDelivery ? 1 : 0, p.salePolicy.shippingScope,
        p.salePolicy.saleMode, p.createdAt, p.updatedAt
      ),
      this.db.prepare('DELETE FROM catalog_product_categories WHERE product_id = ?').bind(p.id),
      this.db.prepare('DELETE FROM catalog_product_images WHERE product_id = ?').bind(p.id),
      this.db.prepare('DELETE FROM catalog_product_coverage WHERE product_id = ?').bind(p.id),
      this.db.prepare('DELETE FROM catalog_products_fts WHERE product_id = ?').bind(p.id),
      this.db.prepare('INSERT INTO catalog_products_fts (product_id, name, description, sku) VALUES (?, ?, ?, ?)').bind(p.id, p.name, p.description, p.sku),
    ]);

    for (const catId of p.categoryIds) {
      await this.db.prepare('INSERT INTO catalog_product_categories (product_id, category_id) VALUES (?, ?)').bind(p.id, catId).run();
    }
    for (let i = 0; i < p.mediaIds.length; i++) {
      const mediaId = p.mediaIds[i] as string;
      await this.db.prepare('INSERT INTO catalog_product_images (id, product_id, media_id, sort_order, alt_text, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), p.id, mediaId, i, p.name, p.createdAt).run();
    }
    for (const zoneId of p.salePolicy.localCoverageZones) {
      await this.db.prepare('INSERT INTO catalog_product_coverage (product_id, zone_id) VALUES (?, ?)').bind(p.id, zoneId).run();
    }
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
    return Promise.all((results || []).map((row) => D1ProductMapper.hydrate(row, this.db)));
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
    return Promise.all((results || []).map((row) => D1ProductMapper.hydrate(row, this.db)));
  }
}

function appendProductListFilters(where: string[], params: unknown[], filters: ProductListFilters, prefix: string): void {
  const brands = [...new Set((filters.brand ?? []).map((brand) => brand.trim()).filter(Boolean))].slice(0, 10);
  if (brands.length) {
    where.push(`${prefix}brand IN (${brands.map(() => '?').join(', ')})`);
    params.push(...brands);
  }
  if (filters.minPriceInCents !== undefined) {
    where.push(`${prefix}price_in_cents >= ?`);
    params.push(filters.minPriceInCents);
  }
  if (filters.maxPriceInCents !== undefined) {
    where.push(`${prefix}price_in_cents <= ?`);
    params.push(filters.maxPriceInCents);
  }
  if (filters.cashOnDeliveryOnly) {
    where.push(`${prefix}allows_cash_on_delivery = 1`);
  }
}

function productOrderBy(sort: ProductListFilters['sort'], prefix: string, search: boolean): string {
  if (sort === 'price_asc') return `${prefix}price_in_cents ASC, ${prefix}id ASC`;
  if (sort === 'price_desc') return `${prefix}price_in_cents DESC, ${prefix}id ASC`;
  if (sort === 'name_asc') return `${prefix}name COLLATE NOCASE ASC, ${prefix}id ASC`;
  return search
    ? 'm.match_priority ASC, m.relevance ASC, p.created_at DESC, p.id ASC'
    : `${prefix}created_at DESC, ${prefix}id ASC`;
}
