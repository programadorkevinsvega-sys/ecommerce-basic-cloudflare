import { Product, ProductStatus, ProductCondition } from '../../../../domain/entities/Product.js';
import { ProductSalePolicy, ShippingScope, SaleMode } from '../../../../domain/entities/ProductSalePolicy.js';
import { IProductRepository } from '../../../../domain/ports/IProductRepository.js';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_in_cents: number;
  supplier_cost_cents: number | null;
  target_margin_basis_points: number;
  allowed_payment_methods: string;
  pricing_version: number;
  legacy_price_before_tax_cents: number | null;
  sku: string;
  stock_quantity: number;
  status: string;
  condition: string;
  specifications: string;
  brand?: string;
  product_type?: string;
  tags: string;
  barcode_gtin?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  og_image_id?: string;
  noindex: number;
  allows_cash_on_delivery: number;
  shipping_scope: string;
  sale_mode: string;
  created_at: string;
  updated_at: string;
}

export class D1ProductRepository implements IProductRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<Product | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_products WHERE id = ?').bind(id).first<ProductRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    const row = await this.db.prepare('SELECT * FROM catalog_products WHERE slug = ?').bind(slug).first<ProductRow>();
    if (!row) return null;
    return this.hydrate(row);
  }

  public async save(product: Product): Promise<void> {
    const p = product.toPrimitives();
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO catalog_products (
          id, name, slug, description, price_in_cents, supplier_cost_cents, target_margin_basis_points, allowed_payment_methods, pricing_version, legacy_price_before_tax_cents, sku, stock_quantity,
          status, condition, specifications, brand, product_type, tags, barcode_gtin,
          seo_title, seo_description, canonical_url, og_image_id, noindex,
          allows_cash_on_delivery, shipping_scope, sale_mode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          description = excluded.description,
          price_in_cents = excluded.price_in_cents,
          supplier_cost_cents = excluded.supplier_cost_cents,
          target_margin_basis_points = excluded.target_margin_basis_points,
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
    return Promise.all((results || []).map((r) => this.hydrate(r)));
  }

  public async search(query: string, limit: number, offset: number): Promise<Product[]> {
    const ftsResults = await this.db
      .prepare('SELECT product_id FROM catalog_products_fts WHERE catalog_products_fts MATCH ? LIMIT ? OFFSET ?')
      .bind(query, limit, offset)
      .all<{ product_id: string }>();

    const productIds = (ftsResults.results || []).map((r) => r.product_id);
    const products: Product[] = [];
    for (const pid of productIds) {
      const p = await this.findById(pid);
      if (p) products.push(p);
    }
    return products;
  }

  private async hydrate(row: ProductRow): Promise<Product> {
    const categories = await this.db.prepare('SELECT category_id FROM catalog_product_categories WHERE product_id = ?').bind(row.id).all<{ category_id: string }>();
    const images = await this.db.prepare('SELECT media_id FROM catalog_product_images WHERE product_id = ? ORDER BY sort_order ASC').bind(row.id).all<{ media_id: string }>();
    const coverage = await this.db.prepare('SELECT zone_id FROM catalog_product_coverage WHERE product_id = ?').bind(row.id).all<{ zone_id: string }>();

    let specs: Record<string, unknown> = {};
    try { specs = JSON.parse(row.specifications || '{}'); } catch { specs = {}; }

    let tags: string[] = [];
    try { tags = JSON.parse(row.tags || '[]'); } catch { tags = []; }

    return new Product({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      priceInCents: row.price_in_cents,
      supplierCostCents: row.supplier_cost_cents, targetMarginBasisPoints: row.target_margin_basis_points,
      allowedPaymentMethods: this.parsePaymentMethods(row.allowed_payment_methods),
      pricingVersion: row.pricing_version,
      legacyPriceBeforeTaxCents: row.legacy_price_before_tax_cents,
      sku: row.sku,
      stockQuantity: row.stock_quantity,
      status: row.status as ProductStatus,
      condition: (row.condition || 'new') as ProductCondition,
      specifications: specs,
      brand: row.brand ?? undefined,
      productType: row.product_type ?? undefined,
      tags,
      barcodeGtin: row.barcode_gtin ?? undefined,
      seoTitle: row.seo_title ?? undefined,
      seoDescription: row.seo_description ?? undefined,
      canonicalUrl: row.canonical_url ?? undefined,
      ogImageId: row.og_image_id ?? undefined,
      noindex: row.noindex === 1,
      salePolicy: new ProductSalePolicy({
        allowsCashOnDelivery: row.allows_cash_on_delivery === 1,
        shippingScope: row.shipping_scope as ShippingScope,
        localCoverageZones: (coverage.results || []).map((c) => c.zone_id),
        saleMode: row.sale_mode as SaleMode,
      }),
      categoryIds: (categories.results || []).map((c) => c.category_id),
      mediaIds: (images.results || []).map((i) => i.media_id),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private parsePaymentMethods(value: string): Array<'wompi' | 'cash_on_delivery'> {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item): item is 'wompi' | 'cash_on_delivery' => item === 'wompi' || item === 'cash_on_delivery');
    } catch { /* Backward-compatible fallback for rows created before payment metadata. */ }
    return ['wompi', 'cash_on_delivery'];
  }
}
