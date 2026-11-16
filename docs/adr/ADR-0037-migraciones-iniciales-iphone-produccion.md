# ADR-0037: Migraciones iniciales de catálogo iPhone en producción

## Estado

Aceptada — 2026-11-16. Excepción puntual al ensayo previo en staging, autorizada explícitamente por el propietario para aplicar las seis migraciones indicadas a continuación.

## Contexto

Staging no está provisionado. La versión activa del Worker referencia la D1 de producción `ecommerce-vega-production` (`a92eda84-2320-4bb1-99ed-c3c01f8c7c1b`); `/health` responde HTTP 200. La D1 tiene 90 migraciones aplicadas y las seis migraciones de contenido iPhone pendientes. Antes del cambio se consultó el bookmark Time Travel `0000001a-0000000a-00005125-22fe8eab835ce52a8977996592dd3da1`.

La inspección previa confirmó que los productos de ejemplo están en borrador, sin inventario ni imágenes; no hay líneas de carrito ni líneas de pedido que los referencien. Banners, anuncios, cupones, promociones y reglas de envío de ejemplo están inactivos; los cupones no tienen usos registrados.

## Decisión y alcance

Aplicar con el runner remoto documentado únicamente:

- `catalog__0018_iphone_starter_catalog.sql`
- `cms__0006_iphone_blog_starter_article.sql`
- `promotions__0006_remove_generic_starter_promotions.sql`
- `shipping__0013_remove_generic_starter_shipping_rules.sql`
- `storefront__0006_clear_external_starter_banner_images.sql`
- `storefront__0007_iphone_starter_content.sql`

La migración de catálogo reemplaza registros iniciales intactos por diez modelos iPhone en borrador, con inventario cero, sin imágenes y sin precio comercial (`price_in_cents=0` por requisito del esquema). El contenido de banners y blog se enfoca en iPhone; los banners continúan inactivos y sin imágenes hasta que se editen en el panel. Las limpiezas solo eliminan ejemplos inactivos e intactos, sin usos ni referencias verificadas.

No cambiar ni desplegar el Worker como parte de esta operación. No restaurar el bookmark como rollback rutinario; cualquier recuperación de datos se evalúa como operación aparte.

## Resultado

Aplicadas el 2026-11-16 con `apps/api/scripts/apply-migrations.js --remote`. El ledger quedó en 96 migraciones y Wrangler confirmó que no quedan pendientes. Se verificaron diez productos iPhone en borrador, con `price_in_cents=0`, inventario cero, SEO presente y sin imágenes; los seis banners están inactivos y sin imagen. El artículo inicial del blog ahora trata sobre iPhone y las reglas iniciales de promoción/envío fueron retiradas. Bookmark posterior: `0000001a-0000003c-00005125-90b408f14aa096dc16a111180eeba7a8`. `/health` respondió HTTP 200. No se desplegó el Worker ni se verificó el panel con una sesión admin.
