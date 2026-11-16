CREATE TABLE IF NOT EXISTS promotions_coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  order_id TEXT,
  customer_id TEXT,
  discount_applied_cents INTEGER NOT NULL,
  redeemed_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_coupon_redemptions_order
  ON promotions_coupon_redemptions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_coupon_redemptions_customer
  ON promotions_coupon_redemptions(coupon_id, customer_id);

INSERT OR IGNORE INTO promotions_coupon_redemptions
  (id, coupon_id, order_id, customer_id, discount_applied_cents, redeemed_at)
SELECT id, coupon_id, order_id, customer_id, discount_applied_cents, redeemed_at
FROM promotions_redemptions;
