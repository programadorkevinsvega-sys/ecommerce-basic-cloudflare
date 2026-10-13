# Progreso de auditoría integral

Actualizado: 2026-10-12. Rama `main`. No se desplegó el Worker ni se ejecutaron migraciones remotas durante esta pasada.

## Fases

| Fase | Estado | Evidencia / alcance |
|---|---|---|
| Diagnóstico SQL y arquitectura | Completada en los archivos revisados | Inventario de 81 SQL (27 fuentes y 54 copias) y matriz en `docs/migrations/schema-audit.md`; consistencia entre fuentes/copias, aislamiento de tablas y chequeo de arquitectura correctos. |
| Seguridad y operaciones | Implementada en rutas/casos revisados | Ownership en pedidos/facturas, permisos de auditoría/inventario/facturación, comprobación de reserva antes de cobrar, validación de Wompi, CSRF y rate limit nativo. No certifica todos los módulos ni entorno desplegado. |
| Migraciones | Runner y reproducción local completados | `apps/api/scripts/apply-migrations.js` ordena nombre de módulo y versión numérica. Base Wrangler local vacía: 27 migraciones, segunda pasada idempotente y settings v1 antes de v2. No se aplicó en remoto en esta pasada. |
| Wompi / pagos | Implementación y pruebas locales completadas | Checksum conforme al formato de evento, tolerancia de timestamp, consulta autenticada a API Wompi y comparación de id/referencia/importe/moneda; outbox y eventos idempotentes. Pruebas con API simulada y Worker local, sin credenciales ni evento sandbox real. |
| Media / R2 | Validaciones básicas implementadas | Tamaño, firma de tipo de imagen, extensión, nombre, texto alternativo, resultado de escritura R2 y compensación segura ante fallo D1. No hay verificación completa por decodificador, prueba contra R2 remoto ni GC de objetos huérfanos. |
| Banners | Administración y presentación implementadas | Búsqueda/filtros, duplicación inactiva, vista previa, validación de URL/tipo/fechas/ubicación, estados y vigencia públicos; home, categoría, producto y checkout filtran su propia ubicación. Confirmar accesibilidad avanzada del carrusel y escenarios de contenido reales antes de certificar. |
| Reserva / Workers | Pruebas locales completadas | Worker real local con D1 para concurrencia de reservas, fallo de reserva desde OrdersController y webhook Wompi con llamada HTTP simulada. |
| Documentación / CI | Actualizada | README, seguridad, recuperación, manifiesto, workflow y este registro. |

## Cambios destacados de esta pasada

- Wompi: referencia estable por pedido para reutilizar transacciones pendientes; verifica firma del formato Wompi, entorno, secreto, tiempo, y reconcilia contra su API autenticada. Aplicación de webhook monotónica; los estados finales no se revierten y la salida se recupera de forma idempotente.
- Inventario/pagos: reserva D1 condicional, revisión de existencia y expiración de reservas activas antes del inicio del pago y recaudo; el fallo de reserva cancela pedido y devuelve conflicto.
- Seguridad BFF: middleware de CSRF basado en `Origin`/`Sec-Fetch-Site` y rate limits de Cloudflare para autenticación, checkout/pago y mutaciones; autenticación, ownership y permisos en rutas de facturación, inventario y auditoría revisadas.
- Media: el nombre del cliente no determina la clave R2. Si el guardado D1 falla, se elimina únicamente el objeto de clave aleatoria recién creado.
- Wrangler: se actualizó Wrangler 4 y el plugin Workers/Vitest mantenido; el runner ordenado evita la ejecución de `settings__0002` antes de `settings__0001` detectada con Wrangler 3.

## SQL

- Inventario completo registrado en `docs/migrations/schema-audit.md`: 27 archivos fuente canónicos y 54 copias generadas bajo `migrations/` y `apps/api/migrations/`.
- Migraciones de arreglos COD/realtime de la pasada anterior continúan registradas en el manifiesto. No se agregó DDL en esta pasada.
- La prueba de upgrade SQLite cubrió 67 tablas en esquema vacío y fixture previo, incluyendo backfill de fecha COD y preservación del estado leído.
- El runner local Wrangler 4 aplicó 27 nombres de migración a una base temporal y la segunda ejecución no generó cambios. Ninguna migración de producción se ejecutó esta vez.

## Verificaciones con resultado real

- `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` — pasó.
- `apps/api/node_modules/.bin/vitest run --config vitest.config.ts` — 11 archivos, 28 pruebas pasaron.
- `WRANGLER_LOG_PATH=/tmp/wrangler-logs node_modules/.bin/vitest run --config vitest.workers.config.ts` — 1 archivo, 6 pruebas pasaron con D1/Worker local.
- `node apps/api/scripts/check-architecture.js` — pasó, máximo 200 líneas y capas/imports.
- `node apps/api/scripts/check-table-isolation.js` — pasó.
- `node scripts/check-migration-consistency.js` — copias coinciden.
- `python3 scripts/verify-migration-upgrades.py` — esquema nuevo y upgrade previo pasaron, 67 tablas.
- `node_modules/.bin/wrangler deploy --dry-run --config apps/api/wrangler.jsonc` — build/bindings pasó anteriormente; no desplegó.
- El test de migraciones Wrangler desde base vacía y segunda pasada pasó anteriormente en esta misma revisión.
- Los comandos `pnpm ...` no iniciaron por `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` en una ruta de store de solo lectura; se ejecutaron directamente los binarios disponibles. Vitest no está enlazado en el `.bin` raíz, por eso se invocó desde `apps/api`.

## Pendientes que impiden certificar producción

- Ejecutar evento de sandbox Wompi con credenciales de prueba y confirmar reconciliación contra API real; las pruebas locales usan un stub HTTP sin secretos.
- Confirmar en la cuenta Cloudflare destino que los IDs de los bindings de Rate Limiting sean únicos; la configuración pasa el dry-run, pero esa unicidad depende de la cuenta.
- Validación de imagen por decodificador completo/dimensiones y prueba R2 remota; referencias compartidas impiden borrar automáticamente objetos y no se implementó GC.
- Revisión manual/certificación exhaustiva de cada caso de uso/repositorio y de cada controlador. Se corrigieron riesgos hallados en las rutas revisadas, pero el conjunto completo requiere revisión adicional.
- MFA/reautenticación de acciones administrativas críticas, auditoría de todas las mutaciones, rate limits por actor/pedido, Turnstile, pruebas de carga y análisis de XSS/CSRF en navegador.
- Revisar el comportamiento del carrusel con lectores de pantalla, teclado y `prefers-reduced-motion` en la tienda desplegada.
- No se hizo instalación limpia de dependencias, test de todos los flujos externos, despliegue, migración remota ni prueba real de pagos.

## Git

Commit `8fc3cc8` (`Harden payments, migrations, media and storefront`) publicado a `origin/main`. Rama `main`; árbol de trabajo limpio tras publicar. No se incluyeron `.dev.vars`, credenciales ni archivos temporales.
