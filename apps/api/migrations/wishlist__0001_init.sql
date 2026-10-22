-- Wishlist module: customer-owned saved products. All tables use the wishlist_ prefix.
CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_customer_created
  ON wishlist_items (customer_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS wishlist_outbox_events (
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

CREATE INDEX IF NOT EXISTS idx_wishlist_outbox_pending
  ON wishlist_outbox_events (status, created_at);