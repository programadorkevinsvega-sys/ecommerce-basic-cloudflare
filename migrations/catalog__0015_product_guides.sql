-- Guía de texto y asociaciones a artículos publicados del módulo CMS.
-- Los IDs se resuelven mediante CmsGateway; no se crean relaciones SQL entre módulos.
ALTER TABLE catalog_products ADD COLUMN guide_title TEXT;
ALTER TABLE catalog_products ADD COLUMN guide_content TEXT;
ALTER TABLE catalog_products ADD COLUMN related_blog_post_ids TEXT NOT NULL DEFAULT '[]';
