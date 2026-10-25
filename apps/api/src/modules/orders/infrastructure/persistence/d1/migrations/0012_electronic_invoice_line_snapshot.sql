-- Congela la regla fiscal vigente al crear el pedido; histórico queda en factura comercial.
ALTER TABLE orders_lines ADD COLUMN electronic_invoice_enabled INTEGER NOT NULL DEFAULT 0;
