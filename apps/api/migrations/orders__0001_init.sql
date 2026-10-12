-- ============================================================================
-- Migración 0001: Módulo Orders
-- Tablas: orders_orders, orders_lines, orders_history, orders_outbox_events
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto orders_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders_orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT, -- UUID del cliente o 'guest'
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL, -- JSON con snapshot de dirección, municipio, departamento y código DANE
  shipping_zone_id TEXT NOT NULL,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  coupon_code TEXT,
  total_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- 'wompi' | 'cash_on_delivery'
  status TEXT NOT NULL DEFAULT 'placed', -- 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'failed' | 'collected'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders_orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders_orders (created_at);

CREATE TABLE IF NOT EXISTS orders_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_lines_ord ON orders_lines (order_id);

CREATE TABLE IF NOT EXISTS orders_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_history_ord ON orders_history (order_id);

CREATE TABLE IF NOT EXISTS orders_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_outbox_status ON orders_outbox_events (status);
