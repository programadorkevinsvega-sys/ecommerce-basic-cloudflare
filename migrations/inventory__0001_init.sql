-- ============================================================================
-- Migración 0001: Módulo Inventory
-- Tablas: inventory_stocks, inventory_movements, inventory_reservations,
--         inventory_outbox_events
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto inventory_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_stocks (
  product_id TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'adjustment' | 'restock' | 'sale' | 'reservation' | 'release'
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod ON inventory_movements (product_id);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'released'
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_ord ON inventory_reservations (order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_exp ON inventory_reservations (status, expires_at);

CREATE TABLE IF NOT EXISTS inventory_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_inventory_outbox_status ON inventory_outbox_events (status);

-- Seed stock inicial para producto de demostración
INSERT OR IGNORE INTO inventory_stocks (product_id, quantity, reserved_quantity, updated_at) VALUES
('35326c88-2865-4d72-b2a9-3f4277e947fa', 50, 0, '2026-10-11T00:00:00Z');
