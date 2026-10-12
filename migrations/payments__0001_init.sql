-- ============================================================================
-- Migración 0001: Módulo Payments
-- Tablas: payments_transactions, payments_webhook_events,
--         payments_cod_collections, payments_outbox_events
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto payments_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_method TEXT NOT NULL, -- 'wompi' | 'cash_on_delivery'
  amount_in_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  reference TEXT NOT NULL UNIQUE,
  wompi_transaction_id TEXT,
  integrity_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'voided' | 'error'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments_transactions (reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments_transactions (status);

CREATE TABLE IF NOT EXISTS payments_webhook_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE, -- Idempotencia estricta por eventId de Wompi
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  processed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_webhook_event ON payments_webhook_events (event_id);

CREATE TABLE IF NOT EXISTS payments_cod_collections (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount_in_cents INTEGER NOT NULL,
  collected_by TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_cod_order ON payments_cod_collections (order_id);

CREATE TABLE IF NOT EXISTS payments_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_outbox_status ON payments_outbox_events (status);
