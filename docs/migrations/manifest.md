# Manifiesto de Migraciones D1

Registro de control de migraciones aplicadas por módulo y entorno. Todo cambio de esquema debe reflejarse en este archivo conforme al contrato de arquitectura y reglas de recuperación (ROLLBACK_RECOVERY.md).

> Las filas históricas de abajo son afirmaciones heredadas de este manifiesto; no representan evidencia individual de que Wrangler las aplicara. La sección final registra la consulta y reconciliación remota realizada durante esta auditoría.

> **Reinicio de prelanzamiento (2026-10-15):** la D1 anterior (`9b69f19a-cad8-4e53-b0d1-0bd2adb11945`) fue eliminada por el propietario. El binding apunta ahora a la D1 nueva `ecommerce-vega-production` (`372088f2-d700-4155-9057-6595815a005e`); las 69 migraciones y el estado inicial se verificaron según el registro final de esta nota.

> **Binding corregido (2026-10-24):** el UUID anterior dejó de existir en la cuenta activa. El binding actual es `ecommerce-vega-production` (`bfb3ba3f-5e2a-4c33-9b93-0a5d7c04b6ef`). Ledger remoto verificado con 77 migraciones previas; se aplicaron solo las tres migraciones Factus/identidad fiscal hasta llegar a 80. Time Travel antes `00000041-00000002-0000510f-73c358f83a0fbce0614d1a72d45257ca`; después `00000041-0000001a-0000510f-2b98934b998cf0284950d666d6a98c6e`. Columnas y ledger verificados tras la aplicación.

---

## Módulo: `settings`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `settings__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 6092431 | ✅ Aplicada con éxito |
| `settings__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 6092431 | ✅ Verificada |
| `settings__0002_company_tax_fields.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | 9a0a0c4 | ✅ Aplicada con éxito (expand-only: company_nit, company_legal_name, company_address) |
| `settings__0002_company_tax_fields.sql` | v2 | Local (Miniflare) | 2026-10-12 | 9a0a0c4 | ✅ Verificada y retrocompatible |
| `settings__0003_storefront_contact_social.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada con runner Wrangler; expansión aditiva, país Colombia solo en valores vacíos |
| `settings__0003_storefront_contact_social.sql` | v3 | Local | 2026-10-14 | trabajo actual | ✅ Fuentes y copias generadas; consistencia verificada |
| `settings__0004_footer_copyright.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada con runner Wrangler; columna aditiva y texto inicial |
| `settings__0005_factus_configuration.sql` | v5 | Producción (`ecommerce-vega-production`) | 2026-10-24 | trabajo actual | ✅ Aplicada; ledger y tres columnas Factus confirmadas en D1. |

---

## Módulo: `identity`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `identity__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 52eace0 | ✅ Aplicada con éxito |
| `identity__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 52eace0 | ✅ Compilada y verificada |

---

## Módulo: `media`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `media__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 8a6dafe | ✅ Aplicada con éxito |
| `media__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 8a6dafe | ✅ Compilada y verificada |

---

## Módulo: `catalog`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `catalog__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 8a6dafe | ✅ Aplicada con éxito |
| `catalog__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 8a6dafe | ✅ Compilada y verificada |
| `catalog__0002_product_seo_fields.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `catalog__0002_product_seo_fields.sql` | v2 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `catalog__0003_brands_attributes.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `catalog__0003_brands_attributes.sql` | v3 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `catalog__0004_product_pricing.sql` | v4 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aditiva; metadata nueva, precios previos intactos; prueba de actualización agregada |
| `catalog__0004_product_pricing.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; 8 productos siguen v1, sin conversión de precios |
| `catalog__0005_profit_target_pricing.sql` | v5 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aplicada desde esquema vacío y anterior; defaults conservan margen y precio; segunda ejecución sin cambios |
| `catalog__0005_profit_target_pricing.sql` | v5 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; 8 productos default `margin`, sin objetivo fijo ni cambios de precio |
| `catalog__0006_suppliers_variants.sql` | v6 | Local temporal | 2026-10-14 | trabajo actual | ✅ Aplicada desde D1 vacía junto con las 38 migraciones previas; segunda pasada idempotente |
| `catalog__0006_suppliers_variants.sql` | v6 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada y verificada en `d1_migrations` y `sqlite_master`; tablas confirmadas |
| `catalog__0007_taxonomy_status.sql` | v7 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada a las 07:55 UTC y verificada en `d1_migrations` y `PRAGMA table_info`; expansión aditiva, conserva los registros existentes activos. |
| `catalog__0008_collections.sql` | v8 | Local temporal | 2026-10-14 | trabajo actual | ✅ Verificada desde esquema vacío y en actualización; integración D1 de persistencia aprobada. |
| `catalog__0008_collections.sql` | v8 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada por runner después de verificar las 41 entradas anteriores; ledger, tablas y columnas confirmados por consulta remota. No se insertó contenido. |
| `catalog__0009_collection_image.sql` | v9 | Local temporal | 2026-10-14 | `bda5afd` | ✅ Aplicación desde cero/actualización legacy aprobadas y persistencia D1 de imagen verificada en Workers. |
| `catalog__0009_collection_image.sql` | v9 | Producción (`ecommerce-vega-production`) | 2026-10-14 | `bda5afd` | ✅ Aplicada por runner tras confirmar 42 migraciones previas; ledger y columna `image_media_id` verificados. No se modificaron filas existentes. |
| `catalog__0010_brand_image.sql` | v10 | Local temporal | 2026-10-14 | trabajo actual | ✅ Aplicación completa desde cero y segunda pasada idempotente verificadas; columna nullable sin afectar marcas existentes. |
| `catalog__0011_product_shipping_dimensions.sql` | v11 | Local temporal | 2026-10-15 | `aebac6f` | ✅ D1 temporal limpia: aplicada desde cero e idempotencia verificada |
| `catalog__0011_product_shipping_dimensions.sql` | v11 | Producción (`ecommerce-vega-production`) | 2026-10-15 | `aebac6f` | ✅ Aplicada después de verificar 53 migraciones anteriores; columnas confirmadas, 8 productos previos conservados |
| `catalog__0014_product_tags.sql` | v14 | Producción (`ecommerce-vega-production`) | 2026-10-15 | `834b60c` | ✅ Aplicada por runner remoto tras confirmar 74 migraciones previas; ledger y tres etiquetas iniciales verificados. Se conservaron 3 productos y se importaron sus etiquetas existentes. |
| `catalog__0015_product_guides.sql` | v15 | Producción (`ecommerce-vega-production`) | 2026-10-15 | `eae64b6` | ✅ Aplicada con runner remoto tras confirmar el ledger; se verificaron las tres columnas nuevas y 3 productos existentes intactos. |
| `catalog__0010_brand_image.sql` | v10 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada después de confirmar 43 entradas y columna ausente; ledger y `PRAGMA table_info` verificaron la columna nullable. Bookmark antes `00000280-00000319-00005104-84f1213e1c2180147cbcc968ea1511f3`, después `00000280-00000325-00005104-1be4680bac0b0e072f56d01855aeaa81`. |

