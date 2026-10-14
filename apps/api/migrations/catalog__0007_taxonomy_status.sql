-- Agrega estado administrativo a las entidades del catálogo sin modificar registros existentes.
ALTER TABLE catalog_categories ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive'));
ALTER TABLE catalog_brands ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive'));
ALTER TABLE catalog_attributes ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_catalog_categories_status ON catalog_categories(status);
CREATE INDEX IF NOT EXISTS idx_catalog_brands_status ON catalog_brands(status);
CREATE INDEX IF NOT EXISTS idx_catalog_attributes_status ON catalog_attributes(status);
