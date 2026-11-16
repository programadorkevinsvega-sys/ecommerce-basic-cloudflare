-- Remove only inactive, unused examples; retain activated or redeemed coupons.
DELETE FROM promotions_rules
WHERE is_active = 0
  AND ((id = 'promotion-launch-category' AND name = 'Lanzamiento de gafas'
        AND description = 'Descuento inicial para la categoría de gafas de sol.'
        AND discount_type = 'percentage' AND discount_value = 10
        AND target_type = 'category' AND target_id = 'category-eyewear'
        AND min_order_amount_cents = 0)
    OR (id = 'promotion-essentials-all' AND name = 'Ahorro en esenciales'
        AND description = 'Descuento general sujeto a activación desde el panel.'
        AND discount_type = 'fixed_amount' AND discount_value = 500000
        AND target_type = 'all' AND target_id IS NULL
        AND min_order_amount_cents = 5000000)
    OR (id = 'promotion-backpack-product' AND name = 'Beneficio en mochila urbana'
        AND description = 'Precio promocional configurado para la mochila urbana.'
        AND discount_type = 'percentage' AND discount_value = 5
        AND target_type = 'product' AND target_id = 'product-seed-backpack'
        AND min_order_amount_cents = 0));

DELETE FROM promotions_coupons
WHERE is_active = 0 AND current_uses_count = 0
  AND ((id = 'coupon-first-order' AND code = 'VEGA5000'
        AND description = 'Descuento de $5.000 COP en compras elegibles.'
        AND discount_type = 'fixed_amount' AND discount_value = 500000)
    OR (id = 'coupon-eyewear' AND code = 'GAFAS10'
        AND description = '10% de descuento en productos de la categoría de gafas.'
        AND discount_type = 'percentage' AND discount_value = 10
        AND target_type = 'category' AND target_id = 'category-eyewear')
    OR (id = 'coupon-backpack' AND code = 'MOCHILA7'
        AND description = '7% de descuento en la mochila urbana seleccionada.'
        AND discount_type = 'percentage' AND discount_value = 7
        AND target_type = 'product' AND target_id = 'product-seed-backpack'))
  AND NOT EXISTS (
    SELECT 1 FROM promotions_redemptions r
    WHERE r.coupon_id = promotions_coupons.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM promotions_coupon_redemptions r
    WHERE r.coupon_id = promotions_coupons.id
  );
