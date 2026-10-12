-- ============================================================================
-- Migración 0002: Módulo Realtime — expandir columnas
-- Añade: recipient_id, body (alias de message), data_json (alias de payload),
--        read (alias de is_read)
-- Compatible hacia atrás: columnas anteriores se mantienen intactas.
-- ============================================================================

ALTER TABLE realtime_notifications ADD COLUMN recipient_id TEXT;
ALTER TABLE realtime_notifications ADD COLUMN body TEXT;
ALTER TABLE realtime_notifications ADD COLUMN data_json TEXT;
ALTER TABLE realtime_notifications ADD COLUMN read INTEGER NOT NULL DEFAULT 0;

-- Índice para búsquedas por recipient_id
CREATE INDEX IF NOT EXISTS idx_realtime_recipient ON realtime_notifications (recipient_id);
