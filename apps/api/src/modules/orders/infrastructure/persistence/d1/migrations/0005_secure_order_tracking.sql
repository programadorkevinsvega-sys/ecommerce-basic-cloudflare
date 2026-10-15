-- Add capability hashes and frozen delivery estimates for public order tracking.
ALTER TABLE orders_orders ADD COLUMN guest_tracking_token_hash TEXT;
ALTER TABLE orders_orders ADD COLUMN min_estimated_days INTEGER;
ALTER TABLE orders_orders ADD COLUMN max_estimated_days INTEGER;
CREATE INDEX IF NOT EXISTS idx_orders_tracking_capability
  ON orders_orders (id, guest_tracking_token_hash);
