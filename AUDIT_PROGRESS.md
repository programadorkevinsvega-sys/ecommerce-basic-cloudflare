# Progreso de auditoría integral

Actualizado: 2026-10-12 (hora Bogotá). Rama `main`. No se desplegó el Worker ni se ejecutaron migraciones remotas durante esta pasada.

## Fases

| Fase | Estado | Evidencia / alcance |
|---|---|---|
| Diagnóstico SQL y arquitectura | Completada en los archivos revisados | Inventario actualizado a 84 SQL (28 fuentes y 56 copias) y matriz en `docs/migrations/schema-audit.md`; aislamiento y arquitectura pasan. |
| Seguridad y operaciones | Correcciones adicionales implementadas | Sesiones HttpOnly sin exposición a JSON/localStorage, permisos también en datos SSR del panel y `GET /api/v1/settings`, ownership de invitados por cookie hasheada, CSRF/rate-limit, errores/logs redactados. No certifica todos los módulos ni entorno desplegado. |
| Migraciones | Runner y reproducción local completados | `apps/api/scripts/apply-migrations.js` ordena nombre de módulo y versión numérica. D1 Wrangler temporal vacía: 28 migraciones, segunda pasada idempotente y settings v1 antes de v2. Nueva v2 de orders pasó local; no se aplicó en remoto porque la API rechazó autenticación (Cloudflare 10000). |
| Wompi / pagos | Implementación y pruebas locales completadas | Checksum conforme al formato de evento, tolerancia de timestamp, consulta autenticada a API Wompi y comparación de id/referencia/importe/moneda; outbox y eventos idempotentes. Pruebas con API simulada y Worker local, sin credenciales ni evento sandbox real. |
| Media / R2 | Validaciones básicas implementadas | Tamaño, firma, extensión permitida, nombre, alt, tamaño escrito en R2 y compensación ante fallo D1. No hay decodificación completa, prueba R2 remota ni GC seguro de huérfanos. |
| Banners | Administración y presentación implementadas | Filtros aislados por búsqueda/estado/tipo/ubicación, duplicación inactiva, vista previa, validación URL, home/categoría/producto/checkout. Carrusel con controles de teclado y movimiento reducido; sin autoplay. Pendiente verificación visual/desplegada. |
| Reserva / Workers | Pruebas locales completadas | Worker real local con D1 para concurrencia de reservas, fallo de reserva desde OrdersController y webhook Wompi con llamada HTTP simulada. |
| Documentación / CI | Actualizada | README, seguridad, recuperación, manifiesto, workflow y este registro. |

## Cambios destacados de esta pasada

- Wompi: referencia estable por pedido para reutilizar transacciones pendientes; verifica firma del formato Wompi, entorno, secreto, tiempo, y reconcilia contra su API autenticada. Aplicación de webhook monotónica; los estados finales no se revierten y la salida se recupera de forma idempotente.
- Inventario/pagos: reserva D1 condicional, revisión de existencia y expiración de reservas activas antes del inicio del pago y recaudo; el fallo de reserva cancela pedido y devuelve conflicto.
- Seguridad BFF: middleware de CSRF basado en `Origin`/`Sec-Fetch-Site` y rate limits de Cloudflare para autenticación, checkout/pago y mutaciones; autenticación, ownership y permisos en rutas de facturación, inventario y auditoría revisadas.
- Sesiones: login de admin y cliente ya no retorna el token por JSON; se elimina su inyección en HTML/localStorage. El carrito y la cuenta leen la cookie `__Host-session` real. El panel no precarga settings/promos/envíos sin permiso.
- Pedidos invitados: `orders__0002_guest_cart_capability.sql` guarda hash de `vega_cart_id`; el pago y la página resultado requieren el cookie coincidente. D1 conserva null en pedidos anteriores; la v2 no se despliega sin revisar pedidos guest pendientes. El hash se omite de `Order.toJSON()`.
- Privacidad: los errores BFF no devuelven mensajes internos; `JsonLogger` redacciona campos personales, arrays, payloads y detalles de excepciones. Resend sin clave informa fallo en vez de simular entrega y no registra destinatarios.
- Carrusel/filtros: los filtros ahora consultan su contenedor explícito (antes tomaban inputs de los formularios de creación); los carruseles tienen botones accesibles y respetan `prefers-reduced-motion`.
- Media: el nombre del cliente no determina la clave R2. Si el guardado D1 falla, se elimina únicamente el objeto de clave aleatoria recién creado.
- Wrangler: se actualizó Wrangler 4 y el plugin Workers/Vitest mantenido; el runner ordenado evita la ejecución de `settings__0002` antes de `settings__0001` detectada con Wrangler 3.

