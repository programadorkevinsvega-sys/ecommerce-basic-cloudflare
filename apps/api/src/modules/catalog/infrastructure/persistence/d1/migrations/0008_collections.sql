-- Entidad de colecciones independiente sin alterar productos ni contenido existente.
CREATE TABLE IF NOT EXISTS catalog_collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_collections_status_name ON catalog_collections(status,name);
CREATE TABLE IF NOT EXISTS catalog_collection_products (
  collection_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY(collection_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_catalog_collection_products_product ON catalog_collection_products(product_id);
