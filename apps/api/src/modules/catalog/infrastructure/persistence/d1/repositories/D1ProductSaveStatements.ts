import { Product } from '../../../../domain/entities/Product.js';
import {
  MAX_PRODUCT_AGGREGATE_BYTES,
  MAX_PRODUCT_BATCH_STATEMENTS,
  validateProductRelationships,
} from '../../../../domain/services/ProductAggregateLimits.js';

export function buildD1ProductSaveStatements(db: D1Database, product: Product): D1PreparedStatement[] {
  const p = product.toPrimitives();
  const relationshipError = validateProductRelationships({
    categoryIds: p.categoryIds,
    mediaIds: p.mediaIds,
    localCoverageZones: p.salePolicy.localCoverageZones,
  });
  if (relationshipError) throw relationshipError;

  const aggregateBytes = new TextEncoder().encode(JSON.stringify(p)).byteLength;
  if (aggregateBytes > MAX_PRODUCT_AGGREGATE_BYTES) {
    throw new Error('El agregado del producto excede el límite de tamaño D1');
  }

  const statements: D1PreparedStatement[] = [
    db.prepare(
      `INSERT INTO catalog_products (
        id, name, slug, description, price_in_cents, supplier_cost_cents, target_margin_basis_points, pricing_target_type, target_profit_cents, packed_width_cm, packed_length_cm, packed_height_cm, packed_weight_grams, allowed_payment_methods, pricing_version, legacy_price_before_tax_cents, sku, stock_quantity,
        status, condition, specifications, brand, product_type, tags, guide_title, guide_content, related_blog_post_ids, barcode_gtin,
        seo_title, seo_description, canonical_url, og_image_id, noindex,
        allows_cash_on_delivery, shipping_scope, sale_mode, electronic_invoice_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, slug = excluded.slug, description = excluded.description,
        price_in_cents = excluded.price_in_cents, supplier_cost_cents = excluded.supplier_cost_cents,
        target_margin_basis_points = excluded.target_margin_basis_points, pricing_target_type = excluded.pricing_target_type,
        target_profit_cents = excluded.target_profit_cents, packed_width_cm = excluded.packed_width_cm,
        packed_length_cm = excluded.packed_length_cm, packed_height_cm = excluded.packed_height_cm,
        packed_weight_grams = excluded.packed_weight_grams, allowed_payment_methods = excluded.allowed_payment_methods,
        pricing_version = excluded.pricing_version, legacy_price_before_tax_cents = excluded.legacy_price_before_tax_cents,
        sku = excluded.sku, stock_quantity = excluded.stock_quantity, status = excluded.status,
        condition = excluded.condition, specifications = excluded.specifications, brand = excluded.brand,
        product_type = excluded.product_type, tags = excluded.tags, guide_title = excluded.guide_title,
        guide_content = excluded.guide_content, related_blog_post_ids = excluded.related_blog_post_ids,
        barcode_gtin = excluded.barcode_gtin, seo_title = excluded.seo_title, seo_description = excluded.seo_description,
        canonical_url = excluded.canonical_url, og_image_id = excluded.og_image_id, noindex = excluded.noindex,
        allows_cash_on_delivery = excluded.allows_cash_on_delivery, shipping_scope = excluded.shipping_scope,
        sale_mode = excluded.sale_mode, electronic_invoice_enabled = excluded.electronic_invoice_enabled,
        updated_at = excluded.updated_at`
    ).bind(
      p.id, p.name, p.slug, p.description, p.priceInCents, p.supplierCostCents, p.targetMarginBasisPoints,
      p.pricingTargetType, p.targetProfitCents, p.packedWidthCm, p.packedLengthCm, p.packedHeightCm,
      p.packedWeightGrams, JSON.stringify(p.allowedPaymentMethods), p.pricingVersion, p.legacyPriceBeforeTaxCents,
      p.sku, p.stockQuantity, p.status, p.condition, JSON.stringify(p.specifications), p.brand ?? null,
      p.productType ?? null, JSON.stringify(p.tags), p.guideTitle ?? null, p.guideContent ?? null,
      JSON.stringify(p.relatedBlogPostIds), p.barcodeGtin ?? null, p.seoTitle ?? null, p.seoDescription ?? null,
      p.canonicalUrl ?? null, p.ogImageId ?? null, p.noindex ? 1 : 0, p.salePolicy.allowsCashOnDelivery ? 1 : 0,
      p.salePolicy.shippingScope, p.salePolicy.saleMode, p.electronicInvoiceEnabled ? 1 : 0, p.createdAt, p.updatedAt
    ),
    db.prepare('DELETE FROM catalog_product_categories WHERE product_id = ?').bind(p.id),
    db.prepare('DELETE FROM catalog_product_images WHERE product_id = ?').bind(p.id),
    db.prepare('DELETE FROM catalog_product_coverage WHERE product_id = ?').bind(p.id),
    db.prepare('DELETE FROM catalog_products_fts WHERE product_id = ?').bind(p.id),
    db.prepare('INSERT INTO catalog_products_fts (product_id, name, description, sku) VALUES (?, ?, ?, ?)')
      .bind(p.id, p.name, p.description, p.sku),
  ];

  for (const categoryId of p.categoryIds) {
    statements.push(db.prepare('INSERT INTO catalog_product_categories (product_id, category_id) VALUES (?, ?)')
      .bind(p.id, categoryId));
  }
  for (let index = 0; index < p.mediaIds.length; index++) {
    statements.push(db.prepare(
      'INSERT INTO catalog_product_images (id, product_id, media_id, sort_order, alt_text, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), p.id, p.mediaIds[index], index, p.name, p.createdAt));
  }
  for (const zoneId of p.salePolicy.localCoverageZones) {
    statements.push(db.prepare('INSERT INTO catalog_product_coverage (product_id, zone_id) VALUES (?, ?)')
      .bind(p.id, zoneId));
  }
  if (statements.length > MAX_PRODUCT_BATCH_STATEMENTS) {
    throw new Error('El batch del producto excede el límite de sentencias D1');
  }
  return statements;
}
