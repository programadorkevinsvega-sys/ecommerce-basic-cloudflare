-- Replace untouched fashion examples with unpublished iPhone catalog records.
DELETE FROM catalog_products
WHERE ((id = 'product-seed-aviator' AND slug = 'gafas-sol-polarizadas-aviador-vega'
       AND name = 'Gafas de Sol Polarizadas Aviador Vega' AND price_in_cents = 12026500
       AND brand = 'Vega Eyewear' AND sku = 'SUN-AVIA-008'
       AND status = 'draft' AND stock_quantity = 0)
   OR (id = 'product-seed-socks' AND slug = 'medias-tecnicas-tobilleras-pack-x3'
       AND name = 'Medias Técnicas Tobilleras Pack x3' AND price_in_cents = 3145000
       AND brand = 'Vega Basic' AND sku = 'SOCK-TECH-007'
       AND status = 'draft' AND stock_quantity = 0)
   OR (id = 'product-seed-backpack' AND slug = 'mochila-urbana-antirrobo-20l'
       AND name = 'Mochila Urbana Antirrobo 20L' AND price_in_cents = 8990000
       AND brand = 'Vega Urban' AND sku = 'BAG-URBAN-006'
       AND status = 'draft' AND stock_quantity = 0))
AND NOT EXISTS (
  SELECT 1 FROM catalog_product_images images
  WHERE images.product_id = catalog_products.id
);

DELETE FROM catalog_product_categories
WHERE product_id IN ('product-seed-aviator','product-seed-socks','product-seed-backpack')
  AND NOT EXISTS (SELECT 1 FROM catalog_products p WHERE p.id = catalog_product_categories.product_id);
DELETE FROM catalog_products_fts
WHERE product_id IN ('product-seed-aviator','product-seed-socks','product-seed-backpack')
  AND NOT EXISTS (SELECT 1 FROM catalog_products p WHERE p.id = catalog_products_fts.product_id);
DELETE FROM catalog_product_variants
WHERE id IN ('variant-seed-aviator-black','variant-seed-socks-m','variant-seed-backpack-black')
  AND NOT EXISTS (SELECT 1 FROM catalog_products p WHERE p.id = catalog_product_variants.product_id);
DELETE FROM catalog_collection_products
WHERE product_id IN ('product-seed-aviator','product-seed-socks','product-seed-backpack')
  AND NOT EXISTS (SELECT 1 FROM catalog_products p WHERE p.id = catalog_collection_products.product_id);
DELETE FROM catalog_product_landing_configs
WHERE product_id IN ('product-seed-aviator','product-seed-socks','product-seed-backpack')
  AND NOT EXISTS (SELECT 1 FROM catalog_products p WHERE p.id = catalog_product_landing_configs.product_id);

DELETE FROM catalog_categories
WHERE id IN ('category-eyewear','category-socks','category-bags')
  AND ((id = 'category-eyewear' AND name = 'Gafas de sol' AND slug = 'gafas-de-sol'
        AND description = 'Gafas de sol y protección visual para uso diario.')
    OR (id = 'category-socks' AND name = 'Medias' AND slug = 'medias'
        AND description = 'Medias cómodas para uso diario y actividad ligera.')
    OR (id = 'category-bags' AND name = 'Morrales y bolsos' AND slug = 'morrales-bolsos'
        AND description = 'Morrales y bolsos funcionales para ciudad y viaje.'))
  AND NOT EXISTS (SELECT 1 FROM catalog_product_categories pc WHERE pc.category_id = catalog_categories.id);
DELETE FROM catalog_brands
WHERE ((id = 'brand-vega-eyewear' AND name = 'Vega Eyewear' AND slug = 'vega-eyewear'
        AND description = 'Diseño y protección visual para acompañar cada día.'
        AND website_url = 'https://vega.jnmtortas.com/marcas')
    OR (id = 'brand-vega-basic' AND name = 'Vega Basic' AND slug = 'vega-basic'
        AND description = 'Esenciales versátiles con comodidad para todos los días.'
        AND website_url = 'https://vega.jnmtortas.com/marcas')
    OR (id = 'brand-vega-urban' AND name = 'Vega Urban' AND slug = 'vega-urban'
        AND description = 'Accesorios funcionales inspirados en el ritmo urbano.'
        AND website_url = 'https://vega.jnmtortas.com/marcas'))
  AND image_media_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM catalog_products p WHERE p.brand = catalog_brands.name);