`catalog__0008_collections.sql` crea `catalog_collections` y `catalog_collection_products`. El estado inicial queda `inactive` para que una colección nueva no se publique por accidente. El rollback del Worker no requiere retirar las tablas: la versión anterior no las consulta. No ejecutar `DROP TABLE` como rollback, porque eliminaría las colecciones configuradas. Para aplicar en local: `pnpm db:migrate:local`; en producción, después de respaldo y revisión del ledger: `ALLOW_REMOTE_D1_MIGRATIONS=1 pnpm db:migrate:remote`. En esta ejecución se aplicó en producción y la comprobación posterior confirmó el ledger, las tablas y todas sus columnas. No se insertó contenido.

`catalog__0009_collection_image.sql` agrega `image_media_id` nullable a `catalog_collections`; no cambia las colecciones ya existentes ni crea una FK entre `catalog` y `media`. La aplicación solo persiste identificadores emitidos por el endpoint autenticado de carga de medios. Es compatible con rollback porque el Worker previo ignora la columna; no se elimina la columna ni los objetos R2 al volver de versión. Se probó localmente desde cero y en actualización legacy. Producción: se confirmó que las 42 migraciones anteriores estaban registradas y la columna no existía; el runner aplicó únicamente v9. La consulta posterior confirmó ledger y `PRAGMA table_info`; no se modificaron filas. Bookmark previo: `00000280-000002fd-00005104-e018d5e33f828ecca78c8afdb001111a`. Bookmark posterior: `00000280-00000309-00005104-56d328364235248d062a98edf7b30396`. No restaurar bookmarks sin evaluar todas las escrituras posteriores.

`catalog__0010_brand_image.sql` agrega `image_media_id` nullable a `catalog_brands`, sin FK entre `catalog` y `media`. Las marcas existentes conservan sus valores y el Worker previo ignora la columna. En rollback de aplicación se revierte el Worker, se conserva la columna y no se eliminan objetos de R2; restaurar un bookmark solo tras evaluar todas las escrituras posteriores. La migración se aplicó en producción al confirmar las 43 entradas previas y la ausencia de la columna. La consulta posterior confirmó la entrada 44 y la columna nullable. No se alteraron filas ni se subieron objetos de prueba.

`catalog__0014_product_tags.sql` crea `catalog_tags`, importa las etiquetas que ya aparecen en el JSON `catalog_products.tags` y agrega tres etiquetas iniciales con descripción y estado activo. Las asignaciones continúan almacenadas en el campo de producto para conservar compatibilidad con SSR y APIs existentes. Para rollback de Worker se conserva la tabla y los registros; no ejecutar `DROP TABLE` ni revertir el JSON de productos.

`catalog__0015_product_guides.sql` agrega a `catalog_products` columnas nullable para el título y el contenido textual de una guía y una columna JSON con IDs de artículos del blog. No guarda archivos PDF ni accede a tablas `cms_*`; los artículos se resuelven en el storefront por `CmsGateway` y solo se muestran si siguen publicados. La expansión es compatible con el Worker anterior. Se aplicó antes de publicar el Worker; el ledger confirmó la migración y `PRAGMA table_info` los campos `guide_title`, `guide_content` y `related_blog_post_ids`. El conteo de productos permaneció en 3. La aplicación directa a producción siguió la instrucción persistente del propietario de aplicar las migraciones; no hay entorno de staging configurado, por lo que no se afirma validación previa en staging.

Aplicación en producción: bookmark previo `00000004-0000009a-00005105-3e07951d03e9c7fe02985ec7a9f5293c`; posterior `00000004-000000a6-00005105-5b9887d0895969e31a22becc08feacfb`. El ledger muestra la migración v14, el catálogo conserva 3 productos y `catalog_tags` contiene las tres etiquetas sembradas más las nueve etiquetas históricas recuperadas de los productos.

---

