-- Corrections are append-only; the original settlement row is retained.
CREATE TABLE IF NOT EXISTS payments_settlement_corrections (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  actual_fee_cents INTEGER NOT NULL CHECK (actual_fee_cents >= 0),
  report_reference TEXT NOT NULL,
  reason TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_settlement_corrections_order_time
  ON payments_settlement_corrections(order_id, recorded_at DESC);
