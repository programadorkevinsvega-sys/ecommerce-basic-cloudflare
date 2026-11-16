ALTER TABLE shipping_carrier_package_profiles
  ADD COLUMN single_unit_product_ids_json TEXT NOT NULL DEFAULT '[]';
