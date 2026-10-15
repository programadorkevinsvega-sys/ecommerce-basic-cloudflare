UPDATE promotions_coupons
SET description = 'Descuento de $10.000 COP en tu primera compra.'
WHERE code = 'BIENVENIDO10'
  AND description = 'Bono de 0.000 COP en tu primera compra';
