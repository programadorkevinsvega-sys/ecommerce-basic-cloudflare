-- Texto legal editable del footer; el nombre comercial y el año se interpolan al renderizar.
ALTER TABLE settings_store ADD COLUMN footer_copyright_text TEXT;

UPDATE settings_store
SET footer_copyright_text = 'Todos los derechos reservados.'
WHERE footer_copyright_text IS NULL;
