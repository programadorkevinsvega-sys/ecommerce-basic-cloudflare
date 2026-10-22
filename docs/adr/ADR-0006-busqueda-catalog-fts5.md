# ADR-0006: Motor de Búsqueda con D1 FTS5

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
Se requiere permitir a los clientes buscar productos por texto libre (nombre, descripción, categoría, marca, atributos) sin incurrir en costes de servicios de búsqueda externos.

## Decisión
Utilizar la extensión de búsqueda en texto completo **FTS5 de SQLite** integrada nativamente en Cloudflare D1 bajo la tabla `catalog_products_fts`, gestionada exclusivamente dentro del módulo `catalog`.


## Consecuencias operativas

- Las consultas de texto del catálogo convierten la entrada del usuario a términos prefijo FTS5 entrecomillados, limitados a ocho términos y unidos por AND. La puntuación y los operadores escritos por el usuario no se ejecutan como sintaxis FTS.
- Los resultados del índice FTS5 se ordenan por BM25; las coincidencias por marca siguen siendo una consulta separada y enlazada por parámetros.
- El buscador global ofrece autocompletado mediante `GET /api/v1/search/suggestions?q=...`. Solo devuelve productos publicados y campos públicos necesarios para la ficha compacta de sugerencias; no expone coste de proveedor ni objetivos internos de margen/ganancia.
- El autocompletado se implementa sin una nueva tabla ni un proveedor externo. Las sugerencias comienzan con dos caracteres, están limitadas a seis resultados en la respuesta pública y conservan el envío normal del formulario a `/productos?q=...`.
- Esta entrega cubre el autocompletado y la consulta FTS por prefijos. La expansión de búsqueda a categorías/atributos y la migración de filtros/ordenamiento a servidor con paginación coherente permanecen pendientes en la Fase 12.
