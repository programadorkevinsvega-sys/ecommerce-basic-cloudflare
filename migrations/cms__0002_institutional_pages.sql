-- Añade borradores editoriales faltantes sin modificar páginas existentes.
-- Los borradores permanecen privados hasta que un administrador los revise y publique.

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-about', 'Sobre nosotros', 'sobre-nosotros', 'draft', 1, 'Sobre nosotros | Vega Store', 'Conoce más sobre Vega Store.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'sobre-nosotros');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-about-v1', 'cms-page-about', 1, 'Sobre nosotros', '[{"id":"about-intro","type":"rich_text","sortOrder":0,"content":{"html":"<p>Bienvenido a Vega Store. En esta página puedes contar quién está detrás de la tienda, qué productos ofrece y qué distingue su selección.</p><h2>Nuestra tienda</h2><p>Completa esta sección con la historia, el propósito y la información verificable de tu negocio antes de publicar.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-about' AND slug = 'sobre-nosotros')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-about' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-contact', 'Contacto', 'contacto', 'draft', 1, 'Contacto | Vega Store', 'Canales de contacto y atención de Vega Store.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'contacto');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-contact-v1', 'cms-page-contact', 1, 'Contacto', '[{"id":"contact-intro","type":"rich_text","sortOrder":0,"content":{"html":"<p>En esta página se publicarán los canales oficiales para consultas sobre compras, entregas y servicio posventa.</p><h2>Atención al cliente</h2><p>Agrega y verifica el correo, teléfono y horario de atención configurados para la tienda antes de publicar.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-contact' AND slug = 'contacto')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-contact' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-faq', 'Preguntas frecuentes', 'preguntas-frecuentes', 'draft', 1, 'Preguntas frecuentes | Vega Store', 'Resuelve dudas sobre compras, pagos y entregas.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'preguntas-frecuentes');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-faq-v1', 'cms-page-faq', 1, 'Preguntas frecuentes', '[{"id":"faq-items","type":"faq","sortOrder":0,"content":{"items":[{"question":"¿Qué medios de pago puedo usar?","answer":"Los medios disponibles se muestran durante el checkout y dependen del producto y de la cobertura seleccionada."},{"question":"¿Cuánto cuesta y cuánto tarda el envío?","answer":"El valor y el plazo estimado se muestran al consultar la cobertura en el checkout, antes de confirmar el pedido."},{"question":"¿Cómo consulto mi pedido?","answer":"Conserva la referencia del pedido y utiliza las opciones de seguimiento disponibles en la tienda."}]}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-faq' AND slug = 'preguntas-frecuentes')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-faq' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-shipping', 'Envíos y entregas', 'politica-de-envios', 'draft', 1, 'Envíos y entregas | Vega Store', 'Información sobre cobertura, tarifas y entregas.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'politica-de-envios');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-shipping-v1', 'cms-page-shipping', 1, 'Envíos y entregas', '[{"id":"shipping-info","type":"rich_text","sortOrder":0,"content":{"html":"<p>La cobertura, el costo del envío y el plazo estimado se consultan durante el checkout según el municipio seleccionado.</p><h2>Antes de confirmar</h2><p>Verifica que la dirección y el municipio sean correctos. Las opciones de pago disponibles pueden variar según la zona y los productos del pedido.</p><h2>Seguimiento</h2><p>Completa aquí el procedimiento y los canales reales de seguimiento de los pedidos.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-shipping' AND slug = 'politica-de-envios')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-shipping' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-returns', 'Cambios y devoluciones', 'devoluciones', 'draft', 1, 'Cambios y devoluciones | Vega Store', 'Consulta cómo solicitar ayuda con cambios y devoluciones.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'devoluciones');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-returns-v1', 'cms-page-returns', 1, 'Cambios y devoluciones', '[{"id":"returns-info","type":"rich_text","sortOrder":0,"content":{"html":"<p>Esta política debe explicar el proceso para solicitar cambios, devoluciones y ejercer los derechos que correspondan a cada compra.</p><h2>Cómo iniciar una solicitud</h2><p>Completa el canal de contacto, la información que debe aportar el comprador, los pasos de revisión y los costos aplicables, de acuerdo con las condiciones reales de la tienda y la normativa vigente.</p><h2>Estado de la solicitud</h2><p>Indica cómo recibirá el cliente la respuesta y el seguimiento de su caso.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-returns' AND slug = 'devoluciones')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-returns' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-warranty', 'Garantías', 'garantias', 'draft', 1, 'Garantías | Vega Store', 'Información sobre garantías y servicio posventa.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'garantias');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-warranty-v1', 'cms-page-warranty', 1, 'Garantías', '[{"id":"warranty-info","type":"rich_text","sortOrder":0,"content":{"html":"<p>Publica aquí la cobertura de garantía aplicable a los productos, sus plazos y el procedimiento de atención.</p><h2>Solicitar atención</h2><p>Especifica los datos del pedido que el cliente debe aportar, el canal de contacto, las etapas de revisión y los casos cubiertos o excluidos según cada producto.</p><p>Revisa estas condiciones antes de publicar para que coincidan con las garantías ofrecidas por la tienda y sus proveedores.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-warranty' AND slug = 'garantias')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-warranty' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-privacy', 'Política de privacidad', 'politica-de-privacidad', 'draft', 1, 'Política de privacidad | Vega Store', 'Información sobre el uso y cuidado de datos personales.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'politica-de-privacidad');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-privacy-v1', 'cms-page-privacy', 1, 'Política de privacidad', '[{"id":"privacy-info","type":"rich_text","sortOrder":0,"content":{"html":"<p>Esta política debe identificar al responsable del tratamiento, los datos tratados, las finalidades, los encargados y los canales para ejercer los derechos de los titulares.</p><h2>Información por completar</h2><p>Confirma la razón social, identificación, dirección y correo de contacto, así como los plazos de conservación y el procedimiento de consultas o reclamos antes de publicar.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-privacy' AND slug = 'politica-de-privacidad')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-privacy' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-cookies', 'Política de cookies', 'politica-de-cookies', 'draft', 1, 'Política de cookies | Vega Store', 'Información sobre cookies y tecnologías similares.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'politica-de-cookies');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-cookies-v1', 'cms-page-cookies', 1, 'Política de cookies', '[{"id":"cookies-info","type":"rich_text","sortOrder":0,"content":{"html":"<p>Antes de publicar esta política, inventaría las cookies y tecnologías que utiliza la tienda, incluidas las de analítica, seguridad y servicios de terceros.</p><h2>Información por completar</h2><p>Documenta para cada tecnología su finalidad, duración, proveedor y cómo puede gestionarla el visitante. No afirmes que una cookie existe o está desactivada sin verificarlo en el sitio desplegado.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-cookies' AND slug = 'politica-de-cookies')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-cookies' AND version_number = 1);

INSERT INTO cms_pages (id, title, slug, status, current_version, seo_title, seo_description, created_at, updated_at)
SELECT 'cms-page-data-treatment', 'Tratamiento de datos personales', 'tratamiento-de-datos', 'draft', 1, 'Tratamiento de datos personales | Vega Store', 'Consulta cómo solicitar información sobre el tratamiento de datos.', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM cms_pages WHERE slug = 'tratamiento-de-datos');
INSERT OR IGNORE INTO cms_page_versions (id, page_id, version_number, title, blocks, created_by_admin_id, created_at)
SELECT 'cms-version-data-treatment-v1', 'cms-page-data-treatment', 1, 'Tratamiento de datos personales', '[{"id":"data-treatment-info","type":"rich_text","sortOrder":0,"content":{"html":"<p>Esta página debe explicar el tratamiento de datos personales y el procedimiento para que sus titulares presenten consultas o reclamos.</p><h2>Canales y responsable</h2><p>Completa la identidad y los datos de contacto del responsable, los requisitos de las solicitudes y los tiempos de respuesta aplicables después de verificar la información legal de la tienda.</p>"}}]', NULL, datetime('now')
WHERE EXISTS (SELECT 1 FROM cms_pages WHERE id = 'cms-page-data-treatment' AND slug = 'tratamiento-de-datos')
  AND NOT EXISTS (SELECT 1 FROM cms_page_versions WHERE page_id = 'cms-page-data-treatment' AND version_number = 1);
