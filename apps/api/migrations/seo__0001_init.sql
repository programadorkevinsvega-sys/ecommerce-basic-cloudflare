-- ============================================================================
-- Migración 0001: Módulo SEO
-- Tablas: seo_redirects, seo_metadata, seo_outbox_events
-- Conforme a SEC-MOD-02 y SEC-CMS-04/06 (prefijo estricto seo_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_redirects (
  id TEXT PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_from ON seo_redirects (from_path);

CREATE TABLE IF NOT EXISTS seo_metadata (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  noindex INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_entity ON seo_metadata (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS seo_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  relayed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_seo_outbox_status ON seo_outbox_events (status);
