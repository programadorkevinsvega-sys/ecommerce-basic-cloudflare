-- Migration: storefront__0003_banner_types_and_cta.sql
-- Module: storefront
-- Description: Add banner_type (informative vs promotional) and custom button_text
-- Backward-compatible expand migration.

ALTER TABLE storefront_banners ADD COLUMN banner_type TEXT NOT NULL DEFAULT 'promotional';
ALTER TABLE storefront_banners ADD COLUMN button_text TEXT DEFAULT 'Explorar colección';
