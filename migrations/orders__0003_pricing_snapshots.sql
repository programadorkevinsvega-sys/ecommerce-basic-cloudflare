-- Immutable fiscal and fee estimate snapshot for new orders.
ALTER TABLE orders_orders ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders_orders ADD COLUMN pricing_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders_orders ADD COLUMN estimated_payment_fee_cents INTEGER NOT NULL DEFAULT 0;
