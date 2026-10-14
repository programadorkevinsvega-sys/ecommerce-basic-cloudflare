-- Imagen opcional de colección; el identificador apunta al módulo media sin FK entre módulos.
ALTER TABLE catalog_collections ADD COLUMN image_media_id TEXT;