## Módulo: `storefront`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `storefront__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | d60a32e | ✅ Aplicada con éxito |
| `storefront__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | d60a32e | ✅ Compilada y verificada |
| `storefront__0002_banner_description.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (expand-only: description) |
| `storefront__0002_banner_description.sql` | v2 | Local (Miniflare) | 2026-10-12 | HEAD | ✅ Verificada y retrocompatible |
| `storefront__0003_banner_types_and_cta.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (expand-only: banner_type, button_text) |
| `storefront__0003_banner_types_and_cta.sql` | v3 | Local (Miniflare) | 2026-10-12 | HEAD | ✅ Verificada y retrocompatible |
| `storefront__0005_place_brand_and_collection_banners.sql` | v5 | Producción (`ecommerce-vega-production`) | 2026-10-15 | trabajo actual | ✅ Aplicada; los banners activos quedaron en sus páginas de marcas y colecciones |

---

## Módulo: `seo`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `seo__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `seo__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

---

## Módulo: `cms`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `cms__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `cms__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `cms__0002_institutional_pages.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-14 | `7125966` | ✅ Aplicada por el runner; consulta posterior confirmó las nueve páginas en borrador y la página de términos publicada |
| `cms__0002_institutional_pages.sql` | v2 | Local | Pendiente | trabajo actual | ⏳ Por aplicar; la inserción está condicionada por slug/ID y versión |
| `cms__0003_blog.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-14 | Este release | ✅ Aplicada con el runner; ledger y cuatro tablas verificadas; `PRAGMA foreign_key_check` vacío |
| `cms__0003_blog.sql` | v3 | Local (Miniflare/D1) | 2026-10-14 | Este release | ✅ Desde D1 vacía, upgrade legado y segunda pasada idempotente; publicación/SSR verificadas |
| `cms__0004_blog_welcome_article.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-14 | `8620b98` | ✅ Aplicada con runner; ledger, artículo, autor, categoría y relación verificados; FK check vacío |
| `cms__0004_blog_welcome_article.sql` | v4 | Local (SQLite/D1) | 2026-10-14 | `8620b98` | ✅ Upgrade legado; semilla repetida sin duplicados; 46 migraciones desde cero y segunda pasada |
| `cms__0005_menu_management.sql` | v5 | Producción (`ecommerce-vega-production`) | 2026-10-14 | `9695ab8` | ✅ Aplicada con el runner; ledger, columna, enlaces previos y seguimiento bajo «Ayuda» verificados |

`cms__0005_menu_management.sql` agrega `item_type` con valor predeterminado `link`, conserva los enlaces existentes y crea la navegación inicial solo cuando faltan rutas o menús. Incluye el enlace de seguimiento dentro del grupo `Ayuda` del encabezado y del pie de página. Si se revierte el Worker, no retirar la columna ni el contenido; conservarlos para una siguiente versión.

Aplicada en `ecommerce-vega-production`; la verificación posterior encontró la migración en `d1_migrations`, `item_type` en el esquema y `/seguimiento-pedido` como hijo de «Ayuda» tanto en `header` como en `footer`. Bookmark previo `00000319-000001f6-00005105-17ce768350a9b6abc77efada4b7eea20`; posterior `00000319-00000206-00005105-ed0e138adbb08005777ea607832f8199`.

`cms__0002_institutional_pages.sql` es una migración de contenido aditiva: inserta solo cuando el slug no existe, crea versión 1 únicamente para los IDs de página sembrados y deja cada página en `draft`. No cambia tablas ni elimina datos. La reversión del Worker conserva estas páginas; no borrar las filas para volver a una versión anterior. Los borradores se publican desde Administración → Páginas CMS después de completar y revisar su contenido.

`cms__0003_blog.sql` agrega `cms_blog_authors`, `cms_blog_categories`, `cms_blog_posts` y `cms_blog_post_categories` con índices y claves foráneas internas al módulo. No altera páginas ni datos existentes. Puede volver a ejecutarse porque las tablas e índices usan `IF NOT EXISTS`. No tiene down migration: si el Worker se revierte, se conservan los artículos y el esquema; no ejecutar `DROP`. La publicación programada la procesa el Cron ya configurado cada cinco minutos y deja una entrada de auditoría por artículo publicado.

`cms__0004_blog_welcome_article.sql` crea de forma idempotente el perfil editorial Vega Store, la categoría Novedades y un único artículo de bienvenida publicado, solo si esos IDs/slugs aún no existen. No modifica páginas CMS ni artículos existentes y no contiene enlaces ni medios externos. Es una semilla de contenido y su retirada no forma parte del rollback: conservar el contenido y las tablas aunque se revierta el Worker.

En producción se confirmó antes de aplicar v4: ledger con 45 migraciones, cero autores/categorías/artículos, 10 páginas CMS y cero errores de claves foráneas. Aplicada con `ALLOW_REMOTE_D1_MIGRATIONS=1 pnpm db:migrate:remote`; después, ledger con v4, exactamente un artículo publicado, una categoría, un autor, una relación y `PRAGMA foreign_key_check` vacío. `/blog`, `/blog/bienvenido-al-blog-de-vega-store` y `/sitemap-blog.xml` respondieron HTTP 200. Bookmarks Time Travel: previo `00000281-00000152-00005104-0d1d5159a6b3435bacb7ba398bedf3ed`; posterior `00000281-0000019a-00005104-201a677cda563d5e1a50a199aacfeec5`.

---

## Módulo: `promotions`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `promotions__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `promotions__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `promotions__0002_coupon_targets.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `promotions__0003_correct_welcome_coupon_description.sql` | v3 | D1 local y producción (`ecommerce-vega-production`) | Aplicada el 2026-10-15 por runner | `d60e05b` | Corrige únicamente la descripción obsoleta de BIENVENIDO10 si coincide con el texto erróneo observado; no cambia reglas ni descuentos. Ledger verificado. |

---

