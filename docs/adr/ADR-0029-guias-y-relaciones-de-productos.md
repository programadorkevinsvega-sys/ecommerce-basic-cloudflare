# ADR-0029: Guías y recomendaciones en la ficha de producto

- **Estado:** Aceptado
- **Fecha:** 2026-10-15

## Contexto

Las fichas necesitan contenido de ayuda específico y enlaces a artículos editoriales, además de recomendaciones de productos. El contenido debe poder editarse con el producto sin permitir HTML arbitrario ni acoplar directamente los esquemas de `catalog` y `cms`.

## Decisión

- `catalog` guarda título/contenido de guía en texto plano y una lista acotada de IDs de artículos asociados.
- El BFF usa `CmsGateway` para resolver esos IDs y solo presenta artículos cuyo estado actual sea `published`. No hay JOIN, FK ni import entre módulos.
- La guía se escapa como texto en SSR; no se aceptan HTML, PDF ni archivos adjuntos.
- Los productos relacionados se recomiendan usando etiquetas, marca, tipo y categorías compartidas. No se rellenan espacios con productos sin señales de relación.

## Consecuencias

- Si un artículo asociado se archiva o elimina, deja de mostrarse sin alterar el producto.
- La migración de catálogo agrega columnas nullable/default y es compatible con el Worker anterior.
- El orden de recomendación es determinista por coincidencias, disponibilidad y nombre.
