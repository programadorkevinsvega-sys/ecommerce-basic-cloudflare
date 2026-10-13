# Progreso de auditoría integral

Actualizado: 2026-10-13 (hora Bogotá). Rama `main`. Se aplicaron migraciones aditivas remotas autorizadas; no se desplegó el Worker.

## Fases

| Fase | Estado | Evidencia / alcance |
|---|---|---|
| Diagnóstico SQL y arquitectura | Completada en los archivos revisados | Inventario actualizado a 87 SQL (29 fuentes y 58 copias) y matriz en `docs/migrations/schema-audit.md`; aislamiento y arquitectura pasan. |
| Seguridad y operaciones | Correcciones adicionales implementadas | Sesiones HttpOnly sin exposición a JSON/localStorage, permisos también en datos SSR del panel y `GET /api/v1/settings`, ownership de invitados por cookie hasheada, CSRF/rate-limit, errores/logs redactados. No certifica todos los módulos ni entorno desplegado. |
| Migraciones | Runner y reproducción local/remota completados | Runner ordena módulo/versión. D1 vacía: 29 migraciones, segunda pasada idempotente, settings v1 antes de v2. `orders__0002` e `inventory__0002` se aplicaron y verificaron en producción con Wrangler 4. |
| Wompi / pagos | Implementación y pruebas locales completadas | Checksum conforme al formato de evento, tolerancia de timestamp, consulta autenticada a API Wompi y comparación de id/referencia/importe/moneda. Worker prueba una aprobación realista, reconciliación HTTP simulada y replay; errores de inventario/factura hacen fallar el webhook para reintento. Sin credenciales ni evento sandbox real. |
| Media / R2 | Validación y prueba local de binding implementadas | Tamaño, firma, extensión permitida, nombre, alt, tamaño escrito en R2 y compensación ante fallo D1. Worker local prueba upload y lectura vía D1/R2; no hay decodificación completa de imagen, prueba R2 remota ni GC seguro de huérfanos. |
| Banners | Administración y presentación implementadas | Filtros aislados por búsqueda/estado/tipo/ubicación, duplicación inactiva, vista previa, validación URL, home/categoría/producto/checkout. Carrusel con controles de teclado y movimiento reducido; sin autoplay. Pendiente verificación visual/desplegada. |
| Reserva / Workers | Pruebas locales completadas | Worker real local con D1 para concurrencia/idempotencia de consumo, reserva ausente, fallo de reserva desde OrdersController y webhook Wompi con llamada HTTP simulada. |
| Documentación / CI | Actualizada | README, seguridad, recuperación, manifiesto, workflow y este registro. |

## Cambios destacados de esta pasada

- Wompi: referencia estable por pedido para reutilizar transacciones pendientes; verifica firma del formato Wompi, entorno, secreto, tiempo, y reconcilia contra su API autenticada. Aplicación de webhook monotónica; los estados finales no se revierten y la salida se recupera de forma idempotente.
- Inventario/pagos: reserva D1 condicional, revisión de existencia y expiración de reservas activas antes del inicio del pago y recaudo; el fallo de reserva cancela pedido y devuelve conflicto.
- Seguridad BFF: middleware de CSRF basado en `Origin`/`Sec-Fetch-Site` y rate limits de Cloudflare para autenticación, checkout/pago y mutaciones; autenticación, ownership y permisos en rutas de facturación, inventario y auditoría revisadas.
- Sesiones: login de admin y cliente ya no retorna el token por JSON; se elimina su inyección en HTML/localStorage. El carrito y la cuenta leen la cookie `__Host-session` real. El panel no precarga settings/promos/envíos sin permiso.
- Pedidos invitados: `orders__0002_guest_cart_capability.sql` guarda hash de `vega_cart_id`; el pago y la página resultado requieren el cookie coincidente. D1 conserva null en pedidos anteriores. Se identificaron 8 pedidos guest pendientes (3 Wompi y 5 COD); conciliar Wompi y resolver el manejo de pedidos legacy antes del deploy. El hash se omite de `Order.toJSON()`.
- Privacidad: los errores BFF no devuelven mensajes internos; `JsonLogger` redacciona campos personales, arrays, payloads y detalles de excepciones. Resend sin clave informa fallo en vez de simular entrega y no registra destinatarios.
- Carrusel/filtros: los filtros ahora consultan su contenedor explícito (antes tomaban inputs de los formularios de creación); los carruseles tienen botones accesibles y respetan `prefers-reduced-motion`.
- Media: el nombre del cliente no determina la clave R2. Si el guardado D1 falla, se elimina únicamente el objeto de clave aleatoria recién creado.
- Wrangler: se actualizó Wrangler 4 y el plugin Workers/Vitest mantenido; el runner ordenado evita la ejecución de `settings__0002` antes de `settings__0001` detectada con Wrangler 3.

## SQL

