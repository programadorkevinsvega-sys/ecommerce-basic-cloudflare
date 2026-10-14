-- Campos públicos para identificación, ubicación y redes sociales del negocio.
-- Expansión nullable; el país colombiano se completa por la configuración del storefront existente.
ALTER TABLE settings_store ADD COLUMN company_city TEXT;
ALTER TABLE settings_store ADD COLUMN company_country TEXT;
ALTER TABLE settings_store ADD COLUMN social_instagram_url TEXT;
ALTER TABLE settings_store ADD COLUMN social_tiktok_url TEXT;
ALTER TABLE settings_store ADD COLUMN social_facebook_url TEXT;

UPDATE settings_store
SET company_country = 'Colombia'
WHERE company_country IS NULL OR trim(company_country) = '';
