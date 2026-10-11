-- Migración 0001: Módulo CMS (Páginas con bloques, versionado y menús)
-- Prefijo estricto: cms_*

CREATE TABLE IF NOT EXISTS cms_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'archived')),
  current_version INTEGER NOT NULL DEFAULT 1,
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_pages(status);

CREATE TABLE IF NOT EXISTS cms_page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  blocks TEXT NOT NULL, -- JSON array de bloques
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page_id ON cms_page_versions(page_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_page_versions_unique ON cms_page_versions(page_id, version_number);

CREATE TABLE IF NOT EXISTS cms_menus (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- 'header', 'footer', 'sidebar'
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_menu_items (
  id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL,
  parent_id TEXT, -- Para jerarquía y menús anidados
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  target TEXT DEFAULT '_self',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_menu_items_menu_id ON cms_menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_cms_menu_items_parent_id ON cms_menu_items(parent_id);

CREATE TABLE IF NOT EXISTS cms_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  processed_at TEXT
);
