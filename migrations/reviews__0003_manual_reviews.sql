-- Identifica reseñas creadas desde administración sin cambiar el estado de reseñas existentes.
-- source conserva el valor 'demo' para que el Worker anterior no las confunda con compras verificadas.
ALTER TABLE reviews_product_reviews
  ADD COLUMN origin TEXT NOT NULL DEFAULT 'customer'
  CHECK (origin IN ('customer', 'admin'));
