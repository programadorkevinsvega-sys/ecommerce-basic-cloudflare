# ADR-0030: Invalidación inmediata de Workers Cache para contenido público

- **Estado:** Aceptada
- **Fecha:** 2026-10-15

## Contexto

El HTML SSR cacheado puede incluir precios, promociones, existencias, reseñas y contenido administrable. El TTL corto reduce el impacto de datos obsoletos, pero no sustituye invalidar el contenido al confirmar una escritura.

## Decisión

- Cada respuesta HTML pública cacheable se etiqueta `storefront-public-html` con `Cache-Tag`.
- Tras completar correctamente una mutación de admin, cambios de inventario por pedido, confirmaciones Wompi o creación de reseñas, el middleware del BFF llama `ctx.cache.purge({ tags: ['storefront-public-html'] })` antes de responder.
- El Cron purga la misma etiqueta cuando publica artículos programados.
- Las respuestas de sesión, administración y transacción continúan fuera de caché. El checkout sigue recalculando precios, inventario, descuentos y condiciones desde fuentes autoritativas.
- Si el purge falla después de que una escritura ya se confirmó, la respuesta de negocio no se revierte; se registra `cache.public_html_invalidation_failed` y el TTL de 30 segundos funciona como recuperación acotada.

## Consecuencias

La invalidación es global para el HTML público y puede expulsar páginas que no cambiaron; las mutaciones son poco frecuentes y la etiqueta común reduce el riesgo de dejar variantes o páginas relacionadas obsoletas. No requiere token externo, migración D1 ni binding KV. Cloudflare limita el purge al caché y entrypoint de este Worker.

## Recuperación

Un rollback conserva la separación de caché por versión del Worker. Ante fallos repetidos del purge, revisar los logs JSON del evento indicado y mantener el TTL corto hasta corregir la causa.

## Evidencia de despliegue

El cambio se desplegó el 2026-10-15 en el Worker `658dcbcb-44b9-45c0-9e08-b1d74a519eed` (commit `48003b2`). Typecheck, lint de arquitectura, `git diff --check` y Wrangler dry-run pasaron. En producción, la ficha de producto devolvió primero `MISS` y luego `HIT`. No se realizó una mutación autenticada real para verificar el purge completo; el primer evento operativo debe confirmar su ejecución y ausencia de `cache.public_html_invalidation_failed`.
