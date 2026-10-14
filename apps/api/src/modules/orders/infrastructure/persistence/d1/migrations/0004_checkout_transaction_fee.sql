-- Snapshot the fixed online transaction fee separately, historical orders default to zero.
ALTER TABLE orders_orders ADD COLUMN transaction_fee_cents INTEGER NOT NULL DEFAULT 0;
