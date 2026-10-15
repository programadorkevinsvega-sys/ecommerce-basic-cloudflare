CREATE TABLE IF NOT EXISTS reviews_product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (product_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_status_date
  ON reviews_product_reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status_date
  ON reviews_product_reviews(status, created_at DESC);
