-- ============================================================================
-- Migración 0001: Módulo Media
-- Tablas: media_assets, media_folders, media_outbox_events
-- Conforme a SEC-MOD-02 y SEC-R2-01..08 (prefijo estricto media_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  original_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT NOT NULL,
  folder_id TEXT,
  is_private INTEGER NOT NULL DEFAULT 0,
  uploaded_by_admin_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets (folder_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_storage_key ON media_assets (storage_key);

CREATE TABLE IF NOT EXISTS media_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  relayed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_outbox_status ON media_outbox_events (status);
