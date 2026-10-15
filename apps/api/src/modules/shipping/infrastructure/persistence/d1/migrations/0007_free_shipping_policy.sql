CREATE TABLE IF NOT EXISTS shipping_free_shipping_policy (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  threshold_cents INTEGER NOT NULL CHECK (threshold_cents >= 0),
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO shipping_free_shipping_policy (id, enabled, threshold_cents, updated_at)
VALUES ('default', 1, 15000000, '2026-10-15T00:00:00.000Z');
