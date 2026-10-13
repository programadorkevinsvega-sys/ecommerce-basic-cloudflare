# Progreso de auditoría integral

Actualizado: 2026-10-13 (hora Bogotá). Rama `main`. Se aplicaron migraciones aditivas remotas. El commit `4743bc1` está publicado y desplegado como versión `89aa891e-569b-4739-ba0b-b3961eb63160`, con D1/KV/Queue/R2 y los tres rate limiters ligados. `/health` devolvió 200; las rutas administrativas de inventario devolvieron 401 sin sesión.

## Fases

| Fase | Estado | Evidencia / alcance |
|---|---|---|
| Diagnóstico SQL y arquitectura | Completada en los archivos revisados | Inventario actualizado a 87 SQL (29 fuentes y 58 copias) y matriz en `docs/migrations/schema-audit.md`; aislamiento y arquitectura pasan. |
| Seguridad y operaciones | Correcciones adicionales implementadas; revisión integral pendiente | Sesiones HttpOnly sin exposición a JSON/localStorage, permisos también en datos SSR del panel y `GET /api/v1/settings`, ownership de invitados por cookie hasheada, CSRF/rate-limit, errores/logs redactados. En esta pasada se corrigió que GET inventario escribiera sin permiso de ajuste. No certifica todos los módulos. |
| Migraciones | Runner y reproducción local/remota completados | Runner ordena módulo/versión. D1 vacía: 29 migraciones, segunda pasada idempotente, settings v1 antes de v2. `orders__0002` e `inventory__0002` se aplicaron y verificaron en producción con Wrangler 4. |
| Wompi / pagos | Firma y API real verificadas; pruebas de comercio sin conciliar | El usuario confirma que los 4 intentos pendientes de 2 pedidos son transacciones de prueba propias; no corresponden a clientes y no requieren conciliación operativa. El endpoint oficial de seguimiento consulta por ID, ausente en esos registros. El webhook histórico firmado y la autenticación a API real fueron verificados en producción. |
| MFA administrativo | Riesgo crítico confirmado en producción | Lectura agregada de `identity_admins`: 1 administrador y `mfa_enabled=0`. `LoginAdminUseCase` solo pide TOTP cuando MFA ya está activo. No se encontró flujo UI/API para enrolar MFA; no se cambió el login para evitar bloquear al administrador actual. |
| Media / R2 | Validación estructural, límites y binding R2 verificados | Parser de PNG/JPEG/WebP/AVIF con dimensiones y topes 10 MiB/16.384 px/40 MP; body multipart limitado también en streaming, validación de HEAD antes de D1 y rollback de clave temporal si falla. D1/R2 local integra con dimensiones. Smoke remoto aislado subió/descargó/igualó/borró un objeto temporal. Pendientes: decodificación completa, eliminación EXIF/GPS y GC seguro de huérfanos. |
| Banners | Administración y presentación implementadas | Filtros aislados por búsqueda/estado/tipo/ubicación, duplicación inactiva, vista previa, validación URL, home/categoría/producto/checkout. Carrusel con controles de teclado y movimiento reducido; sin autoplay. Pendiente verificación visual en navegador. |
| Reserva / Workers | Pruebas locales completadas | Worker real local con D1 para concurrencia/idempotencia de consumo, reserva ausente, compatibilidad de ventas históricas, fallo de reserva desde OrdersController y webhook Wompi con llamada HTTP simulada. |
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
- Reconciliación de ventas antiguas: el código reconoce reservas confirmadas junto con movimientos `sale` coincidentes y crea una marca de idempotencia sin modificar existencias; replay local cubierto por prueba Worker.
- Upgrade SQLite: esquema completo y fixture legado pasan, incluyendo COD, realtime, storefront y pedido invitado previo preservado con capability NULL.
- Wrangler 4 temporal aplicó 29 archivos desde vacío y la segunda pasada fue idempotente. Producción: las migraciones de orders v2 e inventory v2 se aplicaron con el runner y se confirmaron en el ledger. La consulta posterior confirmó `guest_cart_id_hash`, la tabla de consumos vacía y las 8 órdenes guest pendientes sin cambios.

## Verificaciones con resultado real