DELETE FROM catalog_attributes
WHERE (id = 'attribute-color' AND name = 'Color' AND code = 'color' AND type = 'select'
       AND options = '["Negro","Blanco","Azul","Verde"]')
   OR (id = 'attribute-size' AND name = 'Talla' AND code = 'size' AND type = 'select'
       AND options = '["S","M","L","XL","Única"]')
   OR (id = 'attribute-material' AND name = 'Material' AND code = 'material'
       AND type = 'text' AND options = '[]');
DELETE FROM catalog_collections
WHERE ((id = 'collection-everyday' AND name = 'Esenciales para cada día' AND slug = 'esenciales-para-cada-dia'
        AND description = 'Accesorios prácticos y cómodos para acompañar tu rutina.')
    OR (id = 'collection-outdoor' AND name = 'Aventura y movimiento' AND slug = 'aventura-y-movimiento'
        AND description = 'Selección pensada para moverte con comodidad dentro y fuera de la ciudad.')
    OR (id = 'collection-style' AND name = 'Estilo urbano' AND slug = 'estilo-urbano'
        AND description = 'Detalles funcionales que completan un estilo urbano y actual.'))
  AND status = 'inactive' AND image_media_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM catalog_collection_products cp WHERE cp.collection_id = catalog_collections.id);
DELETE FROM catalog_tags
WHERE lower(name) IN ('gafas','polarizadas','aviador','medias','tobilleras','pack','mochila','urbana','antirrobo')
  AND description = '' AND status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM catalog_products p,
      json_each(CASE WHEN json_valid(p.tags) THEN p.tags ELSE '[]' END) tag
    WHERE typeof(tag.value) = 'text' AND lower(trim(tag.value)) = lower(catalog_tags.name)
  );

INSERT OR IGNORE INTO catalog_categories
  (id,name,slug,description,parent_id,status,created_at,updated_at)
