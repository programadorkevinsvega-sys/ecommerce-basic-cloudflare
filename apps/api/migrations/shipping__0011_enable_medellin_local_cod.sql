-- Habilita el recaudo contra entrega para la zona local del comercio.
-- Las zonas locales futuras conservan su configuración individual desde Admin.
UPDATE shipping_zones
SET allows_cash_on_delivery = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'zone-medellin'
  AND type != 'national'
  AND is_active = 1;