- `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` — pasó.
- `./node_modules/.bin/vitest run --config vitest.config.ts` desde `apps/api/` — 18 archivos, 46 pruebas pasaron después de añadir parsing de imágenes, límite de body, verificación `R2.head()` y autorización de sincronización de inventario.
- `./node_modules/.bin/vitest run --config vitest.workers.config.ts` desde `apps/api/` — 3 archivos, 12 pruebas pasaron con D1/Worker local, incluyendo webhook aprobado reejecutado, consumo único, rechazo por falta de reserva, venta legacy y persistencia/lectura de medios con el binding R2 local. Requirió ejecución fuera del sandbox porque Miniflare abre localhost.
- `node apps/api/scripts/check-architecture.js` — pasó, máximo 200 líneas y capas/imports.
- `node apps/api/scripts/check-table-isolation.js` — pasó.
- `node scripts/check-migration-consistency.js` — copias coinciden.
- `python3 scripts/verify-migration-upgrades.py` — esquema nuevo y upgrade previo pasaron, incluida preservación de existencias al aplicar inventory v2; 68 tablas.
- `node_modules/.bin/wrangler deploy --dry-run --config apps/api/wrangler.jsonc` — build/bindings pasó; no desplegó.
- `node apps/api/scripts/test-empty-d1-migrations.js` — pasó fuera del sandbox: 29 migraciones desde D1 vacía, `settings__0001` antes de `settings__0002`, tabla de consumos y segunda pasada idempotente.
- Wrangler remoto `d1 info`, `d1 time-travel info`, lectura de ledger/schema/orders agregada, `apply-migrations.js --remote` y verificación posterior — orders v2 e inventory v2 aplicadas y confirmadas. Orders bookmark previo/posterior: `000001d5-00000096-00005103-6f289f94e530fd566d8b691355450464` / `000001d5-000000a6-00005103-a4dfd09e2d19e6db5e71c647017dbae2`. Inventory bookmark previo/posterior: `000001d5-000000ba-00005103-eb91d48b70aea4fec605c7d2d20c96ad` / `000001d5-000000c8-00005103-d2640c92983f646d012ce00d26d099ca`.
- Los comandos `pnpm ...` no iniciaron por `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` en una ruta de store de solo lectura; se ejecutaron directamente los binarios disponibles. Vitest no está enlazado en el `.bin` raíz, por eso se invocó desde `apps/api`.
- Prueba puntual tras corregir replay de Wompi: `vitest run tests/payment-idempotency.test.ts` — 2 pruebas pasaron, incluida la no emisión de outbox para un pago ya aprobado. `tsc --noEmit -p tsconfig.json`, arquitectura y `git diff --check` pasaron para el cambio.
- R2 remoto: Wrangler 4 subió `audit-smoke/<id>.png` al bucket configurado, lo descargó y `cmp` confirmó igualdad byte por byte; se borró solo esa clave aleatoria y un GET posterior confirmó que ya no existe. No se tocaron otros objetos.
- Producción SSR: `/`, `/productos`, `/admin/login` y `/health` devolvieron HTTP 200. Es verificación HTTP/HTML; no equivale a inspección visual en navegador.
- Auditoría de inventario: `GET /api/v1/admin/inventory` ahora es de solo lectura; inicializar artículos ausentes pasó a `POST /api/v1/admin/inventory/sync`, con permiso `inventory:adjust` y registro por artículo en audit. Prueba cubre anónimo, permiso de lectura, denegación de escritura y evento auditado.
- Wrangler producción consultó solo el agregado de MFA (sin leer emails ni secretos): `identity_admins` tiene 1 administrador con `mfa_enabled=0`; el login actual permite autenticarse sin TOTP para esa cuenta. Requiere enrolamiento y política de obligatoriedad antes de certificar seguridad administrativa.
- Despliegue integrado: commit `4743bc1` apareció en Wrangler como versión `89aa891e-569b-4739-ba0b-b3961eb63160`. `GET /api/v1/admin/inventory` y `POST /api/v1/admin/inventory/sync` sin sesión respondieron 401; `/health` reportó D1/KV/Queue/R2 saludables.
- Sin decodificador visual disponible: no hay Chromium, Playwright ni Puppeteer instalados en el entorno, por lo que no se certificaron el diseño visual ni los estados admin autenticados en navegador.

## Pendientes que impiden certificar producción

- Quedan 4 transacciones Wompi pendientes en datos de prueba propios según confirmación del usuario. No se modificaron ni se intentaron cargos/reconciliaciones. No se consideran evidencia de pagos de clientes.
- Aunque los secretos `WOMPI_*` existen en Cloudflare, sus valores no son recuperables por Wrangler. Se verificó un webhook histórico firmado en producción y la llamada autenticada a la API de Wompi; todavía falta una transacción sandbox nueva de extremo a extremo. La repetición creó una fila `payments_outbox_events` pendiente aunque el pago no cambió. Esa fila se conserva para auditoría; el outbox de pagos no está conectado al relay cron actual y el código corregido ya no emitirá filas redundantes en replays posteriores.
- El despliegue se activó automáticamente con el push a `main` (Cloudflare); GitHub Actions en este repositorio ejecuta verificaciones, no contiene un paso `wrangler deploy`. Revisar la versión y salud tras cada push.
- Las 8 órdenes invitadas antiguas sin capability son datos de prueba propios según la aclaración del usuario; siguen sin acceso por capability. No se modificaron.
- El parser no decodifica completamente los píxeles y aún no elimina EXIF/GPS. No se implementó GC; los objetos compartidos no deben borrarse automáticamente.
- Confirmar evento Wompi de sandbox con una transacción nueva; integración Worker local usa API HTTP simulada. El webhook histórico real verificó la firma y API autenticada, pero no reemplaza una transacción sandbox de extremo a extremo.
- Revisión manual/certificación exhaustiva de cada caso de uso/repositorio y de cada controlador. Se corrigieron riesgos hallados en las rutas revisadas, pero el conjunto completo requiere revisión adicional.
- MFA obligatorio/enrolamiento, reautenticación de acciones administrativas críticas, auditoría exhaustiva de mutaciones, rate limits por actor/pedido, Turnstile, pruebas de carga y análisis de XSS/CSRF en navegador.
- Revisar el comportamiento del carrusel con lectores de pantalla/teclado en navegador y en tienda desplegada.
- La inspección visual de Home, catálogo, login y panel admin sigue pendiente porque el entorno no incluye un navegador gráfico; solo se validaron los estados HTTP/SSR y pruebas de markup.
- No se hizo instalación limpia de dependencias, ni test de todos los flujos externos o prueba sandbox de pago end-to-end. Los pushes activan despliegue integrado, pero no se ejecutó `wrangler deploy` manualmente. `orders__0002` e `inventory__0002` sí se aplicaron remotamente y se verificaron.

## Git

Commits `4a25cae` y `e4e15bd` se publicaron en `origin/main`; commits recientes incluyen `a96aaaf`, `013f784`, `75fa3f7` y `4743bc1`. Este último está desplegado como versión `89aa891e-569b-4739-ba0b-b3961eb63160`; el healthcheck está saludable. Nunca se ejecutó `wrangler deploy`. No se incluyeron `.dev.vars`, credenciales ni temporales.
