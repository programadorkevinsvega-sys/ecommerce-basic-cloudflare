-- ============================================================================
-- Migración 0001: Módulo Realtime
-- Tablas: realtime_notifications
-- Conforme a SEC-MOD-02 y README 5.1 (prefijo estricto realtime_*)
-- ============================================================================

CREATE TABLE IF NOT EXISTS realtime_notifications (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL, -- 'admin:payments' | 'customer:<id>'
  event_type TEXT NOT NULL, -- 'payment.confirmed' | 'payment.failed' | 'cod.collected'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON con detalles de pago, pedido, cliente, entrega
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_realtime_channel ON realtime_notifications (channel);
CREATE INDEX IF NOT EXISTS idx_realtime_created ON realtime_notifications (created_at);
