-- Inactive iPhone free-shipping template; shipping cost and eligibility need review.
INSERT OR IGNORE INTO shipping_free_shipping_rules (
  id,name,target_type,target_id,min_order_amount_cents,starts_at,ends_at,is_active,priority,created_at,updated_at
) VALUES (
  'free-shipping-iphone-template','Plantilla de envío gratis para iPhone','category','category-iphone',0,
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),'2035-12-31T23:59:59.000Z',0,10,
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
