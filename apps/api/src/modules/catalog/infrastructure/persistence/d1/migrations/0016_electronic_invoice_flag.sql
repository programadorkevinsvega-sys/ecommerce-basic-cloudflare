-- Define si el producto se factura electrónicamente al registrar el pedido.
-- Los productos existentes conservan el flujo de factura comercial normal.
ALTER TABLE catalog_products ADD COLUMN electronic_invoice_enabled INTEGER NOT NULL DEFAULT 0;
