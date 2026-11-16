CREATE INDEX IF NOT EXISTS idx_invoicing_customer_name_search
  ON invoicing_invoices (customer_name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_invoicing_customer_email_search
  ON invoicing_invoices (customer_email COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_invoicing_total_search
  ON invoicing_invoices (total_cents);

CREATE INDEX IF NOT EXISTS idx_invoicing_credit_note_invoice_amount
  ON invoicing_credit_notes (invoice_id, electronic_status, amount_in_cents);
