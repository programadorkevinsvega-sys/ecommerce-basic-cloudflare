-- Reglas y cupones iniciales completos, inactivos hasta que la tienda los configure.
INSERT OR IGNORE INTO promotions_rules (
 id,name,description,discount_type,discount_value,target_type,target_id,min_order_amount_cents,
 starts_at,ends_at,is_active,priority,created_at,updated_at
) VALUES
('promotion-launch-category','Lanzamiento de gafas','Descuento inicial para la categoría de gafas de sol.','percentage',10,'category','category-eyewear',0,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,30,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('promotion-essentials-all','Ahorro en esenciales','Descuento general sujeto a activación desde el panel.','fixed_amount',500000,'all',NULL,5000000,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,20,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('promotion-backpack-product','Beneficio en mochila urbana','Precio promocional configurado para la mochila urbana.','percentage',5,'product','product-seed-backpack',0,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,10,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');

INSERT OR IGNORE INTO promotions_coupons (
 id,code,description,discount_type,discount_value,target_type,target_id,min_order_amount_cents,
 max_uses_global,max_uses_per_customer,current_uses_count,starts_at,ends_at,is_active,created_at,updated_at
) VALUES
('coupon-first-order','VEGA5000','Descuento de $5.000 COP en compras elegibles.','fixed_amount',500000,'all',NULL,5000000,300,1,0,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('coupon-eyewear','GAFAS10','10% de descuento en productos de la categoría de gafas.','percentage',10,'category','category-eyewear',0,150,1,0,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('coupon-backpack','MOCHILA7','7% de descuento en la mochila urbana seleccionada.','percentage',7,'product','product-seed-backpack',0,100,1,0,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');
