-- ============================================================================
-- Migración 0001: Módulo Shipping
-- Tablas: shipping_divipola, shipping_zones, shipping_zone_locations,
--         shipping_outbox_events
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto shipping_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipping_divipola (
  dane_code TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  municipality TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'municipio'
);

CREATE INDEX IF NOT EXISTS idx_shipping_divipola_dept ON shipping_divipola (department);
CREATE INDEX IF NOT EXISTS idx_shipping_divipola_muni ON shipping_divipola (municipality);

CREATE TABLE IF NOT EXISTS shipping_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'city', -- 'national' | 'department' | 'city' | 'municipality'
  price_in_cents INTEGER NOT NULL DEFAULT 0,
  min_estimated_days INTEGER NOT NULL DEFAULT 1,
  max_estimated_days INTEGER NOT NULL DEFAULT 3,
  allows_cash_on_delivery INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_type ON shipping_zones (type);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON shipping_zones (is_active);

CREATE TABLE IF NOT EXISTS shipping_zone_locations (
  id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL,
  dane_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (zone_id, dane_code)
);

CREATE INDEX IF NOT EXISTS idx_shipping_zone_loc_zone ON shipping_zone_locations (zone_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zone_loc_dane ON shipping_zone_locations (dane_code);

CREATE TABLE IF NOT EXISTS shipping_outbox_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_shipping_outbox_status ON shipping_outbox_events (status);

-- Seed DIVIPOLA: Principales ciudades y municipios de Colombia (DANE)
INSERT OR IGNORE INTO shipping_divipola (dane_code, department, municipality, type) VALUES
('11001', 'Bogotá D.C.', 'Bogotá, D.C.', 'capital'),
('05001', 'Antioquia', 'Medellín', 'capital'),
('05088', 'Antioquia', 'Bello', 'municipio'),
('05360', 'Antioquia', 'Itagüí', 'municipio'),
('05266', 'Antioquia', 'Envigado', 'municipio'),
('05631', 'Antioquia', 'Sabaneta', 'municipio'),
('05615', 'Antioquia', 'Rionegro', 'municipio'),
('76001', 'Valle del Cauca', 'Cali', 'capital'),
('76364', 'Valle del Cauca', 'Jamundí', 'municipio'),
('76520', 'Valle del Cauca', 'Palmira', 'municipio'),
('76892', 'Valle del Cauca', 'Yumbo', 'municipio'),
('08001', 'Atlántico', 'Barranquilla', 'capital'),
('08758', 'Atlántico', 'Soledad', 'municipio'),
('08573', 'Atlántico', 'Puerto Colombia', 'municipio'),
('13001', 'Bolívar', 'Cartagena de Indias', 'capital'),
('68001', 'Santander', 'Bucaramanga', 'capital'),
('68276', 'Santander', 'Floridablanca', 'municipio'),
('68307', 'Santander', 'Girón', 'municipio'),
('68547', 'Santander', 'Piedecuesta', 'municipio'),
('54001', 'Norte de Santander', 'Cúcuta', 'capital'),
('66001', 'Risaralda', 'Pereira', 'capital'),
('66170', 'Risaralda', 'Dosquebradas', 'municipio'),
('17001', 'Caldas', 'Manizales', 'capital'),
('63001', 'Quindío', 'Armenia', 'capital'),
('73001', 'Tolima', 'Ibagué', 'capital'),
('47001', 'Magdalena', 'Santa Marta', 'capital'),
('52001', 'Nariño', 'Pasto', 'capital'),
('41001', 'Huila', 'Neiva', 'capital'),
('50001', 'Meta', 'Villavicencio', 'capital'),
('20001', 'Cesar', 'Valledupar', 'capital'),
('23001', 'Córdoba', 'Montería', 'capital'),
('70001', 'Sucre', 'Sincelejo', 'capital'),
('19001', 'Cauca', 'Popayán', 'capital'),
('15001', 'Boyacá', 'Tunja', 'capital'),
('15238', 'Boyacá', 'Duitama', 'municipio'),
('15759', 'Boyacá', 'Sogamoso', 'municipio'),
('44001', 'La Guajira', 'Riohacha', 'capital'),
('18001', 'Caquetá', 'Florencia', 'capital'),
('85001', 'Casanare', 'Yopal', 'capital'),
('27001', 'Chocó', 'Quibdó', 'capital'),
('25754', 'Cundinamarca', 'Soacha', 'municipio'),
('25175', 'Cundinamarca', 'Chía', 'municipio'),
('25126', 'Cundinamarca', 'Cajicá', 'municipio'),
('25899', 'Cundinamarca', 'Zipaquirá', 'municipio'),
('25269', 'Cundinamarca', 'Facatativá', 'municipio'),
('25473', 'Cundinamarca', 'Mosquera', 'municipio'),
('25430', 'Cundinamarca', 'Madrid', 'municipio'),
('25286', 'Cundinamarca', 'Funza', 'municipio');

-- Seed Zonas de Envío Iniciales
INSERT OR IGNORE INTO shipping_zones (id, name, type, price_in_cents, min_estimated_days, max_estimated_days, allows_cash_on_delivery, is_active, created_at, updated_at) VALUES
('zone-nacional', 'Cobertura Nacional', 'national', 1500000, 2, 5, 1, 1, '2026-10-11T00:00:00Z', '2026-10-11T00:00:00Z'),
('zone-bogota', 'Bogotá D.C. & Sabana', 'city', 800000, 1, 2, 1, 1, '2026-10-11T00:00:00Z', '2026-10-11T00:00:00Z'),
('zone-medellin', 'Medellín & Área Metropolitana', 'city', 900000, 1, 2, 1, 1, '2026-10-11T00:00:00Z', '2026-10-11T00:00:00Z'),
('zone-cali', 'Cali & Alrededores', 'city', 900000, 1, 2, 1, 1, '2026-10-11T00:00:00Z', '2026-10-11T00:00:00Z');

-- Asignación de municipios a zonas metropolitanas
INSERT OR IGNORE INTO shipping_zone_locations (id, zone_id, dane_code, created_at) VALUES
('loc-bog-1', 'zone-bogota', '11001', '2026-10-11T00:00:00Z'),
('loc-bog-2', 'zone-bogota', '25754', '2026-10-11T00:00:00Z'),
('loc-bog-3', 'zone-bogota', '25175', '2026-10-11T00:00:00Z'),
('loc-bog-4', 'zone-bogota', '25126', '2026-10-11T00:00:00Z'),
('loc-bog-5', 'zone-bogota', '25473', '2026-10-11T00:00:00Z'),
('loc-bog-6', 'zone-bogota', '25286', '2026-10-11T00:00:00Z'),
('loc-med-1', 'zone-medellin', '05001', '2026-10-11T00:00:00Z'),
('loc-med-2', 'zone-medellin', '05088', '2026-10-11T00:00:00Z'),
('loc-med-3', 'zone-medellin', '05360', '2026-10-11T00:00:00Z'),
('loc-med-4', 'zone-medellin', '05266', '2026-10-11T00:00:00Z'),
('loc-med-5', 'zone-medellin', '05631', '2026-10-11T00:00:00Z'),
('loc-cali-1', 'zone-cali', '76001', '2026-10-11T00:00:00Z'),
('loc-cali-2', 'zone-cali', '76364', '2026-10-11T00:00:00Z'),
('loc-cali-3', 'zone-cali', '76892', '2026-10-11T00:00:00Z');
