-- Contenido inicial del blog solicitado para mostrar y verificar la gestión.
-- IDs estables e INSERT OR IGNORE hacen que la semilla pueda repetirse sin duplicar registros.
INSERT OR IGNORE INTO cms_blog_authors
  (id, name, bio, image_media_id, active, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Vega Store', 'Equipo editorial de Vega Store.', NULL, 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT OR IGNORE INTO cms_blog_categories
  (id, name, slug, description, active, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000002', 'Novedades', 'novedades',
   'Novedades, guías e ideas de Vega Store.', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT OR IGNORE INTO cms_blog_posts
  (id, title, slug, excerpt, content_html, author_id, featured_image_media_id,
   featured_image_alt, status, scheduled_at, published_at, seo_title,
   seo_description, canonical_url, noindex, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000003',
   'Bienvenido al blog de Vega Store',
   'bienvenido-al-blog-de-vega-store',
   'Un espacio para descubrir novedades, guías e ideas para elegir tus productos.',
   '<p>Te damos la bienvenida al blog de Vega Store: un espacio para compartir novedades, guías e ideas que te ayuden a conocer mejor los productos de la tienda.</p><h2>Contenido para elegir con confianza</h2><p>Publicaremos información útil sobre nuestras colecciones y recomendaciones para que encuentres opciones acordes con lo que buscas.</p><p>Mientras tanto, puedes <a href="/productos">explorar el catálogo</a> y descubrir los productos disponibles.</p>',
   '00000000-0000-4000-8000-000000000001', NULL, '', 'published', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
   'Bienvenido al blog de Vega Store',
   'Descubre novedades, guías e ideas para conocer los productos y colecciones de Vega Store.',
   NULL, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT OR IGNORE INTO cms_blog_post_categories (post_id, category_id)
VALUES ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002');
