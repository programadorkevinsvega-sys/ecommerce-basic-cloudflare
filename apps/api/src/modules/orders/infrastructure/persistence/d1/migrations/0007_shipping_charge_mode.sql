ALTER TABLE orders_orders ADD COLUMN shipping_collection_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders_orders ADD COLUMN shipping_charge_mode TEXT NOT NULL DEFAULT 'included';
