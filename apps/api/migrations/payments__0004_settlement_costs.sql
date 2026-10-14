-- Actual acquiring fees recorded from a merchant settlement report.
CREATE TABLE IF NOT EXISTS payments_settlement_costs (
  order_id TEXT PRIMARY KEY,
  actual_fee_cents INTEGER NOT NULL CHECK (actual_fee_cents >= 0),
  estimated_fee_cents INTEGER NOT NULL DEFAULT 0,
  report_reference TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);
