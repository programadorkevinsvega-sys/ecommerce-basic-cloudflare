-- Versioned outbox leasing and durable consumer receipts for invoicing events.
ALTER TABLE invoicing_outbox_events ADD COLUMN lease_expires_at TEXT;
ALTER TABLE invoicing_outbox_events ADD COLUMN lease_token TEXT;

CREATE TABLE IF NOT EXISTS invoicing_queue_event_receipts (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'pending', 'processed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  lease_expires_at TEXT,
  lease_token TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoicing_queue_receipts_status_lease
  ON invoicing_queue_event_receipts(status, lease_expires_at);
