-- Marks fiscal presentation for invoices emitted with tax-inclusive catalog prices.
ALTER TABLE invoicing_invoices ADD COLUMN tax_included INTEGER NOT NULL DEFAULT 0;
