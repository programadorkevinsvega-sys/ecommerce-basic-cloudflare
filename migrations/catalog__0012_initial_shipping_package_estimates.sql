-- Conservative initial estimates for the current catalogue. Replace these
-- values with measured packed dimensions when physical parcels are available.
UPDATE catalog_products SET packed_width_cm=43, packed_length_cm=32, packed_height_cm=20, packed_weight_grams=1800
WHERE sku='BAG-URBAN-006' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=30, packed_length_cm=25, packed_height_cm=17, packed_weight_grams=400
WHERE sku='CAP-TRUCK-003' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=36, packed_length_cm=30, packed_height_cm=12, packed_weight_grams=1100
WHERE sku='HOODIE-ESS-002' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=35, packed_length_cm=30, packed_height_cm=10, packed_weight_grams=900
WHERE sku='JACK-WIND-005' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=34, packed_length_cm=27, packed_height_cm=7, packed_weight_grams=800
WHERE sku='PANT-CARGO-004' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=22, packed_length_cm=16, packed_height_cm=6, packed_weight_grams=220
WHERE sku='SOCK-TECH-007' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=21, packed_length_cm=12, packed_height_cm=8, packed_weight_grams=400
WHERE sku='SUN-AVIA-008' AND packed_width_cm IS NULL;
UPDATE catalog_products SET packed_width_cm=30, packed_length_cm=25, packed_height_cm=6, packed_weight_grams=450
WHERE sku='TSHIRT-VEGA-001' AND packed_width_cm IS NULL;
