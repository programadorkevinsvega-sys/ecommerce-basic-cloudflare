-- Record each order/product stock consumption for atomic idempotent settlement.
CREATE TABLE IF NOT EXISTS inventory_order_consumptions (
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_consumptions_status
  ON inventory_order_consumptions (status, created_at);
