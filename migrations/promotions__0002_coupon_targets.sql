-- Migración 0002: Agregar soporte de target_type y target_id a cupones
-- Prefijo estricto: promotions_*

ALTER TABLE promotions_coupons ADD COLUMN target_type TEXT NOT NULL DEFAULT 'all';
ALTER TABLE promotions_coupons ADD COLUMN target_id TEXT;

CREATE INDEX IF NOT EXISTS idx_promotions_coupons_target ON promotions_coupons(target_type, target_id);
