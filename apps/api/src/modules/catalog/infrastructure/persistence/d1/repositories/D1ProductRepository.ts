import { Product } from '../../../../domain/entities/Product.js';
import { IProductRepository } from '../../../../domain/ports/IProductRepository.js';
import { D1ProductMapper, ProductRow } from './D1ProductMapper.js';

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
          id, name, slug, description, price_in_cents, supplier_cost_cents, target_margin_basis_points, pricing_target_type, target_profit_cents, allowed_payment_methods, pricing_version, legacy_price_before_tax_cents, sku, stock_quantity,
          status, condition, specifications, brand, product_type, tags, barcode_gtin,
          seo_title, seo_description, canonical_url, og_image_id, noindex,
          allows_cash_on_delivery, shipping_scope, sale_mode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          description = excluded.description,
          price_in_cents = excluded.price_in_cents,
          supplier_cost_cents = excluded.supplier_cost_cents,
          target_margin_basis_points = excluded.target_margin_basis_points,
          pricing_target_type = excluded.pricing_target_type,
          target_profit_cents = excluded.target_profit_cents,
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
        p.pricingTargetType, p.targetProfitCents,
        JSON.stringify(p.allowedPaymentMethods), p.pricingVersion, p.legacyPriceBeforeTaxCents, p.sku, p.stockQuantity,
        p.status, p.condition, JSON.stringify(p.specifications), p.brand ?? null,
        p.productType ?? null, JSON.stringify(p.tags), p.barcodeGtin ?? null,
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

  public async list(limit: number, offset: number, status?: string): Promise<Product[]> {
    let query = 'SELECT * FROM catalog_products';
    const params: unknown[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await this.db.prepare(query).bind(...params).all<ProductRow>();
    return Promise.all((results || []).map((row) => D1ProductMapper.hydrate(row, this.db)));
  }

  public async search(query: string, limit: number, offset: number, status?: string): Promise<Product[]> {
    const fetchLimit = Math.min(limit + offset, 500);
    const ftsResults = await this.db
      .prepare(`SELECT catalog_products_fts.product_id FROM catalog_products_fts
        JOIN catalog_products ON catalog_products.id = catalog_products_fts.product_id
        WHERE catalog_products_fts MATCH ? ${status ? 'AND catalog_products.status = ?' : ''}
        LIMIT ?`)
      .bind(...(status ? [query, status, fetchLimit] : [query, fetchLimit]))
      .all<{ product_id: string }>();

    const brandQuery = `SELECT id FROM catalog_products
      WHERE instr(lower(COALESCE(brand, '')), lower(?)) > 0 ${status ? 'AND status = ?' : ''}
      ORDER BY created_at DESC LIMIT ?`;
    const brandResults = await this.db.prepare(brandQuery)
      .bind(...(status ? [query, status, fetchLimit] : [query, fetchLimit]))
      .all<{ id: string }>();
    const productIds = [...new Set([
      ...(ftsResults.results || []).map((row) => row.product_id),
      ...(brandResults.results || []).map((row) => row.id),
    ])];
    const products = (await Promise.all(productIds.map((id) => this.findById(id))))
      .filter((product): product is Product => Boolean(product));
    return products.slice(offset, offset + limit);
  }

}
