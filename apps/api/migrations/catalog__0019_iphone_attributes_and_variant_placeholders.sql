-- iPhone catalog attributes and non-sellable variant placeholders.
INSERT OR IGNORE INTO catalog_attributes
  (id,name,code,type,options,status,created_at,updated_at)
VALUES
  ('attribute-iphone-model','Modelo','iphone_model','text','[]','active',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('attribute-iphone-storage','Almacenamiento','iphone_storage','select','["128 GB","256 GB","512 GB","1 TB"]','active',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('attribute-iphone-color','Color','iphone_color','text','[]','active',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT OR IGNORE INTO catalog_product_variants
  (id,product_id,name,sku,options_json,price_in_cents,stock_quantity,status,created_at,updated_at)
VALUES
  ('variant-iphone-duo-config','product-iphone-duo','Configurar almacenamiento y color','IPH-DUO-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-18-pro-max-config','product-iphone-18-pro-max','Configurar almacenamiento y color','IPH-18-PRO-MAX-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-18-pro-config','product-iphone-18-pro','Configurar almacenamiento y color','IPH-18-PRO-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-air-config','product-iphone-air','Configurar almacenamiento y color','IPH-AIR-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-17-pro-max-config','product-iphone-17-pro-max','Configurar almacenamiento y color','IPH-17-PRO-MAX-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-17-pro-config','product-iphone-17-pro','Configurar almacenamiento y color','IPH-17-PRO-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-17-config','product-iphone-17','Configurar almacenamiento y color','IPH-17-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-17e-config','product-iphone-17e','Configurar almacenamiento y color','IPH-17E-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-16-pro-max-config','product-iphone-16-pro-max','Configurar almacenamiento y color','IPH-16-PRO-MAX-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('variant-iphone-16-pro-config','product-iphone-16-pro','Configurar almacenamiento y color','IPH-16-PRO-CONFIG','{}',NULL,0,'inactive',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
