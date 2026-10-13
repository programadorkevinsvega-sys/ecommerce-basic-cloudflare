-- Migración 0001: Módulo Promotions (Reglas de descuento, Cupones y Canjes)
-- Prefijo estricto: promotions_*

CREATE TABLE IF NOT EXISTS promotions_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL, -- Porcentaje (ej: 20 para 20%) o centavos COP (ej: 1500000 para $15.000)
  target_type TEXT NOT NULL CHECK(target_type IN ('all', 'product', 'category')),
  target_id TEXT, -- ID del producto o categoría si aplica
  min_order_amount_cents INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotions_rules_active ON promotions_rules(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_rules_target ON promotions_rules(target_type, target_id);

CREATE TABLE IF NOT EXISTS promotions_coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  min_order_amount_cents INTEGER NOT NULL DEFAULT 0,
  max_uses_global INTEGER, -- NULL = ilimitado
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_coupons_code ON promotions_coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotions_coupons_active ON promotions_coupons(is_active);

CREATE TABLE IF NOT EXISTS promotions_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  order_id TEXT,
  customer_id TEXT NOT NULL,
  discount_applied_cents INTEGER NOT NULL,
  redeemed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotions_redemptions_coupon_customer ON promotions_redemptions(coupon_id, customer_id);

CREATE TABLE IF NOT EXISTS promotions_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  processed_at TEXT
);
