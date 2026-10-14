-- Pricing target metadata with existing products in percentage mode.
ALTER TABLE catalog_products ADD COLUMN pricing_target_type TEXT NOT NULL DEFAULT 'margin'
  CHECK (pricing_target_type IN ('margin', 'profit'));
ALTER TABLE catalog_products ADD COLUMN target_profit_cents INTEGER
  CHECK (target_profit_cents IS NULL OR target_profit_cents >= 0);
