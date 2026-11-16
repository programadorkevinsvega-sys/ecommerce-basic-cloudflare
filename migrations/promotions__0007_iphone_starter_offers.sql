-- Inactive iPhone offer templates; no discount applies until an admin configures them.
INSERT OR IGNORE INTO promotions_rules (
  id,name,description,discount_type,discount_value,target_type,target_id,min_order_amount_cents,
  starts_at,ends_at,is_active,priority,created_at,updated_at
) VALUES (
  'promotion-iphone-template','Plantilla de descuento para iPhone',
  'Ejemplo inactivo: confirma el descuento y la vigencia antes de activarlo.',
  'percentage',5,'category','category-iphone',0,
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),'2035-12-31T23:59:59.000Z',0,10,
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')
);

INSERT OR IGNORE INTO promotions_coupons (
  id,code,description,discount_type,discount_value,target_type,target_id,min_order_amount_cents,
  max_uses_global,max_uses_per_customer,current_uses_count,starts_at,ends_at,is_active,created_at,updated_at
) VALUES (
  'coupon-iphone-template','IPHONE10',
  'Ejemplo inactivo para iPhone: confirma el descuento, límites y vigencia antes de activarlo.',
  'percentage',10,'category','category-iphone',0,
  100,1,0,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'2035-12-31T23:59:59.000Z',0,
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
