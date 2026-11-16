-- Remove inactive, unchanged examples instead of seeding fictional iPhone offers.
DELETE FROM shipping_free_shipping_rules
WHERE is_active = 0
  AND ((id = 'free-shipping-all-150k' AND name = 'Envío gratis desde $150.000 en el catálogo'
        AND target_type = 'all' AND target_id IS NULL AND min_order_amount_cents = 15000000)
    OR (id = 'free-shipping-eyewear' AND name = 'Envío gratis en gafas desde $100.000'
        AND target_type = 'category' AND target_id = 'category-eyewear'
        AND min_order_amount_cents = 10000000)
    OR (id = 'free-shipping-collection' AND name = 'Envío gratis en esenciales urbanos'
        AND target_type = 'collection' AND target_id = 'collection-everyday'
        AND min_order_amount_cents = 0));