## SQL

- Inventario registrado: 28 migraciones fuente y 56 copias generadas bajo `migrations/` y `apps/api/migrations/`.
- `orders__0002_guest_cart_capability.sql` agrega una columna nullable, solo dentro del prefijo de orders; no se modifican migraciones históricas.
- Upgrade SQLite: esquema completo y fixture legado pasan, incluyendo COD, realtime, storefront y pedido invitado previo preservado con capability NULL.
- Wrangler 4 temporal aplicó 28 archivos desde vacío y la segunda pasada fue idempotente. D1 remoto no pudo verificarse ni migrarse: `d1 info` y `d1 time-travel info` fallaron con Cloudflare API error 10000 autenticación.

## Verificaciones con resultado real

- `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` — pasó.
- `./node_modules/.bin/vitest run --config vitest.config.ts` desde `apps/api/` — 17 archivos, 40 pruebas pasaron.
- `./node_modules/.bin/vitest run --config vitest.workers.config.ts` desde `apps/api/` — 1 archivo, 7 pruebas pasaron con D1/Worker local, incluyendo roundtrip D1 del hash invitado. Requirió ejecución fuera del sandbox porque Miniflare abre localhost.
- `node apps/api/scripts/check-architecture.js` — pasó, máximo 200 líneas y capas/imports.
- `node apps/api/scripts/check-table-isolation.js` — pasó.
- `node scripts/check-migration-consistency.js` — copias coinciden.
- `python3 scripts/verify-migration-upgrades.py` — esquema nuevo y upgrade previo pasaron, 67 tablas.
- `node_modules/.bin/wrangler deploy --dry-run --config apps/api/wrangler.jsonc` — build/bindings pasó; no desplegó.
- `node apps/api/scripts/test-empty-d1-migrations.js` — pasó fuera del sandbox: 28 migraciones desde D1 vacía, `settings__0001` antes de `settings__0002` y segunda pasada idempotente.
- Los comandos `pnpm ...` no iniciaron por `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` en una ruta de store de solo lectura; se ejecutaron directamente los binarios disponibles. Vitest no está enlazado en el `.bin` raíz, por eso se invocó desde `apps/api`.

## Pendientes que impiden certificar producción

- Reactivar autenticación Wrangler para verificar backup/estado remoto y aplicar `orders__0002` en D1 remota. Ambos comandos read-only (`d1 info`, `d1 time-travel info`) devolvieron error Cloudflare 10000. No ejecutar deploy antes de aplicar/verificar la columna.
- Ejecutar evento de sandbox Wompi con credenciales de prueba y confirmar reconciliación contra API real; las pruebas locales usan un stub HTTP sin secretos.
- Confirmar en la cuenta Cloudflare destino que los IDs de los bindings de Rate Limiting sean únicos; la configuración pasa el dry-run, pero esa unicidad depende de la cuenta.
- Validación de imagen por decodificador completo/dimensiones y prueba R2 remota; referencias compartidas impiden borrar automáticamente objetos y no se implementó GC.
- Revisión manual/certificación exhaustiva de cada caso de uso/repositorio y de cada controlador. Se corrigieron riesgos hallados en las rutas revisadas, pero el conjunto completo requiere revisión adicional.
- MFA/reautenticación de acciones administrativas críticas, auditoría de todas las mutaciones, rate limits por actor/pedido, Turnstile, pruebas de carga y análisis de XSS/CSRF en navegador.
- Revisar el comportamiento del carrusel con lectores de pantalla/teclado en navegador y en tienda desplegada.
- No se hizo instalación limpia de dependencias, test de todos los flujos externos, despliegue, migración remota ni prueba real de pagos.

## Git

Commit `3c33f1c` (`Harden ecommerce security and guest order ownership`) publicado en `origin/main`. Este registro queda en un commit de seguimiento. Árbol sin archivos ajenos; no se incluyeron `.dev.vars`, credenciales ni temporales.
