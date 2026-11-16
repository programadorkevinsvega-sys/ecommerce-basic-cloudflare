ALTER TABLE orders_orders ADD COLUMN guest_tracking_token_expires_at TEXT;

UPDATE orders_orders
SET guest_tracking_token_expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at, '+90 days')
WHERE guest_tracking_token_hash IS NOT NULL
  AND guest_tracking_token_expires_at IS NULL;
