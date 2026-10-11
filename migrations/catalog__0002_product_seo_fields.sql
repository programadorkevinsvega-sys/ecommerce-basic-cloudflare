-- ============================================================================
-- Migración 0002: Módulo Catalog - Ampliación de campos de producto y SEO
-- Campos: condition, specifications, brand, product_type, tags, barcode_gtin,
--         seo_title, seo_description, canonical_url, og_image_id, noindex
-- Conforme a ROLLBACK_RECOVERY.md (aditivo hacia atrás / backward-compatible)
-- ============================================================================

ALTER TABLE catalog_products ADD COLUMN condition TEXT NOT NULL DEFAULT 'new';
ALTER TABLE catalog_products ADD COLUMN specifications TEXT NOT NULL DEFAULT '{}';
ALTER TABLE catalog_products ADD COLUMN brand TEXT;
ALTER TABLE catalog_products ADD COLUMN product_type TEXT;
ALTER TABLE catalog_products ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE catalog_products ADD COLUMN barcode_gtin TEXT;
ALTER TABLE catalog_products ADD COLUMN seo_title TEXT;
ALTER TABLE catalog_products ADD COLUMN seo_description TEXT;
ALTER TABLE catalog_products ADD COLUMN canonical_url TEXT;
ALTER TABLE catalog_products ADD COLUMN og_image_id TEXT;
ALTER TABLE catalog_products ADD COLUMN noindex INTEGER NOT NULL DEFAULT 0;

ALTER TABLE catalog_product_images ADD COLUMN alt_text TEXT NOT NULL DEFAULT '';
