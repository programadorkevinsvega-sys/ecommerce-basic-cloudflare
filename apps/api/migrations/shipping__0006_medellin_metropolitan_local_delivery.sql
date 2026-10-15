-- Keep store-managed delivery limited to Medellín and the ten municipalities
-- of the Valle de Aburrá metropolitan area. National shipping remains MiPaquete.
UPDATE shipping_zones
SET is_active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN ('zone-bogota', 'zone-cali') AND type != 'national';

UPDATE shipping_zones
SET name = 'Medellín y Área Metropolitana del Valle de Aburrá',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'zone-medellin' AND type != 'national';

DELETE FROM shipping_zone_locations WHERE zone_id = 'zone-medellin';

INSERT OR IGNORE INTO shipping_zone_locations (id, zone_id, dane_code, created_at) VALUES
('loc-med-05001', 'zone-medellin', '05001', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05079', 'zone-medellin', '05079', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05088', 'zone-medellin', '05088', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05129', 'zone-medellin', '05129', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05212', 'zone-medellin', '05212', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05266', 'zone-medellin', '05266', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05308', 'zone-medellin', '05308', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05360', 'zone-medellin', '05360', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05380', 'zone-medellin', '05380', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
('loc-med-05631', 'zone-medellin', '05631', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
