-- Expansión aditiva del catálogo: proveedores y variantes como entidades propias.
-- No modifica productos ni datos existentes; solo usa tablas con prefijo catalog_.

CREATE TABLE IF NOT EXISTS catalog_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_suppliers_name
  ON catalog_suppliers(name);
CREATE INDEX IF NOT EXISTS idx_catalog_suppliers_status
  ON catalog_suppliers(status);

CREATE TABLE IF NOT EXISTS catalog_product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  options_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(options_json)),
  price_in_cents INTEGER CHECK (price_in_cents IS NULL OR price_in_cents >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_product_variants_product
  ON catalog_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_variants_status
  ON catalog_product_variants(status);