## Módulo: `shipping`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `shipping__0007_free_shipping_policy.sql` | v7 | D1 local y producción (`ecommerce-vega-production`) | Aplicada el 2026-10-15 por runner | `d60e05b` | En producción se aplicó la versión que insertaba un valor inicial; la fuente canónica quedó sin ese `INSERT` para que instalaciones nuevas solo creen el esquema. Excepción de historial documentada en ADR-0028. |
| `shipping__0008_targeted_free_shipping_rules.sql` | v8 | D1 local y producción (`ecommerce-vega-production`) | Aplicada el 2026-10-15; verificada en ledger y datos | trabajo actual | Crea la tabla e índices de reglas. En producción la versión aplicada insertó la regla general; la fuente canónica quedó sin semilla. v9 retiró la fila de producción. Excepción documentada en ADR-0028. |
| `shipping__0009_remove_implicit_free_shipping_rule.sql` | v9 | D1 local y producción (`ecommerce-vega-production`) | Aplicada el 2026-10-15; ledger confirmado | trabajo actual | Elimina únicamente la regla inicial `shipping-free-default`; no borra reglas creadas por administradores. |
| `shipping__0010_disable_legacy_free_shipping_policy.sql` | v10 | D1 local y producción (`ecommerce-vega-production`) | Aplicada el 2026-10-15; ledger y valor cero verificados | trabajo actual | Desactiva y pone en cero el registro singleton retirado, para que un rollback a un Worker antiguo no active una promoción preconfigurada. No crea una regla de envío gratis. |
| `shipping__0011_enable_medellin_local_cod.sql` | v11 | Producción (`ecommerce-vega-production`); local pendiente de verificación | Aplicada en producción el 2026-10-15 UTC; ledger confirmado | trabajo actual | Habilita contra entrega en la zona local activa `zone-medellin`; no cambia las zonas nacionales ni otras zonas locales. Lectura posterior confirmó `is_active=1` y `allows_cash_on_delivery=1`; antes estaba en `0`. |

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `shipping__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `shipping__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `shipping__0002_mipaquete_shipments.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-15 | HEAD | ✅ Aplicada con el runner; ledger y cuatro tablas verificadas |
| `shipping__0002_mipaquete_shipments.sql` | v2 | Local temporal | 2026-10-15 | HEAD | ✅ D1 vacía; 53 migraciones aplicadas y segunda pasada idempotente |
| `shipping__0003_package_profiles_and_quote_snapshot.sql` | v3 | Local temporal | 2026-10-15 | `aebac6f` | ✅ D1 temporal limpia: aplicada desde cero e idempotencia verificada |
| `shipping__0003_package_profiles_and_quote_snapshot.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-15 | `aebac6f` | ✅ Aplicada después de verificar 53 migraciones anteriores; siete columnas de snapshot confirmadas |
| `shipping__0006_medellin_metropolitan_local_delivery.sql` | v6 | Producción (`ecommerce-vega-production`) | 2026-10-15 | trabajo actual | ✅ Aplicada; Medellín y los 10 municipios del Valle de Aburrá quedaron en la zona local activa; Bogotá y Cali inactivas; asociaciones anteriores conservadas |

`shipping__0003_package_profiles_and_quote_snapshot.sql` crea perfiles de empaques en `shipping_*` y agrega dimensiones, peso y huella de contenido a cotizaciones. Es expand-only; el Worker previo ignora las columnas nuevas. No elimina ni cambia cotizaciones anteriores y no habilita automáticamente la integración. Aplicación remota: ledger previo con 53 entradas; posterior con las dos migraciones en v11/v3 y esquema confirmado. Bookmark previo `0000031e-00000006-00005105-0e9bd84f1f1bcd8fda233edfdde8b690`; posterior `0000031e-00000018-00005105-afe4ec3022e54638ad845b8948a965a9`. Ocho productos existentes quedaron sin dimensiones, intencionalmente; se deben completar en el panel antes de activar cotizaciones automáticas.

`shipping__0008_targeted_free_shipping_rules.sql` crea el repositorio de reglas de envío gratis. La fuente canónica no incluye reglas ni beneficios sembrados. En producción se aplicó una iteración inicial con una fila migrada desde la política anterior; v9 la eliminó. El registro singleton se conserva solo por compatibilidad de rollback y v10 lo desactiva con monto cero. No borrar tablas durante rollback.

`shipping__0009_remove_implicit_free_shipping_rule.sql` elimina esa fila de configuración inicial, no reglas creadas por administradores. La lista queda vacía y ningún pedido recibe envío gratis hasta que el comercio cree una regla en Admin → Marketing → Envío gratis.

`shipping__0010_disable_legacy_free_shipping_policy.sql` actualiza solo la configuración singleton obsoleta a `enabled=0`, `threshold_cents=0`. Aplicada en producción; consulta posterior confirmó el ledger, regla nueva vacía y la fila legacy desactivada en cero. Esto evita que un rollback a un Worker anterior reactive el valor de negocio que se retira. La tabla sigue disponible y no participa en la versión actual.
El Worker se desplegó desde `aebac6f` como versión `bf1c7641-ecc6-4e1c-a33a-a7b55e7a54ef` (100%). `/health` respondió HTTP 200 y `shipping_carrier_config.enabled` continúa en `0`. No se hicieron llamadas a MiPaquete ni se generaron guías.

---

## Módulo: `cart`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `cart__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `cart__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

---

## Módulo: `inventory`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `inventory__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `inventory__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `inventory__0002_idempotent_order_consumption.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-13 | HEAD | ✅ Aplicada por runner y verificada en D1; crea tabla de idempotencia sin filas iniciales |
| `inventory__0002_idempotent_order_consumption.sql` | v2 | Local (Miniflare) | 2026-10-13 | HEAD | ✅ Aplicación desde cero y actualización verificadas |

---

