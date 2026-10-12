-- Migration: settings__0002_company_tax_fields.sql
-- Module: settings
-- Description: Expand settings_store table with company tax and fiscal information.
-- Backward-compatible expand migration (nullable columns).

ALTER TABLE settings_store ADD COLUMN company_nit TEXT;
ALTER TABLE settings_store ADD COLUMN company_legal_name TEXT;
ALTER TABLE settings_store ADD COLUMN company_address TEXT;
