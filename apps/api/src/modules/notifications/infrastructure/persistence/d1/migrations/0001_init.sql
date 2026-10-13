-- Migración 0001: Módulo Notifications (Fase 9)
-- Registro de envíos de email con idempotencia y trazabilidad

CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications_log (recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON notifications_log (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications_log (created_at);

CREATE TABLE IF NOT EXISTS notifications_outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