## Módulo: `orders`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `orders__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `orders__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `orders__0002_guest_cart_capability.sql` | v2 | `ecommerce-vega-production` y Local | 2026-10-12 | `3c33f1c` | ✅ Aplicada por runner y verificada en D1 remota; columna nullable, sin pérdida de datos. |
| `orders__0003_pricing_snapshots.sql` | v3 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aditiva; tax, versión fiscal y comisión estimada congeladas en pedido |
| `orders__0003_pricing_snapshots.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; pedidos históricos conservaron default v1 |
| `orders__0004_checkout_transaction_fee.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-13 | `c364eb8` | ✅ Expand-only aplicada y verificada; columna `transaction_fee_cents` default 0, 12 pedidos previos intactos |
| `orders__0004_checkout_transaction_fee.sql` | v4 | D1 temporal / Workers | 2026-10-13 | `c364eb8` | ✅ Aplicación vacía y repetición idempotente verificadas |
| `orders__0005_secure_order_tracking.sql` | v5 | Producción (`ecommerce-vega-production`) | 2026-10-15 | trabajo actual | ✅ Aplicada por runner tras verificar 49 migraciones previas; ledger, tres columnas e índice confirmados. Pedidos existentes: 13 antes y después, sin cambios de filas. Worker desplegado y al 100% (`7ac9c89a-eb45-433c-93b8-3f9c4aea54ca`); `/seguimiento-pedido` HTTP 200 y `/health` saludable. Bookmark previo `00000319-0000019e-00005105-9644332b47d51b300b3ec6018eb1b9b7`; posterior `00000319-000001aa-00005105-06eac73c65e096dc87017c45983141dd`. |
| `orders__0008_shipping_fulfillment_method.sql` | v8 | Producción (`ecommerce-vega-production`) | 2026-10-15 | trabajo actual | ✅ Aplicada; entrada del ledger, columna/default verificados y 13 pedidos conservados. Bookmark previo `0000031e-000004ba-00005105-af412588b177ffea97d2b0bbf9c07c9d`; posterior `0000031e-000004c4-00005105-6741b923aa72b727756c4d275c673b0f`. |
| `orders__0009_shipping_discount.sql` | v9 | D1 local y producción (`ecommerce-vega-production`) | Aplicada el 2026-10-15 por runner | `d60e05b` | Expand-only: agrega `shipping_discount_cents NOT NULL DEFAULT 0`; pedidos anteriores conservan su valor y total. Ledger y columna verificados en producción. |
| `orders__0011_customer_fiscal_identity.sql` | v11 | Producción (`ecommerce-vega-production`) | 2026-10-24 | trabajo actual | ✅ Aplicada; ledger y columnas fiscales confirmadas en D1. |

---

## Módulo: `payments`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `payments__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `payments__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `payments__0002_expand_columns.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | 1a555ba | ✅ Aplicada con éxito (expand-only: transactions, outbox, webhooks) |

## Módulo: `reviews`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `reviews__0001_init.sql` | v1 | Local (Miniflare/D1) | 2026-10-14 | trabajo actual | ✅ Incluida en las pruebas de persistencia e idempotencia |
| `reviews__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-15 UTC | trabajo actual | ✅ Aplicada con `wrangler d1 migrations apply` y verificada sin migraciones pendientes; Worker v`e9d2211b-405b-41fa-8d68-03ab5372e04d` desplegado |
| `reviews__0002_demo_reviews.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Históricamente aplicada por el runner; `source` presente y 16 filas ficticias fueron insertadas en 8 productos. Bookmark previo `00000318-00000266-00005105-cfa103f6094be24c97079f7fd66cc420`; posterior `00000318-0000029b-00005105-46375ca8fc9d1f2ad2801e89087b66cc`. Worker v`b35a0d07-8ace-4ec4-beb0-4be85a4ccc0c` desplegado. **Preparación de prelanzamiento:** la fuente canónica ahora conserva solo el cambio de esquema; una base existente no se altera por editar el archivo. Una D1 nueva no recibirá reseñas ficticias.
| `reviews__0003_manual_reviews.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada con Wrangler remoto; aditiva y mantiene clasificados como no verificados los registros manuales al hacer rollback.

---

## Módulo: `realtime`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `realtime__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `realtime__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `realtime__0002_expand_columns.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | 576d038 | ✅ Aplicada con éxito (expand-only: body, data_json, read, recipient_id) |

---

## Módulo: `invoicing`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `invoicing__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (secuencias, facturas, notas crédito, outbox) |
| `invoicing__0002_tax_included.sql` | v2 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aditiva; conserva documentos previos y marca IVA incluido |
| `invoicing__0002_tax_included.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; facturas previas conservan `tax_included=0` |
| `invoicing__0003_factus_electronic_invoices.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-24 | trabajo actual | ✅ Aplicada; ledger y campos de estado Factus confirmados en D1. |

---

## Módulo: `notifications`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `notifications__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (bitácora de emails e idempotencia) |

---

## Módulo: `audit`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `audit__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (auditoría inmutable de acciones admin) |

---

## Migraciones correctivas de auditoría

