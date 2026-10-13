-- Migration: storefront__0002_banner_description.sql
-- Module: storefront
-- Description: Add optional description/subtitle column to storefront_banners
-- Backward-compatible expand migration (nullable column).

ALTER TABLE storefront_banners ADD COLUMN description TEXT;
