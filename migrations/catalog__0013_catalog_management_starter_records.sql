-- Datos iniciales completos para gestión del catálogo en una instalación nueva.
-- Los productos base quedan en borrador y sin stock; solo sirven para asociar variantes.
INSERT OR IGNORE INTO catalog_categories (id,name,slug,description,parent_id,status,created_at,updated_at) VALUES
('category-eyewear','Gafas de sol','gafas-de-sol','Gafas de sol y protección visual para uso diario.',NULL,'active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('category-socks','Medias','medias','Medias cómodas para uso diario y actividad ligera.',NULL,'active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('category-bags','Morrales y bolsos','morrales-bolsos','Morrales y bolsos funcionales para ciudad y viaje.',NULL,'active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');

INSERT OR IGNORE INTO catalog_brands (id,name,slug,description,website_url,status,image_media_id,created_at,updated_at) VALUES
('brand-vega-eyewear','Vega Eyewear','vega-eyewear','Diseño y protección visual para acompañar cada día.','https://vega.jnmtortas.com/marcas','active',NULL,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('brand-vega-basic','Vega Basic','vega-basic','Esenciales versátiles con comodidad para todos los días.','https://vega.jnmtortas.com/marcas','active',NULL,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('brand-vega-urban','Vega Urban','vega-urban','Accesorios funcionales inspirados en el ritmo urbano.','https://vega.jnmtortas.com/marcas','active',NULL,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');

INSERT OR IGNORE INTO catalog_attributes (id,name,code,type,options,status,created_at,updated_at) VALUES
('attribute-color','Color','color','select','["Negro","Blanco","Azul","Verde"]','active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('attribute-size','Talla','size','select','["S","M","L","XL","Única"]','active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('attribute-material','Material','material','text','[]','active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');

INSERT OR IGNORE INTO catalog_products (
 id,name,slug,description,price_in_cents,supplier_cost_cents,target_margin_basis_points,
 pricing_target_type,target_profit_cents,packed_width_cm,packed_length_cm,packed_height_cm,packed_weight_grams,
 allowed_payment_methods,pricing_version,legacy_price_before_tax_cents,sku,stock_quantity,status,condition,
 specifications,brand,product_type,tags,barcode_gtin,seo_title,seo_description,canonical_url,og_image_id,noindex,
 allows_cash_on_delivery,shipping_scope,sale_mode,created_at,updated_at
) VALUES
('product-seed-aviator','Gafas de Sol Polarizadas Aviador Vega','gafas-sol-polarizadas-aviador-vega','Gafas de sol polarizadas con montura liviana y diseño aviador.',12026500,6500000,2000,'margin',NULL,14,16,6,220,'["wompi","cash_on_delivery"]',2,NULL,'SUN-AVIA-008',0,'draft','new','{"lente":"Polarizado","montura":"Liviana","proteccion":"UV400"}','Vega Eyewear','gafas de sol','["gafas","polarizadas","aviador"]',NULL,'Gafas de Sol Polarizadas Aviador Vega','Diseño aviador con lentes polarizados y protección UV400.','https://vega.jnmtortas.com/productos/gafas-sol-polarizadas-aviador-vega',NULL,0,1,'national','cash','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('product-seed-socks','Medias Técnicas Tobilleras Pack x3','medias-tecnicas-tobilleras-pack-x3','Pack de tres pares de medias tobilleras transpirables con soporte en el arco.',3145000,1500000,2000,'margin',NULL,10,12,4,220,'["wompi","cash_on_delivery"]',2,NULL,'SOCK-TECH-007',0,'draft','new','{"pack":"3 pares","composicion":"75% Algodón, 20% Poliéster, 5% Elastano"}','Vega Basic','medias','["medias","tobilleras","pack"]',NULL,'Medias Técnicas Tobilleras Pack x3','Tres pares de medias tobilleras cómodas y transpirables para cada día.','https://vega.jnmtortas.com/productos/medias-tecnicas-tobilleras-pack-x3',NULL,0,1,'national','cash','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('product-seed-backpack','Mochila Urbana Antirrobo 20L','mochila-urbana-antirrobo-20l','Mochila urbana de 20 litros con compartimentos organizadores y cierre seguro.',8990000,5000000,2000,'margin',NULL,32,45,15,850,'["wompi","cash_on_delivery"]',2,NULL,'BAG-URBAN-006',0,'draft','new','{"capacidad":"20 L","compartimentos":"Organizadores","uso":"Urbano"}','Vega Urban','mochila','["mochila","urbana","antirrobo"]',NULL,'Mochila Urbana Antirrobo 20L','Mochila de 20 litros para organizar tus objetos en la ciudad.','https://vega.jnmtortas.com/productos/mochila-urbana-antirrobo-20l',NULL,0,1,'national','cash','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');

INSERT OR IGNORE INTO catalog_product_categories (product_id,category_id) VALUES
('product-seed-aviator','category-eyewear'),('product-seed-socks','category-socks'),('product-seed-backpack','category-bags');
INSERT OR IGNORE INTO catalog_products_fts (product_id,name,description,sku) VALUES
('product-seed-aviator','Gafas de Sol Polarizadas Aviador Vega','Gafas de sol polarizadas con montura liviana y diseño aviador.','SUN-AVIA-008'),
('product-seed-socks','Medias Técnicas Tobilleras Pack x3','Pack de tres pares de medias tobilleras transpirables con soporte en el arco.','SOCK-TECH-007'),
('product-seed-backpack','Mochila Urbana Antirrobo 20L','Mochila urbana de 20 litros con compartimentos organizadores y cierre seguro.','BAG-URBAN-006');

INSERT OR IGNORE INTO catalog_collections (id,name,slug,description,status,seo_title,seo_description,image_media_id,created_at,updated_at) VALUES
('collection-everyday','Esenciales para cada día','esenciales-para-cada-dia','Accesorios prácticos y cómodos para acompañar tu rutina.','inactive','Esenciales para cada día | Vega Store','Descubre accesorios versátiles para tu rutina diaria.',NULL,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('collection-outdoor','Aventura y movimiento','aventura-y-movimiento','Selección pensada para moverte con comodidad dentro y fuera de la ciudad.','inactive','Aventura y movimiento | Vega Store','Explora productos funcionales para tus planes y recorridos.',NULL,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('collection-style','Estilo urbano','estilo-urbano','Detalles funcionales que completan un estilo urbano y actual.','inactive','Estilo urbano | Vega Store','Encuentra accesorios de inspiración urbana para todos los días.',NULL,'2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');

INSERT OR IGNORE INTO catalog_collection_products (collection_id,product_id,sort_order) VALUES
('collection-everyday','product-seed-socks',1),('collection-outdoor','product-seed-backpack',1),('collection-style','product-seed-aviator',1);

INSERT OR IGNORE INTO catalog_product_variants (id,product_id,name,sku,options_json,price_in_cents,stock_quantity,status,created_at,updated_at) VALUES
('variant-seed-aviator-black','product-seed-aviator','Negro','SUN-AVIA-008-BLK','{"Color":"Negro","Talla":"Única"}',12026500,0,'active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('variant-seed-socks-m','product-seed-socks','Talla M','SOCK-TECH-007-M','{"Color":"Negro","Talla":"M"}',3145000,0,'active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z'),
('variant-seed-backpack-black','product-seed-backpack','Negro 20L','BAG-URBAN-006-BLK','{"Color":"Negro","Capacidad":"20 L"}',8990000,0,'active','2026-10-15T00:00:00.000Z','2026-10-15T00:00:00.000Z');