| Archivo | Versión | Entorno | Estado | Motivo / compatibilidad |
|---|---|---|---|---|
| `payments__0003_cod_collection_receipts.sql` | v3 | `ecommerce-vega-production` | Aplicada con Wrangler; verificada | Añade `receipt_number`, `created_at`, backfill desde `collected_at` e índice; esquema consultado después de aplicar. |
| `payments__0004_settlement_costs.sql` | v4 | Local temporal | 2026-10-13 | trabajo actual | ✅ Tabla aditiva de comisiones reales reportadas, estimación congelada y referencia de liquidación |
| `payments__0004_settlement_costs.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; tabla creada vacía |
| `payments__0005_settlement_corrections.sql` | v5 | Local temporal | 2026-10-14 | trabajo actual | ✅ Incluida en `pnpm db:test-migrations`; esquema vacío y actualización legacy pasaron |
| `payments__0005_settlement_corrections.sql` | v5 | Producción (`ecommerce-vega-production`) | 2026-10-14 | trabajo actual | ✅ Aplicada con el runner; ledger, columnas e índice verificados. Tabla creada vacía. |
| `realtime__0003_preserve_read_state.sql` | v3 | `ecommerce-vega-production` | SQL aplicado y ledger reconciliado | Copia `is_read` a `read`; consulta posterior confirmó 0 discrepancias. |

## Reconciliación remota de auditoría (2026-10-12)

Base consultada: `ecommerce-vega-production` (`9b69f19a-cad8-4e53-b0d1-0bd2adb11945`). Wrangler mostraba 16 archivos como pendientes, aunque el esquema ya contenía la mayoría de sus tablas y columnas. Se inspeccionó `sqlite_master`, índices, datos semilla y `d1_migrations`; no se recrearon tablas ni se borraron datos.

Cambios de código, fuentes canónicas y evidencia publicados en `c48622f` (`fix(security): audit commerce, migrations, and checkout`).

Se ejecutó DDL base idempotente (`IF NOT EXISTS` / `INSERT OR IGNORE`) para asegurar índices y semillas ausentes, se sincronizó el campo `read`, y se registraron en `d1_migrations` las 15 migraciones históricas cuyo esquema ya estaba presente. Wrangler aplicó después `payments__0003_cod_collection_receipts.sql`. El ledger quedó con 27 entradas. La consulta posterior confirmó `receipt_number` y `created_at`, y cero filas con `read != is_read`. No se insertaron pedidos, pagos ni datos de prueba en la base remota.

Time-travel bookmark antes: `000001d3-00000000-00005103-de470059e507085a4470e642050b3f9b`. Después del DDL idempotente: `000001d3-0000000a-00005103-671f1eee9f16534d6381bdb95291ba9e`. Después de sincronizar el ledger y lectura: `000001d3-00000012-00005103-c4868733b8f504b0b2f67ae94990981b`. Guardar estos bookmarks para recuperación operativa. El Worker se publicó con Wrangler el 2026-10-14 UTC, versión `c0d2aeac-0e54-48dc-9cee-94dd1e4f9799`; `/health` devolvió D1, KV, Queue y R2 `ok`. El push por sí mismo no creó un deployment en esta ocasión, por lo que fue necesario ejecutar el comando de release autorizado.

La fuente canónica es `apps/api/src/modules/<módulo>/infrastructure/persistence/d1/migrations/`. `node scripts/build-migrations.js` genera copias para ambos directorios de Wrangler (`migrations/` raíz y `apps/api/migrations/`); no elimina archivos. Ejecutar cada script desde la raíz o desde `apps/api/` produce las mismas salidas. El runner `apps/api/scripts/apply-migrations.js` aplica por módulo y versión numérica y registra los nombres en `d1_migrations`; úselo en local y remoto. Wrangler 3 no ordenó adecuadamente nombres prefijados por módulo desde base vacía (`settings__0002` antes de `settings__0001`). Con Wrangler 4.149.0, la prueba local desde base vacía verificó 29 migraciones, orden correcto y segunda pasada sin cambios. El runner se ejecutó en producción para `orders__0002_guest_cart_capability.sql` y `inventory__0002_idempotent_order_consumption.sql` después de verificar ledger, esquema y time-travel. Las consultas posteriores confirmaron ambas entradas; la columna guest es nullable y la tabla de idempotencia está vacía. La base tiene 8 pedidos guest con `payment_status='pending'` (3 Wompi, 5 contra entrega); antes de desplegar código que exige capability deben conciliarse los pedidos Wompi/checkout en curso y definirse el seguimiento seguro de pedidos previos sin hash. La migración inventory v2 es aditiva, no modifica datos ni tablas de otros módulos. Modo remoto requiere `ALLOW_REMOTE_D1_MIGRATIONS=1`; revisar respaldo y estado conforme a `ROLLBACK_RECOVERY.md`.

Time-travel bookmarks para inventory v2: anterior `000001d5-000000ba-00005103-eb91d48b70aea4fec605c7d2d20c96ad`; posterior `000001d5-000000c8-00005103-d2640c92983f646d012ce00d26d099ca`. Verificado después de aplicar: entrada en `d1_migrations`, tabla presente y vacía. No se ejecutaron escrituras funcionales ni datos de prueba en producción.

### Integración de MiPaquete (`shipping__0002_mipaquete_shipments.sql`, 2026-10-15)

Bookmark previo `0000031c-0000000a-00005105-f0f8576beb70c994817e0ae73956d4ff`; posterior `0000031c-00000014-00005105-e13bfad6e2a92d4cee82c9b8e44840fe`. El runner aplicó únicamente `shipping__0002_mipaquete_shipments.sql`, pues la consulta previa confirmó las otras 52 migraciones registradas. La verificación posterior confirmó el ledger y estas cuatro tablas vacías: `shipping_carrier_config`, `shipping_carrier_quotes`, `shipping_carrier_shipments` y `shipping_carrier_shipment_events`. No se crearon guías ni se hicieron llamadas a MiPaquete.

### Precios, snapshots fiscales y conciliación (2026-10-13)

Se consultó el ledger remoto y solo aparecían pendientes `catalog__0004_product_pricing.sql`, `invoicing__0002_tax_included.sql`, `orders__0003_pricing_snapshots.sql` y `payments__0004_settlement_costs.sql`. Wrangler aplicó las cuatro con el runner. Una interrupción de red ocurrió después de las dos primeras; la lectura posterior confirmó exactamente esas dos en ledger/esquema y las otras dos pendientes. Se reintentó el runner, que aplicó las restantes. La consulta posterior confirmó las cuatro entradas, columnas/tablas, `settings_store.tax_rate_percent=19`, ocho productos aún con `pricing_version=1` y cero filas en `payments_settlement_costs`. Las migraciones solo añadieron esquema y no cambiaron precios, pedidos, facturas ni pagos.

Time-travel bookmark anterior: `00000266-000000e0-00005104-627c6de1a2d6f60d6b950aef18301ef6`. Bookmark posterior: `00000266-00000106-00005104-619b6cb14d8e3317ab1bc3e062828c78`. No se desplegó el Worker en esta etapa; verificar `/health` y deployments después del push integrado.

El inventario estático de tablas, columnas, restricciones, índices y referencias TypeScript está en [schema-audit.md](./schema-audit.md). La lista de fuentes y copias se conserva en esos dos directorios; la auditoría no eliminó históricos.




La migración adicional `orders__0004_checkout_transaction_fee.sql` se aplicó a producción después de consultar el ledger y `PRAGMA table_info(orders_orders)`: agregó la columna con default cero. La lectura posterior confirmó el ledger, la columna y 12 pedidos previos con suma de cargos cero. No se modificaron pedidos existentes.

### Seguimiento logístico administrable (`orders__0006_admin_shipping_tracking.sql`)

| Archivo | Versión | Entorno | Estado | Motivo / compatibilidad |
|---|---|---|---|---|
| `orders__0006_admin_shipping_tracking.sql` | v6 | Producción (`ecommerce-vega-production`) | 2026-10-15 | ✅ Aplicada con el runner; ledger confirmado, cuatro columnas nullable e índice verificados. 13 pedidos antes y después; sin cambios en filas. |

La migración agrega columnas nullable para transportadora, guía, enlace HTTPS de seguimiento y fecha estimada, más un índice para el listado administrativo. Es compatible con pedidos existentes y se puede revertir el Worker sin retirar columnas. El listado consulta D1 con paginación y filtros; cambios de estado pasan por el caso de uso existente de pedidos para mantener historial, notificaciones y auditoría. Bookmark previo `00000319-0000030e-00005105-220c1a7cd88d492b99674d86e8a191e1`; posterior `00000319-00000318-00005105-755b67b38f1b4f4737972576af539a8c`. Las consultas posteriores confirmaron la entrada del ledger, `shipping_carrier`, `shipping_tracking_number`, `shipping_tracking_url`, `estimated_delivery_date` e índice, y 13 pedidos intactos. Worker desplegado el 2026-10-15 UTC, versión `fe92e17f-ba97-4a26-aa9d-b8529832d8c7`; `/health` devolvió D1, KV, Queue y R2 `ok`, y `/seguimiento-pedido` respondió HTTP 200.

### Modalidad de cobro del flete (`orders__0007_shipping_charge_mode.sql`)

Migración aplicada en producción con el runner después de comprobar que era la única pendiente. Antes de aplicar: 13 pedidos existentes y bookmark `0000031e-0000002a-00005105-d620b504c1ac29b9cb47af9b8ee41daf`. Después: 13 pedidos intactos con `shipping_charge_mode='included'` y `shipping_collection_cents=0`; las dos columnas nuevas y la entrada del ledger fueron verificadas. Bookmark posterior `0000031e-00000036-00005105-9b04e375a95a60e102217cd0e6e01dce`. El Worker con ambos modos de pago de flete se desplegó el 2026-10-15 UTC como `5a4f024b-f4bc-417c-9372-5f59d717cb8d`; `/health` respondió saludable con D1, KV, Queue y R2 `ok`. La migración es expand-only; el Worker anterior ignora las columnas y los pedidos previos conservan su total. No quitar columnas en rollback.

### Activación y medidas iniciales estimadas de MiPaquete

`catalog__0012_initial_shipping_package_estimates.sql` asigna medidas y peso empacados estimados a los ocho SKU existentes únicamente si aún no tienen medidas. `shipping__0004_enable_initial_carrier_profiles.sql` registra tres perfiles de paquete estimados y habilita la integración con origen Medellín (`05001000`), recaudo al entregar, pago de flete descontado del recaudo (`paymentType=102`), sin recogida automática y criterio de menor precio. Son valores operativos iniciales, no mediciones físicas; el admin puede corregirlos antes de crear guías.

Aplicadas en producción el 2026-10-15 UTC. Bookmark anterior `0000031e-0000004e-00005105-32dc97a8e3f08aa76c7a3f6e096e503c`; posterior `0000031e-000000c4-00005105-417f8c98519cc235f3b7a5d8a0632623`. Las consultas remotas verificaron `enabled=1`, origen `05001000`, tres perfiles activos, medidas de 8 SKU y 13 pedidos intactos. `/api/v1/shipping/carrier/availability` respondió `{"enabled":true}`. Después se validó la cotización de producción: la API devuelve tres transportadoras para Medellín y tres para Bogotá, sin crear guías ni pedidos. El código `170` para Colombia y el manejo de fletes decimales/comisiones nulas quedaron corregidos en el Worker desplegado `f2a57beb-5343-4171-9143-1a402439ab70`; los importes se redondean hacia arriba al peso completo más próximo antes de guardarse en centavos. Los registros de cotización expiran a los diez minutos. Los 13 pedidos se mantienen intactos. No se requiere migración adicional para el CRUD de empaques porque reutiliza `shipping_carrier_package_profiles`, creada en `shipping__0003_package_profiles_and_quote_snapshot.sql`.

### Impresión de guías de MiPaquete (`shipping__0005_label_print_tracking.sql`)

Migración expand-only: agrega actor y fecha de impresión de guías e índice parcial para localizar pendientes. Aplicada en producción el 2026-10-15 UTC, commit `1b752a0`, después de revisar el bookmark previo `0000031e-00000344-00005105-6cb274debbe41bcd8e881d85090e7406`; ledger y columnas `printed_at`/`printed_by` confirmados. Bookmark posterior `0000031e-0000035c-00005105-668244adf405ef29bf7388edcc03f451`. Worker desplegado como `a61ca513-1224-4a6b-a388-2e9a58f76a83`; `/health` respondió 200. No modifica envíos existentes ni genera despachos.

La página independiente **Imprimir guías** quedó publicada desde `b87c543`, versión Worker `73806e8c-fe6e-4a88-a47f-726a855fa46e`; `/health` volvió a responder 200 con D1, KV, Queue y R2 saludables.

### Etiquetas internas de entrega local (`orders__0010_local_delivery_labels.sql`)

Migración expand-only del módulo `orders`. Crea la cola de impresión de etiquetas internas, marca de impresión y backfill idempotente para pedidos locales no cancelados. Aplicada en producción el 2026-10-15 con commit `8f62bea`. Bookmark previo `00000322-00000000-00005105-6b34ebf94e6d0953401acae104ec0763`; posterior `00000322-0000000a-00005105-796f9e1468d9154d397bc388ad8119c9`. La consulta posterior confirmó 1 etiqueta pendiente para 1 pedido local existente; no cambió filas de pedidos. Worker desplegado como `dbb06cf9-35a9-4037-9ae7-f92a5bd4112b`. `https://vega.jnmtortas.com/health` respondió 200 y el host anterior `workers.dev` respondió 404 tras deshabilitarse.

