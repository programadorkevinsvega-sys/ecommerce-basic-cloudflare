-- Migración 0003: Módulo Catalog - Marcas y Atributos (Tallas, Dimensiones, Proveedores)
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto catalog_*)

CREATE TABLE IF NOT EXISTS catalog_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_brands_slug ON catalog_brands(slug);

CREATE TABLE IF NOT EXISTS catalog_attributes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- ej. 'Talla', 'Color', 'Dimensiones', 'Proveedor'
  code TEXT NOT NULL UNIQUE, -- ej. 'size', 'color', 'dimensions', 'supplier'
  type TEXT NOT NULL CHECK(type IN ('text', 'select', 'number')),
  options TEXT NOT NULL DEFAULT '[]', -- JSON array de opciones disponibles (ej. ["S", "M", "L", "XL"])
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_attributes_code ON catalog_attributes(code);