VALUES
  ('category-iphone','iPhone','iphone','Teléfonos iPhone de Apple. Consulta la ficha de cada modelo publicado por la tienda.',NULL,'active',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT OR IGNORE INTO catalog_brands
  (id,name,slug,description,website_url,status,image_media_id,created_at,updated_at)
VALUES
  ('brand-apple','Apple','apple','Dispositivos Apple disponibles en el catálogo de Vega Store.','https://www.apple.com/iphone/','active',NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT OR IGNORE INTO catalog_products (
 id,name,slug,description,price_in_cents,supplier_cost_cents,target_margin_basis_points,
 pricing_target_type,target_profit_cents,packed_width_cm,packed_length_cm,packed_height_cm,packed_weight_grams,
 allowed_payment_methods,pricing_version,legacy_price_before_tax_cents,sku,stock_quantity,status,condition,
 specifications,brand,product_type,tags,barcode_gtin,seo_title,seo_description,canonical_url,og_image_id,noindex,
 allows_cash_on_delivery,shipping_scope,sale_mode,created_at,updated_at
) VALUES
('product-iphone-duo','iPhone Duo','iphone-duo','Conoce el Apple iPhone Duo y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-DUO',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone Duo"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone Duo en Colombia | Vega Store','Explora el Apple iPhone Duo en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-duo',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-18-pro-max','iPhone 18 Pro Max','iphone-18-pro-max','Conoce el Apple iPhone 18 Pro Max y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-18-PRO-MAX',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 18 Pro Max"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 18 Pro Max en Colombia | Vega Store','Explora el Apple iPhone 18 Pro Max en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-18-pro-max',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-18-pro','iPhone 18 Pro','iphone-18-pro','Conoce el Apple iPhone 18 Pro y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-18-PRO',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 18 Pro"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 18 Pro en Colombia | Vega Store','Explora el Apple iPhone 18 Pro en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-18-pro',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-air','iPhone Air','iphone-air','Conoce el Apple iPhone Air y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-AIR',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone Air"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone Air en Colombia | Vega Store','Explora el Apple iPhone Air en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-air',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-17-pro-max','iPhone 17 Pro Max','iphone-17-pro-max','Conoce el Apple iPhone 17 Pro Max y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-17-PRO-MAX',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 17 Pro Max"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 17 Pro Max en Colombia | Vega Store','Explora el Apple iPhone 17 Pro Max en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-17-pro-max',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-17-pro','iPhone 17 Pro','iphone-17-pro','Conoce el Apple iPhone 17 Pro y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-17-PRO',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 17 Pro"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 17 Pro en Colombia | Vega Store','Explora el Apple iPhone 17 Pro en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-17-pro',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-17','iPhone 17','iphone-17','Conoce el Apple iPhone 17 y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-17',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 17"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 17 en Colombia | Vega Store','Explora el Apple iPhone 17 en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-17',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-17e','iPhone 17e','iphone-17e','Conoce el Apple iPhone 17e y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-17E',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 17e"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 17e en Colombia | Vega Store','Explora el Apple iPhone 17e en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-17e',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-16-pro-max','iPhone 16 Pro Max','iphone-16-pro-max','Conoce el Apple iPhone 16 Pro Max y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-16-PRO-MAX',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 16 Pro Max"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 16 Pro Max en Colombia | Vega Store','Explora el Apple iPhone 16 Pro Max en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-16-pro-max',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
('product-iphone-16-pro','iPhone 16 Pro','iphone-16-pro','Conoce el Apple iPhone 16 Pro y consulta la información del modelo y sus opciones de compra cuando la ficha esté publicada.',0,NULL,2000,'margin',NULL,NULL,NULL,NULL,NULL,'["wompi"]',1,NULL,'IPH-16-PRO',0,'draft','new','{"brand":"Apple","family":"iPhone","model":"iPhone 16 Pro"}','Apple','smartphone','["Apple","iPhone","smartphone","tecnología"]',NULL,'Comprar iPhone 16 Pro en Colombia | Vega Store','Explora el Apple iPhone 16 Pro en Vega Store Colombia. Consulta la ficha del modelo y las opciones de compra cuando esté publicado.','https://vega.jnmtortas.com/productos/iphone-16-pro',NULL,0,0,'national','cash',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT OR IGNORE INTO catalog_product_categories (product_id,category_id)
SELECT p.id,c.id
FROM catalog_products p
JOIN catalog_categories c ON c.slug = 'iphone'
WHERE p.id IN (
  'product-iphone-duo','product-iphone-18-pro-max','product-iphone-18-pro',
  'product-iphone-air','product-iphone-17-pro-max','product-iphone-17-pro',
  'product-iphone-17','product-iphone-17e','product-iphone-16-pro-max','product-iphone-16-pro'
);

INSERT INTO catalog_products_fts (product_id,name,description,sku)
SELECT id,name,description,sku FROM catalog_products
WHERE id IN (
  'product-iphone-duo','product-iphone-18-pro-max','product-iphone-18-pro',
  'product-iphone-air','product-iphone-17-pro-max','product-iphone-17-pro',
  'product-iphone-17','product-iphone-17e','product-iphone-16-pro-max','product-iphone-16-pro'
)
AND NOT EXISTS (
  SELECT 1 FROM catalog_products_fts fts
  WHERE fts.product_id = catalog_products.id
);

INSERT OR IGNORE INTO catalog_collections
  (id,name,slug,description,status,seo_title,seo_description,image_media_id,created_at,updated_at)
VALUES
  ('collection-iphone-models','Modelos iPhone','modelos-iphone','Selección de modelos iPhone de Apple para consultar desde Vega Store.','inactive','Modelos iPhone | Vega Store','Explora los modelos iPhone del catálogo de Vega Store.',NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT OR IGNORE INTO catalog_collection_products (collection_id,product_id,sort_order)
SELECT c.id, p.id, CASE p.id
    WHEN 'product-iphone-duo' THEN 1
    WHEN 'product-iphone-18-pro-max' THEN 2
    WHEN 'product-iphone-18-pro' THEN 3
    WHEN 'product-iphone-air' THEN 4
    WHEN 'product-iphone-17-pro-max' THEN 5
    WHEN 'product-iphone-17-pro' THEN 6
    WHEN 'product-iphone-17' THEN 7
    WHEN 'product-iphone-17e' THEN 8
    WHEN 'product-iphone-16-pro-max' THEN 9
    ELSE 10
  END
FROM catalog_collections c
JOIN catalog_products p ON p.id IN (
  'product-iphone-duo','product-iphone-18-pro-max','product-iphone-18-pro',
  'product-iphone-air','product-iphone-17-pro-max','product-iphone-17-pro',
  'product-iphone-17','product-iphone-17e','product-iphone-16-pro-max','product-iphone-16-pro'
)
WHERE c.slug = 'modelos-iphone';