## Nota de sincronización y limitaciones de evidencia (2026-10-15)

El inventario de nombres de migraciones fuente se cotejó con `apps/api/src/modules/*/infrastructure/persistence/d1/migrations/*.sql`: todas las fuentes presentes aparecen referenciadas en este manifiesto. Este registro contiene evidencias históricas por entorno, pero no sustituye consultar `d1_migrations` antes de aplicar nuevas migraciones.

Hay una inconsistencia cronológica que debe reconciliarse: las filas históricas declaran `reviews__0002_demo_reviews.sql` aplicada en producción el 2026-10-14 y `reviews__0001_init.sql` el 2026-10-15. Como una migración posterior depende de la tabla creada por v1, esas fechas no demuestran por sí solas el orden real de aplicación. Consultar el ledger de producción y corregir este manifiesto con evidencia antes del próximo cambio en el módulo. El nombre histórico `0002_demo_reviews.sql` y `source='demo'` identifican únicamente el origen ficticio de datos autorizados; no describen un modo de ejecución ni una etiqueta mostrada a clientes.

La fila de `cms__0002_institutional_pages.sql` para entorno local se conserva como no verificada: que la migración exista en la fuente y esté aplicada en producción no demuestra que se haya corrido en una D1 local persistente.

### Preparación de D1 limpia para prelanzamiento (2026-10-15)

