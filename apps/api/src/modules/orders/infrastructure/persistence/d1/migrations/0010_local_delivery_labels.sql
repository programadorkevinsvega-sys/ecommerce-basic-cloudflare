CREATE TABLE IF NOT EXISTS orders_local_delivery_labels (
  order_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  printed_at TEXT,
  printed_by TEXT
);
CREATE INDEX IF NOT EXISTS orders_local_delivery_labels_print_queue_idx
  ON orders_local_delivery_labels (printed_at, created_at DESC);
INSERT OR IGNORE INTO orders_local_delivery_labels (order_id, created_at)
SELECT id, created_at FROM orders_orders WHERE shipping_fulfillment_method = 'merchant_local' AND status <> 'cancelled';
