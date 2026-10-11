# ADR-0002: Framework del Storefront con SSR en Cloudflare Pages

- **Estado:** Propuesta (Aceptado en Fase 0)
- **Fecha:** Fase 0

## Contexto
La tienda pública exige rendimiento excepcional (Lighthouse >= 90) y renderizado completo en servidor (SSR) para indexación y SEO por motores de búsqueda.

## Decisión
Implementar el storefront en **Cloudflare Pages** utilizando **Astro con islas interactivas (React)**. El cliente de API para la tienda se generará automáticamente a partir del esquema OpenAPI del Worker BFF.
