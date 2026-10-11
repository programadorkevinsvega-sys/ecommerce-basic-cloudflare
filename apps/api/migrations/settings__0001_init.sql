-- Migración inicial para el módulo settings
-- Prefijo obligatorio: settings_*

CREATE TABLE IF NOT EXISTS settings_store (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  tax_rate_percent REAL NOT NULL DEFAULT 19.0,
  support_email TEXT NOT NULL,
  support_phone TEXT,
  require_cod_verification INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings_outbox_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL,
  payload TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_settings_outbox_status_attempts
  ON settings_outbox_events(status, attempts);
