-- Tres reglas iniciales de envío gratis para administrar; ninguna se activa automáticamente.
INSERT OR IGNORE INTO shipping_free_shipping_rules (
 id,name,target_type,target_id,min_order_amount_cents,starts_at,ends_at,is_active,priority,created_at,updated_at
) VALUES
('free-shipping-all-150k','Envío gratis desde $150.000 en el catálogo','all',NULL,15000000,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,30,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('free-shipping-eyewear','Envío gratis en gafas desde $100.000','category','category-eyewear',10000000,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,20,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('free-shipping-collection','Envío gratis en esenciales urbanos','collection','collection-everyday',0,'2026-10-15T00:00:00.000Z','2030-12-31T23:59:59.000Z',0,10,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');
