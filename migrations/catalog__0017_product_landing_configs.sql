-- Configuración editorial opcional para las páginas de producto.
-- La FK referencia únicamente otra tabla del mismo módulo catalog.
CREATE TABLE IF NOT EXISTS catalog_product_landing_configs (
  product_id TEXT PRIMARY KEY NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  template_key TEXT NOT NULL DEFAULT 'standard'
    CHECK (template_key IN ('standard', 'conversion', 'launch')),
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES catalog_products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_catalog_product_landing_configs_updated_at
  ON catalog_product_landing_configs(updated_at);
