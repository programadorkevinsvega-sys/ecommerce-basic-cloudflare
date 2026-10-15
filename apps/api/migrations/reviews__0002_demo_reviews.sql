-- Conserva la procedencia de reseñas históricas sin crear opiniones ficticias en una instalación nueva.
ALTER TABLE reviews_product_reviews ADD COLUMN source TEXT NOT NULL DEFAULT 'verified' CHECK (source IN ('verified', 'demo'));
