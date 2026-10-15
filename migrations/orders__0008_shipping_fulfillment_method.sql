-- Shipping fulfillment is snapshotted by orders; historical rows stay explicitly legacy.
ALTER TABLE orders_orders ADD COLUMN shipping_fulfillment_method TEXT NOT NULL DEFAULT 'legacy'
  CHECK (shipping_fulfillment_method IN ('merchant_local', 'carrier', 'legacy'));
