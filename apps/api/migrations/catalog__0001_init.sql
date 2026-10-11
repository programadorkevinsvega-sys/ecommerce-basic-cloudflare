-- ============================================================================
-- Migración 0001: Módulo Catalog
-- Tablas: catalog_products, catalog_categories, catalog_product_categories,
--         catalog_product_images, catalog_product_coverage, catalog_products_fts,
--         catalog_outbox_events
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto catalog_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS catalog_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_slug ON catalog_categories (slug);

CREATE TABLE IF NOT EXISTS catalog_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  allows_cash_on_delivery INTEGER NOT NULL DEFAULT 1,
  shipping_scope TEXT NOT NULL DEFAULT 'national',
  sale_mode TEXT NOT NULL DEFAULT 'cash',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_products_slug ON catalog_products (slug);
CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog_products (status);

CREATE TABLE IF NOT EXISTS catalog_product_categories (
  product_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS catalog_product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_product_images_pid ON catalog_product_images (product_id);

CREATE TABLE IF NOT EXISTS catalog_product_coverage (
  product_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  PRIMARY KEY (product_id, zone_id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS catalog_products_fts USING fts5(
  product_id UNINDEXED,
  name,
  description,
  sku
);

CREATE TABLE IF NOT EXISTS catalog_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  relayed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_catalog_outbox_status ON catalog_outbox_events (status);
