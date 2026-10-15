CREATE TABLE IF NOT EXISTS shipping_free_shipping_policy (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  threshold_cents INTEGER NOT NULL CHECK (threshold_cents >= 0),
  updated_at TEXT NOT NULL
);
