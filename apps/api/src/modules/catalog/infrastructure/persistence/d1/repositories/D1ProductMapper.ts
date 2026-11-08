import { Product, ProductCondition, ProductStatus } from '../../../../domain/entities/Product.js';
import { ProductSalePolicy, SaleMode, ShippingScope } from '../../../../domain/entities/ProductSalePolicy.js';

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_in_cents: number;
  supplier_cost_cents: number | null;
  target_margin_basis_points: number;
  pricing_target_type: string;
  target_profit_cents: number | null;
  packed_width_cm?: number | null;
  packed_length_cm?: number | null;
  packed_height_cm?: number | null;
  packed_weight_grams?: number | null;
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
  guide_title?: string | null;
  guide_content?: string | null;
  related_blog_post_ids?: string;
  barcode_gtin?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  og_image_id?: string;
  noindex: number;
  electronic_invoice_enabled?: number;
  allows_cash_on_delivery: number;
  shipping_scope: string;
  sale_mode: string;
  created_at: string;
  updated_at: string;
}

export class D1ProductMapper {
  public static async hydrate(row: ProductRow, db: D1Database): Promise<Product> {
    const [categories, images, coverage] = await Promise.all([
      db.prepare('SELECT category_id FROM catalog_product_categories WHERE product_id = ?').bind(row.id).all<{ category_id: string }>(),
      db.prepare('SELECT media_id FROM catalog_product_images WHERE product_id = ? ORDER BY sort_order ASC').bind(row.id).all<{ media_id: string }>(),
      db.prepare('SELECT zone_id FROM catalog_product_coverage WHERE product_id = ?').bind(row.id).all<{ zone_id: string }>(),
    ]);
    return this.fromRelations(row,
      (categories.results || []).map((item) => item.category_id),
      (images.results || []).map((item) => item.media_id),
      (coverage.results || []).map((item) => item.zone_id));
  }

  public static async hydrateMany(rows: ProductRow[], db: D1Database): Promise<Product[]> {
    const relations = new Map<string, { categories: string[]; images: string[]; coverage: string[] }>();
    for (const row of rows) relations.set(row.id, { categories: [], images: [], coverage: [] });
    for (let start = 0; start < rows.length; start += 100) {
      const ids = rows.slice(start, start + 100).map((row) => row.id);
      const placeholders = ids.map(() => '?').join(', ');
      const [categories, images, coverage] = await Promise.all([
        db.prepare(`SELECT product_id, category_id FROM catalog_product_categories WHERE product_id IN (${placeholders})`).bind(...ids).all<{ product_id: string; category_id: string }>(),
        db.prepare(`SELECT product_id, media_id FROM catalog_product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC`).bind(...ids).all<{ product_id: string; media_id: string }>(),
        db.prepare(`SELECT product_id, zone_id FROM catalog_product_coverage WHERE product_id IN (${placeholders})`).bind(...ids).all<{ product_id: string; zone_id: string }>(),
      ]);
      for (const item of categories.results || []) relations.get(item.product_id)?.categories.push(item.category_id);
      for (const item of images.results || []) relations.get(item.product_id)?.images.push(item.media_id);
      for (const item of coverage.results || []) relations.get(item.product_id)?.coverage.push(item.zone_id);
    }
    return rows.map((row) => {
      const relation = relations.get(row.id);
      return this.fromRelations(row, relation?.categories || [], relation?.images || [], relation?.coverage || []);
    });
  }

  private static fromRelations(row: ProductRow, categories: string[], images: string[], coverage: string[]): Product {
    return new Product({
      id: row.id, name: row.name, slug: row.slug, description: row.description,
      priceInCents: row.price_in_cents, supplierCostCents: row.supplier_cost_cents,
      targetMarginBasisPoints: row.target_margin_basis_points,
      pricingTargetType: row.pricing_target_type === 'profit' ? 'profit' : 'margin',
      targetProfitCents: row.target_profit_cents,
      packedWidthCm: row.packed_width_cm ?? null,
      packedLengthCm: row.packed_length_cm ?? null,
      packedHeightCm: row.packed_height_cm ?? null,
      packedWeightGrams: row.packed_weight_grams ?? null,
      allowedPaymentMethods: parsePaymentMethods(row.allowed_payment_methods),
      pricingVersion: row.pricing_version, legacyPriceBeforeTaxCents: row.legacy_price_before_tax_cents,
      sku: row.sku, stockQuantity: row.stock_quantity, status: row.status as ProductStatus,
      condition: (row.condition || 'new') as ProductCondition, specifications: parseObject(row.specifications),
      brand: row.brand, productType: row.product_type, tags: parseArray(row.tags), barcodeGtin: row.barcode_gtin,
      guideTitle: row.guide_title ?? undefined, guideContent: row.guide_content ?? undefined, relatedBlogPostIds: parseArray(row.related_blog_post_ids || '[]'),
      seoTitle: row.seo_title, seoDescription: row.seo_description, canonicalUrl: row.canonical_url,
      ogImageId: row.og_image_id, noindex: row.noindex === 1,
      electronicInvoiceEnabled: row.electronic_invoice_enabled === 1,
      salePolicy: new ProductSalePolicy({
        allowsCashOnDelivery: row.allows_cash_on_delivery === 1,
        shippingScope: row.shipping_scope as ShippingScope,
        localCoverageZones: coverage,
        saleMode: row.sale_mode as SaleMode,
      }),
      categoryIds: categories,
      mediaIds: images,
      createdAt: row.created_at, updatedAt: row.updated_at,
    });
  }
}

function parseObject(value: string): Record<string, unknown> {
  try { return JSON.parse(value || '{}') as Record<string, unknown>; } catch { return {}; }
}

function parseArray(value: string): string[] {
  try { return JSON.parse(value || '[]') as string[]; } catch { return []; }
}

function parsePaymentMethods(value: string): Array<'wompi' | 'cash_on_delivery'> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is 'wompi' | 'cash_on_delivery' => item === 'wompi' || item === 'cash_on_delivery');
  } catch { /* Backward-compatible fallback for rows created before payment metadata. */ }
  return ['wompi', 'cash_on_delivery'];
}
