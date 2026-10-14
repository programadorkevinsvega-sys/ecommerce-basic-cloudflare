-- Additive pricing metadata. Existing prices retain their historic pre-tax meaning.
ALTER TABLE catalog_products ADD COLUMN supplier_cost_cents INTEGER;
ALTER TABLE catalog_products ADD COLUMN target_margin_basis_points INTEGER NOT NULL DEFAULT 2000;
ALTER TABLE catalog_products ADD COLUMN allowed_payment_methods TEXT NOT NULL DEFAULT '["wompi","cash_on_delivery"]';
ALTER TABLE catalog_products ADD COLUMN pricing_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE catalog_products ADD COLUMN legacy_price_before_tax_cents INTEGER;
