# ADR-0006: Motor de Búsqueda con D1 FTS5

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
Se requiere permitir a los clientes buscar productos por texto libre (nombre, descripción, categoría, marca, atributos) sin incurrir en costes de servicios de búsqueda externos.

## Decisión
Utilizar la extensión de búsqueda en texto completo **FTS5 de SQLite** integrada nativamente en Cloudflare D1 bajo la tabla `catalog_products_fts`, gestionada exclusivamente dentro del módulo `catalog`.
