CREATE TABLE IF NOT EXISTS shipping_carrier_package_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inner_width_cm INTEGER NOT NULL,
  inner_length_cm INTEGER NOT NULL,
  inner_height_cm INTEGER NOT NULL,
  outer_width_cm INTEGER NOT NULL,
  outer_length_cm INTEGER NOT NULL,
  outer_height_cm INTEGER NOT NULL,
  tare_weight_grams INTEGER NOT NULL,
  max_weight_grams INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shipping_package_profiles_active
  ON shipping_carrier_package_profiles (is_active, inner_width_cm, inner_length_cm, inner_height_cm);

ALTER TABLE shipping_carrier_quotes ADD COLUMN package_profile_id TEXT;
ALTER TABLE shipping_carrier_quotes ADD COLUMN package_width_cm INTEGER;
ALTER TABLE shipping_carrier_quotes ADD COLUMN package_length_cm INTEGER;
ALTER TABLE shipping_carrier_quotes ADD COLUMN package_height_cm INTEGER;
ALTER TABLE shipping_carrier_quotes ADD COLUMN package_weight_grams INTEGER;
ALTER TABLE shipping_carrier_quotes ADD COLUMN package_weight_kg INTEGER;
ALTER TABLE shipping_carrier_quotes ADD COLUMN package_fingerprint TEXT;
