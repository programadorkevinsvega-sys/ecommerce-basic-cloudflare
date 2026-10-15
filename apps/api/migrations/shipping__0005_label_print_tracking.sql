ALTER TABLE shipping_carrier_shipments ADD COLUMN printed_at TEXT;
ALTER TABLE shipping_carrier_shipments ADD COLUMN printed_by TEXT;
CREATE INDEX IF NOT EXISTS idx_shipping_carrier_unprinted
  ON shipping_carrier_shipments (created_at) WHERE guide_url IS NOT NULL AND printed_at IS NULL;
