-- Retheme only the unchanged generic welcome article and its starter category.
UPDATE cms_blog_categories
SET name = 'iPhone y tecnología',
    slug = 'iphone-y-tecnologia',
    description = 'Guías para conocer y comparar modelos iPhone.',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = '00000000-0000-4000-8000-000000000002'
  AND slug = 'novedades'
  AND name = 'Novedades'
  AND description = 'Novedades, guías e ideas de Vega Store.'
  AND NOT EXISTS (
    SELECT 1 FROM cms_blog_categories c
    WHERE c.slug = 'iphone-y-tecnologia'
      AND c.id <> '00000000-0000-4000-8000-000000000002'
  );

UPDATE cms_blog_posts
SET title = 'Cómo elegir un iPhone: guía para comparar modelos',
    slug = 'como-elegir-un-iphone',
    excerpt = 'Una guía para comparar modelos iPhone según tus preferencias y revisar la información antes de comprar.',
    content_html = '<p>Elegir un iPhone empieza por identificar qué buscas en tu próximo teléfono. Revisa las fichas de los modelos disponibles y compara la información publicada para cada uno.</p><h2>Qué revisar antes de elegir</h2><p>Considera el uso que le darás, el tamaño que prefieres y las opciones de almacenamiento indicadas en la ficha del modelo. La disponibilidad y las condiciones de compra pueden variar.</p><h2>Compara los modelos</h2><p>Consulta los detalles actualizados de cada iPhone en nuestro <a href="/productos">catálogo</a> y confirma la información comercial antes de completar tu compra.</p>',
    seo_title = 'Cómo elegir un iPhone: guía de modelos | Vega Store',
    seo_description = 'Compara modelos iPhone según tus preferencias y revisa la información de cada ficha en Vega Store Colombia antes de comprar.',
    canonical_url = 'https://vega.jnmtortas.com/blog/como-elegir-un-iphone',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = '00000000-0000-4000-8000-000000000003'
  AND slug = 'bienvenido-al-blog-de-vega-store'
  AND title = 'Bienvenido al blog de Vega Store'
  AND excerpt = 'Un espacio para descubrir novedades, guías e ideas para elegir tus productos.'
  AND content_html = '<p>Te damos la bienvenida al blog de Vega Store: un espacio para compartir novedades, guías e ideas que te ayuden a conocer mejor los productos de la tienda.</p><h2>Contenido para elegir con confianza</h2><p>Publicaremos información útil sobre nuestras colecciones y recomendaciones para que encuentres opciones acordes con lo que buscas.</p><p>Mientras tanto, puedes <a href="/productos">explorar el catálogo</a> y descubrir los productos disponibles.</p>'
  AND seo_title = 'Bienvenido al blog de Vega Store'
  AND canonical_url IS NULL AND featured_image_media_id IS NULL AND status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM cms_blog_posts p
    WHERE p.slug = 'como-elegir-un-iphone'
      AND p.id <> '00000000-0000-4000-8000-000000000003'
  );
