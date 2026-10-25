ALTER TABLE invoicing_invoices ADD COLUMN electronic_status TEXT NOT NULL DEFAULT 'not_configured';
ALTER TABLE invoicing_invoices ADD COLUMN electronic_number TEXT;
ALTER TABLE invoicing_invoices ADD COLUMN cufe TEXT;
ALTER TABLE invoicing_invoices ADD COLUMN electronic_email_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invoicing_invoices ADD COLUMN electronic_errors_json TEXT;
ALTER TABLE invoicing_invoices ADD COLUMN electronic_eligible INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_invoicing_electronic_pending
  ON invoicing_invoices (electronic_eligible, electronic_status, updated_at);

ALTER TABLE invoicing_outbox_events ADD COLUMN event_id TEXT;
ALTER TABLE invoicing_outbox_events ADD COLUMN event_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE invoicing_outbox_events ADD COLUMN payload TEXT;
ALTER TABLE invoicing_outbox_events ADD COLUMN trace_id TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE invoicing_outbox_events ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE invoicing_outbox_events ADD COLUMN published_at TEXT;
ALTER TABLE invoicing_outbox_events ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
UPDATE invoicing_outbox_events SET event_id = id, payload = payload_json WHERE event_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoicing_outbox_event_id ON invoicing_outbox_events (event_id);

ALTER TABLE invoicing_credit_notes ADD COLUMN provider_reference TEXT;
ALTER TABLE invoicing_credit_notes ADD COLUMN provider_number TEXT;
ALTER TABLE invoicing_credit_notes ADD COLUMN cude TEXT;
ALTER TABLE invoicing_credit_notes ADD COLUMN electronic_status TEXT NOT NULL DEFAULT 'not_configured';
ALTER TABLE invoicing_credit_notes ADD COLUMN correction_concept_code TEXT NOT NULL DEFAULT '1';
ALTER TABLE invoicing_credit_notes ADD COLUMN electronic_errors_json TEXT;
ALTER TABLE invoicing_credit_notes ADD COLUMN electronic_email_sent INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_invoicing_credit_note_pending
  ON invoicing_credit_notes (electronic_status, created_at);
