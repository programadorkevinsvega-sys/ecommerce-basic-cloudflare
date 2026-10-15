-- Expansión compatible: distingue los encabezados de grupo de los enlaces.
ALTER TABLE cms_menu_items ADD COLUMN item_type TEXT NOT NULL DEFAULT 'link'
  CHECK (item_type IN ('link', 'group'));

UPDATE cms_menu_items SET item_type = 'group', url = ''
WHERE title IN ('Ayuda', 'Información') AND (url = '' OR EXISTS (
  SELECT 1 FROM cms_menu_items child WHERE child.parent_id = cms_menu_items.id
));

INSERT OR IGNORE INTO cms_menus (id, code, title, created_at, updated_at)
VALUES ('9b75f3f7-7c14-4b31-9b44-000000000001', 'header', 'Navegación principal', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO cms_menus (id, code, title, created_at, updated_at)
VALUES ('9b75f3f7-7c14-4b31-9b44-000000000002', 'footer', 'Pie de página', datetime('now'), datetime('now'));

INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000011', m.id, NULL, 'Inicio', '/', 0, '_self', datetime('now'), 'link'
FROM cms_menus m WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000012', m.id, NULL, 'Catálogo', '/productos', 1, '_self', datetime('now'), 'link'
FROM cms_menus m WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/productos');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000013', m.id, NULL, 'Marcas', '/marcas', 2, '_self', datetime('now'), 'link'
FROM cms_menus m WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/marcas');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000014', m.id, NULL, 'Colecciones', '/colecciones', 3, '_self', datetime('now'), 'link'
FROM cms_menus m WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/colecciones');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000015', m.id, NULL, 'Blog', '/blog', 4, '_self', datetime('now'), 'link'
FROM cms_menus m WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/blog');

INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000016', m.id, NULL, 'Ayuda', '', 5, '_self', datetime('now'), 'group'
FROM cms_menus m WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.title = 'Ayuda' AND i.item_type = 'group');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000017', m.id, g.id, 'Seguimiento de pedidos', '/seguimiento-pedido', 0, '_self', datetime('now'), 'link'
FROM cms_menus m JOIN cms_menu_items g ON g.menu_id = m.id AND g.title = 'Ayuda' AND g.item_type = 'group'
WHERE m.code = 'header' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/seguimiento-pedido');

INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000021', m.id, NULL, 'Ayuda', '', 0, '_self', datetime('now'), 'group'
FROM cms_menus m WHERE m.code = 'footer' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.title = 'Ayuda' AND i.item_type = 'group');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000022', m.id, NULL, 'Información', '', 1, '_self', datetime('now'), 'group'
FROM cms_menus m WHERE m.code = 'footer' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.title = 'Información' AND i.item_type = 'group');
INSERT INTO cms_menu_items (id, menu_id, parent_id, title, url, sort_order, target, created_at, item_type)
SELECT '9b75f3f7-7c14-4b31-9b44-000000000023', m.id, g.id, 'Seguimiento de pedidos', '/seguimiento-pedido', 0, '_self', datetime('now'), 'link'
FROM cms_menus m JOIN cms_menu_items g ON g.menu_id = m.id AND g.title = 'Ayuda' AND g.item_type = 'group'
WHERE m.code = 'footer' AND NOT EXISTS (SELECT 1 FROM cms_menu_items i WHERE i.menu_id = m.id AND i.url = '/seguimiento-pedido');
