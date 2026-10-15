-- Initial packaging is an operational estimate and must be calibrated with
-- actual packaging before relying on final carrier charges.
INSERT OR IGNORE INTO shipping_carrier_package_profiles
  (id, name, inner_width_cm, inner_length_cm, inner_height_cm, outer_width_cm, outer_length_cm,
   outer_height_cm, tare_weight_grams, max_weight_grams, is_active, created_at, updated_at)
VALUES
  ('pkg-mailer-m', 'Bolsa e-commerce mediana (estimada)', 36, 30, 15, 38, 32, 16, 100, 2000, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-box-m', 'Caja mediana (estimada)', 45, 35, 25, 47, 37, 27, 350, 7000, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg-box-l', 'Caja grande (estimada)', 58, 45, 35, 60, 47, 37, 650, 15000, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE shipping_carrier_config SET enabled=1, origin_dane_code='05001000',
  declared_value_mode='sale_value', cash_on_delivery_payment_type=102,
  request_pickup=0, selection_criterion='price', updated_at=CURRENT_TIMESTAMP
WHERE id='default';