Se retiraron de las fuentes canónicas dos semillas ajenas al catálogo/configuración que se conservarán: el stock fijo de un producto de muestra en `inventory__0001_init.sql` y las 16 opiniones ficticias en `reviews__0002_demo_reviews.sql`. Se mantienen las inicializaciones operativas de roles, secuencia de facturas, cobertura y empaques de envío, menús y contenido CMS/blog solicitados para la nueva instalación. Este cambio solo afecta nuevas aplicaciones de migraciones; no borra ni modifica filas en la D1 actualmente aplicada. Las copias de Wrangler se regeneran con `node scripts/build-migrations.js`.

El propietario creó una D1 nueva vacía (`ecommerce-vega-production`, ID `372088f2-d700-4155-9057-6595815a005e`) después de eliminar la anterior. El binding fue actualizado en ambos archivos Wrangler. El runner remoto aplicó y verificó las 69 migraciones conocidas; durante la primera ejecución hubo un HTTP 502 temporal del host de cargas de Cloudflare después de 25 migraciones. El ledger confirmó el punto de corte y el runner se reintentó de forma segura hasta completar las 69.

Consulta de verificación posterior: `d1_migrations=69`, `catalog_products=0`, `inventory_stocks=0` y `reviews_product_reviews=0`. Se conservaron las semillas/valores operativos previstos: `shipping_divipola=48`, `shipping_zones=4`, `shipping_zone_locations=19`, `shipping_carrier_package_profiles=3`, `cms_pages=9`, `cms_blog_posts=1`, `cms_menus=2`, `identity_roles=4` e `invoicing_sequences=1`. Por tanto, la base está migrada pero aún necesita cargar los productos desde el panel antes de vender. No se modificaron R2, KV, secretos ni otros recursos Cloudflare.

### Registros iniciales de gestión de catálogo y marketing (2026-10-15)

Se añadieron y aplicaron cuatro migraciones compatibles hacia adelante:

| Migración | Prefijo | Registros incluidos |
|---|---|---|
| `catalog__0013_catalog_management_starter_records.sql` | `catalog_*` | 3 categorías, 3 marcas, 3 atributos, 3 colecciones, 3 productos base en borrador, 3 variantes relacionadas y relaciones de colección/categoría/búsqueda. |
| `storefront__0004_storefront_management_starter_records.sql` | `storefront_*` | 3 banners promocionales, 3 informativos y 3 anuncios de barra superior. |
| `storefront__0005_place_brand_and_collection_banners.sql` | `storefront_*` | Reubica los banners de marcas y colecciones desde `home` a `brands` y `collections`, conservando estado activo y enlaces. |
| `promotions__0004_promotion_management_starter_records.sql` | `promotions_*` | 3 reglas de descuento y 3 cupones. |
| `shipping__0012_free_shipping_starter_rules.sql` | `shipping_*` | 3 reglas de envío gratis. |

Las cuatro migraciones se aplicaron a `ecommerce-vega-production` (ID `372088f2-d700-4155-9057-6595815a005e`) con el runner remoto. Verificación del ledger: 73 migraciones. Consultas confirmaron tres registros en cada grupo solicitado y cero variantes sin producto. Los productos base están en borrador y sin stock; banners, anuncios, descuentos, cupones y reglas de envío gratis están inactivos, por lo que estos datos no publican contenido ni conceden descuentos/envíos al cliente. Las URLs de las seis imágenes de banner respondieron HTTP 200 al aplicar la migración. Los campos opcionales `image_media_id` y `og_image_id` quedaron nulos porque todavía no hay archivos de marca/colección/producto cargados como activos de Media/R2; no se asignaron identificadores ficticios.


## Módulo: `wishlist` (introducido en `feat/phase-12-wishlist`)

| Archivo | Versión | Entorno | Estado |
|---|---|---|---|
| `wishlist__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | Aplicada el 2026-10-22 mediante `ALLOW_REMOTE_D1_MIGRATIONS=1 bun run db:migrate:remote`; el runner informó `aplicada wishlist__0001_init.sql` y `esquema al día (77 migraciones conocidas)`. El propietario validó manualmente en frontend añadir, consultar y eliminar favoritos, además del recorrido de aceptación. |

La migración crea únicamente `wishlist_items` y `wishlist_outbox_events`. El repositorio guarda y elimina cada favorito junto con un evento versionado dentro de un `D1Database.batch`. La salida compartida confirmó la aplicación del archivo en producción. La consulta posterior de existencia de tablas/ledger debe conservarse como evidencia operativa separada; la aceptación funcional se registró según la confirmación manual del propietario.
