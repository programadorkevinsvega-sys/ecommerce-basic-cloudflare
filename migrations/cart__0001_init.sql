-- ============================================================================
-- Migración 0001: Módulo Cart
-- Tablas: cart_carts, cart_items, cart_outbox_events
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto cart_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_carts (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'converted' | 'abandoned'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_carts_cust ON cart_carts (customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_carts_status ON cart_carts (status);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id);

CREATE TABLE IF NOT EXISTS cart_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cart_outbox_status ON cart_outbox_events (status);
