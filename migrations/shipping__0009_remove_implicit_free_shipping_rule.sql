-- The former application default must not become an active business rule.
-- Rules are created and maintained explicitly by administrators.
DELETE FROM shipping_free_shipping_rules WHERE id = 'shipping-free-default';
