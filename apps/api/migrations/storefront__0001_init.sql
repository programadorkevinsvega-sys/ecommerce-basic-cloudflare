-- ============================================================================
-- Migración 0001: Módulo Storefront
-- Tablas: storefront_banners, storefront_announcements, storefront_outbox_events
-- Conforme a SEC-MOD-02 y README (prefijo estricto storefront_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS storefront_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'home',
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storefront_banners_placement ON storefront_banners (placement);
CREATE INDEX IF NOT EXISTS idx_storefront_banners_active ON storefront_banners (is_active);

CREATE TABLE IF NOT EXISTS storefront_announcements (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'top_bar',
  link_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storefront_announcements_placement ON storefront_announcements (placement);
CREATE INDEX IF NOT EXISTS idx_storefront_announcements_active ON storefront_announcements (is_active);

CREATE TABLE IF NOT EXISTS storefront_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  relayed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_storefront_outbox_status ON storefront_outbox_events (status);
