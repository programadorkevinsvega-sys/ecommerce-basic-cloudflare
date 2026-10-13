-- Expansión compatible: el repositorio ya escribe estos campos.
-- created_at se rellena desde collected_at para conservar filas anteriores.
ALTER TABLE payments_cod_collections ADD COLUMN receipt_number TEXT;
ALTER TABLE payments_cod_collections ADD COLUMN created_at TEXT;

UPDATE payments_cod_collections
SET created_at = collected_at
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_cod_created ON payments_cod_collections (created_at);
