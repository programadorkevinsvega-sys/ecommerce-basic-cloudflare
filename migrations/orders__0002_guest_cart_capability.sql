-- Migration: orders__0002_guest_cart_capability.sql
-- Persist only a digest of the guest cart cookie used to authorize guest order access.
ALTER TABLE orders_orders ADD COLUMN guest_cart_id_hash TEXT;
