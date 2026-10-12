-- ============================================================================
-- Migración 0002: Módulo Payments — expandir columnas
-- Añade columnas que usa D1PaymentRepository pero que no estaban en 0001.
-- Compatible hacia atrás (expand-only, sin DROP ni RENAME).
-- ============================================================================

-- payments_transactions: columnas usadas por el repo que faltan en D1
ALTER TABLE payments_transactions ADD COLUMN external_transaction_id TEXT;
ALTER TABLE payments_transactions ADD COLUMN signature TEXT;
ALTER TABLE payments_transactions ADD COLUMN metadata_json TEXT;
ALTER TABLE payments_transactions ADD COLUMN error_message TEXT;

-- payments_webhook_events: repo usa provider, payload_json, processed, received_at
-- D1 tenía solo: id, event_id, event_type, payload, processed_at
ALTER TABLE payments_webhook_events ADD COLUMN provider TEXT NOT NULL DEFAULT 'wompi';
ALTER TABLE payments_webhook_events ADD COLUMN payload_json TEXT;
ALTER TABLE payments_webhook_events ADD COLUMN processed INTEGER NOT NULL DEFAULT 1;
ALTER TABLE payments_webhook_events ADD COLUMN received_at TEXT;

-- payments_outbox_events: repo usa event_type y payload_json, D1 tenía event_name y payload
ALTER TABLE payments_outbox_events ADD COLUMN event_type TEXT;
ALTER TABLE payments_outbox_events ADD COLUMN payload_json TEXT;

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_payments_txn_reference ON payments_transactions (reference);
CREATE INDEX IF NOT EXISTS idx_payments_txn_order ON payments_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_webhook_event_id ON payments_webhook_events (event_id);
CREATE INDEX IF NOT EXISTS idx_payments_webhook_provider ON payments_webhook_events (provider);
