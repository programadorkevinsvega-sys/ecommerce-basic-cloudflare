-- Retheme only the untouched starter banners; keep user-edited banner data intact.
UPDATE storefront_banners
SET title = 'Encuentra tu próximo iPhone',
    description = 'Explora modelos iPhone de Apple y consulta la información de cada ficha.',
    button_text = 'Ver iPhone',
    link_url = '/productos',
    alt_text = 'Selección de modelos iPhone',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'banner-promo-catalog' AND title = 'Accesorios para acompañar tu día'
  AND description = 'Descubre diseño y funcionalidad en una selección para todos los días.'
  AND button_text = 'Explorar catálogo' AND link_url = '/productos' AND is_active = 0;

UPDATE storefront_banners
SET title = 'Modelos iPhone para elegir',
    description = 'Compara la información de los modelos iPhone disponibles en el catálogo.',
    button_text = 'Explorar modelos',
    link_url = '/productos',
    alt_text = 'Modelos iPhone en el catálogo',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'banner-promo-collections' AND title = 'Encuentra tu próxima colección'
  AND description = 'Explora selecciones organizadas para tus planes y tu estilo.'
  AND button_text = 'Ver colecciones' AND link_url = '/colecciones' AND is_active = 0;

UPDATE storefront_banners
SET title = 'Conoce iPhone de Apple',
    description = 'Consulta las fichas de los modelos iPhone seleccionados por Vega Store.',
    button_text = 'Ver catálogo',
    link_url = '/productos',
    alt_text = 'iPhone de Apple en Vega Store',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'banner-promo-brands' AND title = 'Conoce nuestras marcas'
  AND description = 'Diseños seleccionados para combinar comodidad, calidad y estilo.'
  AND button_text = 'Ver marcas' AND link_url = '/marcas' AND is_active = 0;

UPDATE storefront_banners
SET title = 'Información de cada iPhone',
    description = 'Revisa los detalles de cada modelo iPhone en su ficha de producto.',
    button_text = 'Consultar modelos',
    link_url = '/productos',
    alt_text = 'Información de modelos iPhone',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'banner-info-quality' AND title = 'Detalles pensados para durar'
  AND description = 'Conoce materiales, acabados y características de cada producto.'
  AND button_text = 'Conocer productos' AND link_url = '/productos' AND is_active = 0;

UPDATE storefront_banners
SET title = 'Compra iPhone con información clara',
    description = 'Consulta las opciones de entrega disponibles en la ficha de cada modelo.',
    button_text = 'Ver iPhone',
    link_url = '/productos',
    alt_text = 'Modelos iPhone y opciones de entrega',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'banner-info-shipping' AND title = 'Opciones de envío claras'
  AND description = 'Consulta las opciones disponibles para tu municipio durante la compra.'
  AND button_text = 'Ver catálogo' AND link_url = '/productos' AND is_active = 0;

UPDATE storefront_banners
SET title = 'Guía para elegir tu iPhone',
    description = 'Lee una guía para comparar modelos iPhone según tus preferencias.',
    button_text = 'Leer la guía',
    link_url = '/blog/como-elegir-un-iphone',
    alt_text = 'Guía para elegir un iPhone',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'banner-info-journal' AND title = 'Ideas y novedades Vega Store'
  AND description = 'Lee guías e información para elegir los productos que van contigo.'
  AND button_text = 'Visitar el blog' AND link_url = '/blog' AND is_active = 0;

UPDATE storefront_announcements
SET message = 'Explora modelos iPhone de Apple y consulta la información de cada ficha.',
    link_url = '/productos',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'announcement-topbar-shipping'
  AND message = 'Compra en línea y consulta el costo de envío para tu destino.'
  AND link_url = '/productos' AND is_active = 0;

UPDATE storefront_announcements
SET message = 'Descubre nuestra selección de modelos iPhone.',
    link_url = '/productos',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'announcement-topbar-new'
  AND message = 'Descubre las novedades y selecciones de Vega Store.'
  AND link_url = '/colecciones' AND is_active = 0;

UPDATE storefront_announcements
SET message = 'Consulta la ficha del modelo iPhone para revisar sus detalles.',
    link_url = '/productos',
    is_active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = 'announcement-topbar-support'
  AND message = '¿Necesitas ayuda? Revisa nuestras respuestas y canales de atención.'
  AND link_url = '/p/atencion-pqrs' AND is_active = 0;
