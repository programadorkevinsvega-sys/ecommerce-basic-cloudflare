CREATE TABLE IF NOT EXISTS shipping_carrier_shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'mipaquete',
  provider_shipment_id TEXT,
  mipaquete_code TEXT,
  carrier_name TEXT,
  guide_number TEXT,
  guide_url TEXT,
  pickup_code TEXT,
  provider_status TEXT,
  normalized_status TEXT NOT NULL DEFAULT 'creation_pending',
  shipping_cost_cents INTEGER,
  collection_value_cents INTEGER NOT NULL DEFAULT 0,
  create_request_hash TEXT NOT NULL,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_carrier_shipments_mp_code
  ON shipping_carrier_shipments (mipaquete_code) WHERE mipaquete_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipping_carrier_shipments_status
  ON shipping_carrier_shipments (normalized_status, updated_at);

CREATE TABLE IF NOT EXISTS shipping_carrier_shipment_events (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  provider_status TEXT NOT NULL,
  normalized_status TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipping_carrier_events_shipment
  ON shipping_carrier_shipment_events (shipment_id, occurred_at);

CREATE TABLE IF NOT EXISTS shipping_carrier_config (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  enabled INTEGER NOT NULL DEFAULT 0,
  origin_dane_code TEXT,
  package_width_cm INTEGER,
  package_length_cm INTEGER,
  package_height_cm INTEGER,
  package_weight_kg INTEGER,
  declared_value_mode TEXT,
  cash_on_delivery_payment_type INTEGER,
  request_pickup INTEGER,
  selection_criterion TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO shipping_carrier_config (id, updated_at)
VALUES ('default', CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS shipping_carrier_quotes (
  id TEXT PRIMARY KEY,
  provider_quote_id TEXT NOT NULL,
  delivery_company_id TEXT NOT NULL,
  delivery_company_name TEXT NOT NULL,
  shipping_cost_cents INTEGER NOT NULL,
  collection_commission_cents INTEGER NOT NULL DEFAULT 0,
  delivery_minutes INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  destination_dane_code TEXT NOT NULL,
  declared_value_cents INTEGER NOT NULL,
  sale_value_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  order_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipping_carrier_quotes_expiry
  ON shipping_carrier_quotes (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_shipping_carrier_quotes_order
  ON shipping_carrier_quotes (order_id);
