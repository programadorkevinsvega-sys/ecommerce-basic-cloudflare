# ADR-0038: Landing independiente de producto

- **Estado:** Aceptado

## Contexto

La presentación promocional de producto estaba integrada en `/productos/:slug`, mezclando contenido de campaña con la ficha de catálogo y compra. Se requiere que cada landing tenga URL y contenido editorial propios, sin alterar la ficha habitual.

## Decisión

- Publicar las landings activas de productos publicados en `/ofertas/:slug`, usando el slug del producto.
- Mantener `/productos/:slug` como ficha estándar, independientemente de que exista una landing.
- Dirigir el CTA de la landing a `/productos/:slug#detail-purchase`; la landing no incluye controles de compra ni cambia precios o inventario.
- Usar canonical propio por URL. Incluir en el sitemap de productos solo landings activas asociadas a productos publicados e indexables.
- Recomendar contenido editorial distinto en el editor para reducir duplicidad entre la landing y la ficha.
- Reutilizar la configuración `catalog_product_landing_configs`; no se agrega ni modifica el esquema D1.

## Consecuencias y recuperación

La ruta es aditiva y no cambia datos persistidos. Un rollback de código puede quitar la ruta y el renderizado de landing sin revertir datos; `/productos/:slug` sigue disponible. El canonical propio no garantiza posicionamiento: el contenido debe aportar valor y diferenciarse de la ficha.
