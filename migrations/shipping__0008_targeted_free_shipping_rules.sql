CREATE TABLE IF NOT EXISTS shipping_free_shipping_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'product', 'category', 'collection')),
  target_id TEXT,
  min_order_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount_cents >= 0),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((target_type = 'all' AND target_id IS NULL) OR (target_type <> 'all' AND target_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_shipping_free_shipping_rules_active
  ON shipping_free_shipping_rules(is_active, starts_at, ends_at, priority);
