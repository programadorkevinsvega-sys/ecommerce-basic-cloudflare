-- Optional logistics details managed by the store; keeps existing order data intact.
ALTER TABLE orders_orders ADD COLUMN shipping_carrier TEXT;
ALTER TABLE orders_orders ADD COLUMN shipping_tracking_number TEXT;
ALTER TABLE orders_orders ADD COLUMN shipping_tracking_url TEXT;
ALTER TABLE orders_orders ADD COLUMN estimated_delivery_date TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_shipping_tracking
  ON orders_orders (status, updated_at);
