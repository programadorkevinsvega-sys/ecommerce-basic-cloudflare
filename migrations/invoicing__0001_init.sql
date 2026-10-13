-- Migración 0001: Módulo Invoicing (Fase 9)
-- Facturación interna inmutable, consecutiva y preparada para DIAN

CREATE TABLE IF NOT EXISTS invoicing_sequences (
  id TEXT PRIMARY KEY,
  prefix TEXT NOT NULL UNIQUE,
  current_number INTEGER NOT NULL DEFAULT 0,
  resolution_number TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO invoicing_sequences (id, prefix, current_number, resolution_number, updated_at)
VALUES ('seq-default', 'FAC', 0, 'RES-INT-2026-001', datetime('now'));

CREATE TABLE IF NOT EXISTS invoicing_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_tax_id TEXT,
  customer_phone TEXT,
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL,
  shipping_cost_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'issued',
  pdf_r2_key TEXT,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoicing_order ON invoicing_invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_invoicing_customer ON invoicing_invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoicing_created_at ON invoicing_invoices (created_at);

CREATE TABLE IF NOT EXISTS invoicing_credit_notes (
  id TEXT PRIMARY KEY,
  credit_note_number TEXT UNIQUE NOT NULL,
  invoice_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount_in_cents INTEGER NOT NULL,
  issued_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON invoicing_credit_notes (invoice_id);

CREATE TABLE IF NOT EXISTS invoicing_outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
