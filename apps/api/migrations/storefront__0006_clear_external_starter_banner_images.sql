-- Starter banners stay image-free until same-origin media is uploaded.
UPDATE storefront_banners
SET image_url = '', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (
  'banner-promo-catalog',
  'banner-promo-collections',
  'banner-promo-brands',
  'banner-info-quality',
  'banner-info-shipping',
  'banner-info-journal'
)
AND is_active = 0
AND image_url LIKE 'https://images.unsplash.com/%';