- Inventario registrado: 29 migraciones fuente y 58 copias generadas bajo `migrations/` y `apps/api/migrations/`.
- `orders__0002_guest_cart_capability.sql` agrega una columna nullable, solo dentro del prefijo de orders; no se modifican migraciones históricas.
- `inventory__0002_idempotent_order_consumption.sql` agrega la tabla con PK `(order_id, product_id)` y un índice; no modifica existencias existentes y los errores de reserva no crean consumos. Aplicada remotamente; tabla verificada vacía al aplicar.
- Upgrade SQLite: esquema completo y fixture legado pasan, incluyendo COD, realtime, storefront y pedido invitado previo preservado con capability NULL.
- Wrangler 4 temporal aplicó 29 archivos desde vacío y la segunda pasada fue idempotente. Producción: las migraciones de orders v2 e inventory v2 se aplicaron con el runner y se confirmaron en el ledger. La consulta posterior confirmó `guest_cart_id_hash`, la tabla de consumos vacía y las 8 órdenes guest pendientes sin cambios.

## Verificaciones con resultado real

- `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` — pasó.
- `./node_modules/.bin/vitest run --config vitest.config.ts` desde `apps/api/` — 17 archivos, 40 pruebas pasaron.
- `./node_modules/.bin/vitest run --config vitest.workers.config.ts` desde `apps/api/` — 3 archivos, 11 pruebas pasaron con D1/Worker local, incluyendo webhook aprobado reejecutado, consumo único, rechazo por falta de reserva y persistencia/lectura de medios con el binding R2 local. Requirió ejecución fuera del sandbox porque Miniflare abre localhost.
- `node apps/api/scripts/check-architecture.js` — pasó, máximo 200 líneas y capas/imports.
- `node apps/api/scripts/check-table-isolation.js` — pasó.
- `node scripts/check-migration-consistency.js` — copias coinciden.
- `python3 scripts/verify-migration-upgrades.py` — esquema nuevo y upgrade previo pasaron, incluida preservación de existencias al aplicar inventory v2; 68 tablas.
- `node_modules/.bin/wrangler deploy --dry-run --config apps/api/wrangler.jsonc` — build/bindings pasó; no desplegó.
- `node apps/api/scripts/test-empty-d1-migrations.js` — pasó fuera del sandbox: 29 migraciones desde D1 vacía, `settings__0001` antes de `settings__0002`, tabla de consumos y segunda pasada idempotente.
- Wrangler remoto `d1 info`, `d1 time-travel info`, lectura de ledger/schema/orders agregada, `apply-migrations.js --remote` y verificación posterior — orders v2 e inventory v2 aplicadas y confirmadas. Orders bookmark previo/posterior: `000001d5-00000096-00005103-6f289f94e530fd566d8b691355450464` / `000001d5-000000a6-00005103-a4dfd09e2d19e6db5e71c647017dbae2`. Inventory bookmark previo/posterior: `000001d5-000000ba-00005103-eb91d48b70aea4fec605c7d2d20c96ad` / `000001d5-000000c8-00005103-d2640c92983f646d012ce00d26d099ca`.
- Los comandos `pnpm ...` no iniciaron por `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` en una ruta de store de solo lectura; se ejecutaron directamente los binarios disponibles. Vitest no está enlazado en el `.bin` raíz, por eso se invocó desde `apps/api`.

## Pendientes que impiden certificar producción

- Antes de desplegar el código nuevo, conciliar los 3 pedidos Wompi pendientes y decidir tratamiento de las 8 órdenes guest sin capability. El Worker no se desplegó; la columna aditiva ya existe en D1.
- Ejecutar evento de sandbox Wompi con credenciales de prueba y confirmar reconciliación contra API real; las pruebas locales usan un stub HTTP sin secretos.
- Confirmar en la cuenta Cloudflare destino que los IDs de los bindings de Rate Limiting sean únicos; la configuración pasa el dry-run, pero esa unicidad depende de la cuenta.
- Validación de imagen por decodificador completo/dimensiones y prueba R2 remota; la integración de binding se hizo solo local. Referencias compartidas impiden borrar automáticamente objetos y no se implementó GC.
- Confirmar evento Wompi de sandbox contra endpoint real con credenciales de prueba; integración Worker local usa API HTTP simulada. Reconciliación y retries permanecen dependientes de la disponibilidad y reintentos reales del proveedor.
- Revisión manual/certificación exhaustiva de cada caso de uso/repositorio y de cada controlador. Se corrigieron riesgos hallados en las rutas revisadas, pero el conjunto completo requiere revisión adicional.
- MFA/reautenticación de acciones administrativas críticas, auditoría de todas las mutaciones, rate limits por actor/pedido, Turnstile, pruebas de carga y análisis de XSS/CSRF en navegador.
- Revisar el comportamiento del carrusel con lectores de pantalla/teclado en navegador y en tienda desplegada.
- No se hizo instalación limpia de dependencias, test de todos los flujos externos, despliegue ni prueba real de pagos. `orders__0002` sí se aplicó remotamente y se verificó.

## Git

Commits `3c33f1c`, `ea4ecd5` y `fdb87f7` están publicados en `origin/main`. La implementación inventory/Wompi/R2 y su registro se publicarán en un commit de seguimiento de esta pasada. No se incluyeron `.dev.vars`, credenciales ni temporales.
