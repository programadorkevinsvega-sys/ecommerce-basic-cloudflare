-- Ubica los banners activos de marca y colección en sus directorios correspondientes.
UPDATE storefront_banners
SET placement = 'collections', updated_at = '2026-10-15T00:00:00.000Z'
WHERE id = 'banner-promo-collections';

UPDATE storefront_banners
SET placement = 'brands', updated_at = '2026-10-15T00:00:00.000Z'
WHERE id = 'banner-promo-brands';
