-- Medidas y peso de la unidad comercial ya empacada, no del artículo desnudo.
ALTER TABLE catalog_products ADD COLUMN packed_width_cm INTEGER;
ALTER TABLE catalog_products ADD COLUMN packed_length_cm INTEGER;
ALTER TABLE catalog_products ADD COLUMN packed_height_cm INTEGER;
ALTER TABLE catalog_products ADD COLUMN packed_weight_grams INTEGER;
