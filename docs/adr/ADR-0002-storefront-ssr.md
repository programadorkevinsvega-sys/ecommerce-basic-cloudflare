# ADR-0002: Framework del Storefront con SSR en Cloudflare Pages

- **Estado:** Diseño propuesto originalmente; no corresponde a la implementación actual
- **Fecha:** Fase 0

## Contexto
La tienda pública exige rendimiento excepcional (Lighthouse >= 90) y renderizado completo en servidor (SSR) para indexación y SEO por motores de búsqueda.

## Decisión
Implementar el storefront en **Cloudflare Pages** utilizando **Astro con islas interactivas (React)**. El cliente de API para la tienda se generará automáticamente a partir del esquema OpenAPI del Worker BFF.

## Estado de implementación (2026-10-15)

La propuesta Astro/Cloudflare Pages no se materializó en el repositorio actual. Las rutas SSR del storefront y el dashboard de administración se sirven desde el Worker Hono; `apps/storefront` y `apps/admin` no son los frontends desplegados. Si se retoma Pages/Astro, se debe aprobar una decisión actualizada y documentar compatibilidad de releases en `ROLLBACK_RECOVERY.md`.
