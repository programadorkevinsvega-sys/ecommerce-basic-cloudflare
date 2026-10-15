# Rollback y recuperación del Ecommerce

## Estado

**Estado de preparación: PENDIENTE.** Este documento define el procedimiento objetivo. No afirma que staging, backups/restauración de D1, Queues, DLQ, métricas avanzadas ni endpoints de salud estén configurados o probados. El estado real del despliegue y los comandos disponibles se describen en [`README.md`](./README.md) y en el registro de migraciones [`docs/migrations/manifest.md`](./docs/migrations/manifest.md) (se crea en la Fase 0 del [`ROADMAP.md`](./ROADMAP.md)).

> **Jerarquía de documentos:** la arquitectura (Worker único, D1 única con tablas por módulo, Gateways, Queues, outbox) se rige por [`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md). Los controles de seguridad que afectan a la recuperación están en [`SECURITY_RULES.md`](./SECURITY_RULES.md). Este documento no relaja ninguna de esas reglas.

## Objetivo

Recuperar una versión estable del sistema sin crear incompatibilidades con D1, sin perder ni corromper objetos de R2, y **sin duplicar ni perder dinero, pedidos, stock o correos**. Como el sistema usa Queues, Cron, caché y un proveedor de pagos externo, la recuperación también debe mantener la compatibilidad de mensajes, consumidores y estado de las transacciones.

## Qué se despliega (y por tanto qué puede necesitar rollback)

| Componente | Rollback propio | Observaciones |
|---|---|---|
| **Worker único** (BFF + módulos) | Sí, por versión/deployment | No deshace D1, R2, KV ni Queues |
| **Interfaz de tienda y admin** | Viaja actualmente dentro del Worker | La UI actual es renderizada por el Worker; `apps/admin` es placeholder. Si más adelante se despliega Pages, deberá documentarse su deployment independiente |
| **D1 única** | No automático | Migraciones por módulo; restauración es una operación aparte |
| **R2** (medios y documentos) | No | Nunca se borra para "revertir" |
| **KV / Cache API** | Revisar/invalidate solo si el release las usa | El binding KV está configurado, pero no se encontró uso generalizado de caché en el código revisado |
| **Queues + DLQ** | No | Mensajes ya publicados siguen existiendo |
| **Cron Triggers** | Con el Worker | Pausar si el cambio los afecta |
| **Durable Objects** (si existen) | Limitado | Cambios de clase/migración de DO son delicados |
| **Wompi / Resend** | Configuración externa | Wompi recibe webhook; Resend se usa para correo. No cambiar claves sin plan de rotación. |

## Principios obligatorios

1. El rollback de aplicación debe ser reversible y tener un responsable y un deployment estable identificado.
2. Las migraciones D1 deben ser **backward-compatible** durante la ventana en que la versión anterior podría volver a activarse.
3. Una migración destructiva no se ejecuta en el mismo release que necesita poder volver al código anterior.
4. D1 no se considera automáticamente reversible: restaurar o reconstruir datos es una operación independiente, con análisis de pérdida de escrituras.
5. Staging valida el procedimiento antes de habilitarlo en producción.
6. R2 no se revierte borrando objetos nuevos por defecto.
7. **Los pagos se reconcilian, no se "deshacen":** el estado de verdad del dinero está en Wompi. Tras cualquier incidente se reconcilia contra Wompi antes de reanudar.
8. No declarar rollback probado hasta conservar evidencia del ensayo y verificar salud y flujos críticos (incluido un pago de sandbox).
9. Respetar el aislamiento por módulo: las migraciones y reparaciones de un módulo solo tocan tablas de su prefijo (ADR-0001).

La migración `orders__0007_shipping_charge_mode.sql` agrega valores por defecto `included` / `0`; al volver a la versión anterior conservar ambas columnas y no reescribir pedidos. La opción de cobro del flete en entrega requiere una cotización y un recaudo proveedor que se pueda conciliar antes de habilitarla; el rollback de aplicación no cancela guías ni recaudos ya creados.

`orders__0008_shipping_fulfillment_method.sql` agrega `shipping_fulfillment_method` con default `legacy`. Los pedidos nuevos guardan `merchant_local` o `carrier`, calculados por el servidor desde la zona validada. Versiones anteriores del Worker omiten la columna y siguen escribiendo `legacy`. Para rollback de aplicación, conservar columna y valores; no reclasificar pedidos anteriores automáticamente ni eliminar la columna.

`shipping__0006_medellin_metropolitan_local_delivery.sql` conserva inactivas las zonas locales anteriores de Bogotá y Cali y configura la zona activa de Medellín con los diez municipios del Valle de Aburrá. Un rollback del Worker no reactiva esas zonas ni repone Rionegro; restaurar esa cobertura solo mediante un cambio operativo explícito en Admin, tras confirmar origen y capacidad de entrega local.

## Estrategia de release

### Orden de migraciones D1 con Wrangler

Wrangler 3 puede ordenar mal archivos con nombres prefijados `<módulo>__NNNN` al arrancar una base vacía (por ejemplo `settings__0002` antes de `settings__0001`). Aplicar migraciones locales/remotas usando el runner `apps/api/scripts/apply-migrations.js`, que ordena módulo y versión numérica y registra los mismos nombres en `d1_migrations`; no invoque `wrangler d1 migrations apply` con Wrangler 3 sobre una base vacía. El modo remoto exige `ALLOW_REMOTE_D1_MIGRATIONS=1` explícito. Antes de un cambio remoto, respaldar/inspeccionar D1 y usar el procedimiento de release de abajo. Para una ejecución local reproducible: `pnpm db:test-wrangler-migrations`; hace una primera aplicación y una segunda pasada sobre una D1 temporal. No crea ni borra una D1 remota.

`inventory__0002_idempotent_order_consumption.sql` registra los consumos por `(order_id, product_id)` y permite reintentar webhooks sin volver a descontar existencias. Es una migración aditiva; no tiene down migration ni se debe borrar la tabla durante rollback. Para recuperar una versión anterior del Worker, conservar la tabla y el ledger. Si se revierte el Worker antes de volver a desplegar el código compatible, no se elimina el esquema: el código nuevo la necesita para contabilizar confirmaciones. En reintentos por inventario insuficiente, corregir/reservar el inventario y dejar que Wompi reenvíe el evento firmado; no insertar filas manualmente en la tabla de consumos.

En este repositorio Cloudflare Workers Builds está integrado con `main`: el push publica automáticamente el Worker. GitHub Actions ejecuta CI, pero no contiene el paso de despliegue. Después de cada push, verificar `wrangler deployments list` y `/health`; un rollback operativo debe detener primero nuevos pushes/despliegues y seguir el procedimiento de release de abajo. No hacer un deploy manual adicional si el push ya activó el build.

### Precio y snapshots fiscales

`catalog__0004_product_pricing.sql`, `orders__0003_pricing_snapshots.sql` e `invoicing__0002_tax_included.sql` solo agregan columnas y no modifican pedidos, facturas, precios ni filas existentes. `pricing_version=1` conserva el cálculo previo; productos nuevos/recalculados pasan a versión 2. El código antiguo ignora las columnas nuevas, de modo que se puede volver a la versión anterior del Worker conservando D1. Las migraciones no tienen down migration. No borrar ni recalcular snapshots históricos. Una conversión masiva de catálogo requiere previsualizar el precio resultante por producto, guardar el precio anterior y validar promociones activas antes de ejecutarla; no se ejecutó una conversión masiva.

`transaction_fee_cents` registra el cargo fijo de $700 de Wompi cobrado al comprador en pedidos nuevos online; los pedidos previos permanecen en cero. `orders__0004_checkout_transaction_fee.sql` es aditiva. Si se revierte el Worker, los pedidos históricos y la columna se conservan; no eliminar la columna durante rollback. `estimated_payment_fee_cents` es una estimación comercial. No representa liquidación real de Wompi y no debe usarse como asiento contable. Una conciliación real requiere conservar el reporte/identificador de liquidación que sustenta cada importe.

`payments__0004_settlement_costs.sql` agrega una tabla aditiva para el importe real transcrito desde el reporte del comercio, la estimación al crear el pedido y la referencia a la fila/documento fuente. El endpoint solo acepta pedidos Wompi aprobados, registra auditoría y no actualiza el pedido, la factura ni el pago. Si se revierte el Worker, se conserva esta tabla. La corrección de una transcripción se registra con la referencia correcta; los valores previos no se conservan como historial de cambios en esta versión.

`catalog__0005_profit_target_pricing.sql` agrega `pricing_target_type` (predeterminado `margin`) y `target_profit_cents` nullable. Los productos existentes permanecen en modo porcentual con su margen actual. La migración no recalcula ni cambia precios. En rollback del Worker, conserva ambas columnas y el ledger: la versión anterior las ignora; no ejecutar `DROP COLUMN` como reversión. Si la nueva versión debe retirarse, volver al Worker previo y preparar cualquier cambio de datos como una migración correctiva compatible.

`catalog__0006_suppliers_variants.sql` agrega las tablas prefijadas `catalog_suppliers` y `catalog_product_variants`, con índices y restricciones de datos. No modifica ni elimina registros existentes. Al volver a una versión anterior del Worker, conserva ambas tablas; no ejecutar `DROP TABLE` durante rollback. Los registros de variantes usan `product_id` como referencia simple y no alteran stock ni precios de los productos existentes. Para retirar estas entidades en el futuro, primero migrar o exportar sus datos y desplegar una versión compatible; la contracción requiere una migración aparte.

`catalog__0007_taxonomy_status.sql` se aplicó en producción el 2026-10-14 a las 07:55 UTC y se verificó en `d1_migrations` y `PRAGMA table_info`. Agrega estados `active`/`inactive` a categorías, marcas y atributos con `DEFAULT 'active'`; no cambia ni elimina filas existentes. Los listados públicos filtran los inactivos y los BFF administrativos los incluyen mediante páginas limitadas. Si se revierte el Worker, conservar las columnas y estados: la versión anterior no las requiere. No ejecutar `DROP COLUMN` ni restablecer estados durante rollback.

No hay rollback automático de DDL. Las nuevas migraciones deben ser aditivas y compatibles hacia atrás; recuperar una aplicación defectuosa implica detener el release, volver el Worker a la versión compatible y preparar una migración correctiva expand/contract tras respaldar. No borrar datos ni objetos R2 como rollback genérico.

La migración `orders__0002_guest_cart_capability.sql` agrega `orders_orders.guest_cart_id_hash`. Antes de desplegar el Worker que exige ese hash para pedidos invitados, inspeccionar `orders_orders` y verificar que no queden pedidos guest con pago `pending` sin hash; esperar a que se liquiden o reconciliarlos operativamente. La columna acepta `NULL` para preservar pedidos históricos y compatibilidad con la versión previa. Los pedidos nuevos invitados guardan un SHA-256 del cookie aleatorio `vega_cart_id`; el valor del cookie no se persiste en claro.

```text
Release candidate
      ↓
Staging: aplicar migraciones compatibles (por módulo)
      ↓
Staging: Worker aislado
      ↓
Smoke / E2E (incluye pago Wompi sandbox y contra entrega)
      ↓
Confirmar compatibilidad con la versión anterior (Worker, eventos y objetos R2)
      ↓
Producción: migraciones compatibles
      ↓
Producción: Worker
      ↓
Health + métricas + revisión de errores, DLQ y pagos pendientes
```

**Orden de despliegue y reversa:** la API debe ser compatible hacia atrás con los frontends activos (API versionada `/api/v1`). Se despliega la API primero y los frontends después; en un rollback se revierte primero el frontend y luego la API, salvo que el fallo esté en la API.

### Staging aislado (requisito)

El repositorio **no debe usar producción para ensayar**. Antes de usar este flujo, crear y documentar para staging: Worker, D1, bucket R2, KV, Queues + DLQ, secretos y bindings **independientes**, con **Wompi sandbox** y un dominio/clave de prueba de **Resend**. Nunca ejecutar una prueba de rollback contra datos reales de producción.

## Rollback del Worker

Ante un fallo de aplicación que no requiera revertir datos:

1. Detener nuevos despliegues y registrar commit, versión del Worker y hora del incidente.
2. Si el fallo afecta consumidores de Queue o Cron, **pausar** esos procesos (ver sección Queues) antes de revertir.
3. Consultar el historial de deployments y elegir explícitamente una versión estable anterior.
4. Revisar el diff de código/configuración y confirmar que esa versión es compatible con el esquema D1 actual y con los objetos y eventos ya escritos.
5. Ejecutar el rollback con el procedimiento soportado por la versión de Wrangler instalada. Comandos orientativos:

   ```bash
   pnpm exec wrangler deployments list
   pnpm exec wrangler rollback
   ```

   No ejecutar el segundo comando a ciegas: confirmar el deployment objetivo y la sintaxis/interacción que presenta Wrangler antes de confirmar.

6. **Purgar la caché** afectada (ver sección Caché).
7. Verificar salud, logs y flujos críticos; registrar resultado y decisión de recuperación.

El rollback del Worker no deshace migraciones D1, no restaura R2 y no revierte mensajes ya publicados en una Queue.

## Rollback de Pages (si se habilita ese despliegue)

- En el estado actual no hay un frontend de tienda/admin desplegado desde Pages: el storefront SSR y el dashboard admin viven en el Worker. Por tanto, el rollback de sus vistas se hace con el rollback del Worker descrito arriba.
- Si en el futuro se incorpora Pages, cada deployment será inmutable y deberá promoverse coordinado con la versión de API compatible.
- Confirmar que el frontend objetivo funciona con la **versión de API que quedará activa** (el cliente de API se genera desde OpenAPI; una API más antigua puede no tener endpoints nuevos).
- Tras revertir, verificar rutas críticas (home, detalle, login, checkout) y que las cabeceras de seguridad y la CSP siguen presentes.

## Migraciones y rollback de D1

El esquema se compone de migraciones **por módulo**, copiadas al `migrations_dir` de Wrangler como `<modulo>__0001_init.sql`. Para cambios incompatibles se usa expansión/contracción:

```text
vN: esquema antiguo
  ↓
expand: añadir columnas/tablas opcionales compatibles
  ↓
vN+1: código compatible con esquema antiguo y nuevo
  ↓
backfill idempotente y verificado
  ↓
vN+2: código usa el esquema nuevo
  ↓
esperar a que ninguna versión antigua siga activa
  ↓
contract: retirar elementos obsoletos en un release separado
```

- Antes de migrar, revisar el esquema remoto, el historial de migraciones, el backup disponible y el procedimiento de restauración.
- Las migraciones se versionan y se prueban primero en la D1 de staging con datos representativos **no sensibles**.
- No editar una migración ya aplicada en un entorno compartido; añadir una nueva.
- Cada migración toca **solo tablas de su módulo** (el test de aislamiento debe seguir en verde).
- No ejecutar `DROP`, renombres incompatibles ni eliminación de columnas mientras un Worker anterior pueda necesitar esos datos.
- Backfills y reparaciones deben ser idempotentes, medibles y reanudables.
- Registrar cada migración aplicada en `docs/migrations/manifest.md` (módulo, número, entorno, fecha, commit).

### Restauración de D1

Si se requiere restaurar D1 (mecanismo de *Time Travel* de Cloudflare D1 o reconstrucción de datos):

1. Detener o controlar las escrituras (modo mantenimiento, pausa de Queues y Cron).
2. Identificar el punto de recuperación, estimar la **pérdida de escrituras** y obtener aprobación explícita.
3. Verificar la sintaxis vigente de Wrangler antes de ejecutar; comandos orientativos (no ejecutar a ciegas):

   ```bash
   pnpm exec wrangler d1 time-travel info <DB_NAME>
   pnpm exec wrangler d1 time-travel restore <DB_NAME> --timestamp=<ISO-8601>
   ```

4. Tras restaurar, ejecutar la **reconciliación de negocio** (siguiente sección) antes de reabrir.

No presentar la restauración como un simple rollback de código. Restaurar D1 **sin** reconciliar puede dejar pedidos sin pago, pagos sin pedido, stock incorrecto y correos duplicados.

## Reconciliación de negocio tras un incidente

Siempre que se revierta el Worker de forma que afecte a `orders`, `payments`, `inventory`, `credit` o `notifications`, o se restaure D1:

- [ ] **Pagos:** listar transacciones de Wompi del periodo y compararlas con `payments_payments`/`orders_orders` (estado, monto en centavos, moneda, referencia). Reaplicar de forma **idempotente** las confirmaciones faltantes; no duplicar las existentes.
- [ ] **Webhooks:** Wompi reintenta los eventos no entregados; confirmar que el endpoint está disponible y que `payments_webhook_events` evita reprocesar. No habilitar procesamiento de eventos hasta tener el esquema correcto.
- [ ] **Pedidos en estados intermedios:** revisar `placed`, `confirmed` y pagos `pending`; reconsultar a Wompi antes de cancelar o confirmar.
- [ ] **Stock:** recalcular reservas contra pedidos activos; liberar reservas huérfanas; revisar sobreventa potencial.
- [ ] **Contra entrega:** verificar recaudos (`payments_cod_collections`) y pedidos entregados no cobrados.
- [ ] **Crédito:** comprobar saldos, cuotas y abonos aplicados contra los pagos de Wompi.
- [ ] **Cupones:** verificar canjes (`promotions_redemptions`) frente a pedidos reales.
- [ ] **Emails:** consultar `notifications_log`; **no reenviar** correos ya entregados; la idempotencia debe impedir duplicados.
- [ ] **Auditoría:** dejar constancia del incidente en `audit`.

### Blog CMS (`cms__0003_blog.sql`, 2026-10-14)

La migración agrega cuatro tablas y sus índices en el prefijo `cms_`; no altera páginas CMS, no copia imágenes y no elimina datos. Antes de aplicarla se verificaron las 44 migraciones previas, CMS `0001/0002`, 10 páginas existentes, ausencia de tablas `cms_blog_*` y el bookmark de recuperación `00000281-0000002c-00005104-2ff90a6ebf8df4bdae26749c3607144e`. Se aplicó únicamente v3 con `apps/api/scripts/apply-migrations.js`; el ledger confirmó v3, existen las cuatro tablas y `PRAGMA foreign_key_check` no devolvió filas. El bookmark posterior consultado fue `00000281-0000003a-00005104-757e689778ef5f22c91bc4aa60bb4f81`. No se creó una copia manual separada. No hay down migration: si hay que revertir la aplicación, conservar tablas y datos y restaurar el Worker compatible anterior. Las imágenes siguen referenciadas por ID de Media; no borrar objetos de R2 como parte del rollback.

La publicación programada se ejecuta cada cinco minutos y es condicional a `status='scheduled'` y a que `scheduled_at` haya vencido, por lo que repetir el cron no vuelve a publicar ni duplica su efecto. El auditor debe conservar los registros de publicación automática. La generación dinámica del sitemap no requiere backfill ni invalidación manual.

### Contenido inicial del Blog (`cms__0004_blog_welcome_article.sql`, 2026-10-14)

La migración inserta de forma idempotente el autor institucional Vega Store, la categoría Novedades y un artículo de bienvenida publicado con IDs estables. Se verificó antes de aplicarla que producción tenía v3 pero cero autores, categorías y artículos. El contenido se relaciona solo con tablas `cms_*`; no altera páginas CMS ni usa imágenes. Después se verificaron ledger v4, exactamente un artículo publicado, sus relaciones y `PRAGMA foreign_key_check` vacío; `/blog` y el detalle devolvieron HTTP 200. Bookmark Time Travel previo `00000281-00000152-00005104-0d1d5159a6b3435bacb7ba398bedf3ed`; posterior `00000281-0000019a-00005104-201a677cda563d5e1a50a199aacfeec5`. Para rollback del Worker, conservar las filas y el esquema: no borrar el artículo ni su taxonomía automáticamente.

### Gestión de menús CMS (`cms__0005_menu_management.sql`, 2026-10-14)

La migración añadió `item_type` a `cms_menu_items` y creó la navegación inicial solo para enlaces que faltaban. Antes de aplicarla se verificaron los seis enlaces existentes en `header`/`footer`, el ledger hasta v4 y el bookmark `00000319-000001f6-00005105-17ce768350a9b6abc77efada4b7eea20`. Después se comprobó que los enlaces previos seguían presentes, la nueva columna estaba disponible y `/seguimiento-pedido` era hijo del grupo «Ayuda» en ambos menús. Bookmark posterior `00000319-00000206-00005105-ed0e138adbb08005777ea607832f8199`. Para rollback, mantener la columna y los registros; el Worker anterior ignora `item_type` y conserva acceso a las columnas previas.

## R2

- Mantener el bucket privado y las claves de objeto estables durante el release.
- No exigir que un rollback borre objetos creados por la versión nueva.
- Los cambios de formato, nombre o metadatos deben permitir que **ambas versiones** lean los objetos durante la ventana de rollback.
- Si hace falta migrar objetos, hacerlo por etapas, idempotente y con plan de reintento.
- No borrar objetos ni ejecutar limpiezas masivas como respuesta automática a un rollback.
- Verificar consistencia entre metadatos D1 (`media_assets`) y objetos R2 antes de reanudar operaciones críticas (SEC-R2-08).
- Los documentos de factura actuales son HTML/CSS de impresión en R2. Conservar objetos existentes y sus claves; el Worker anterior debe seguir pudiendo leerlos. No asumir que se genera una copia PDF versionada ni borrar/reemplazar documentos durante recuperación.

### Procesamiento seguro y recolección de medios

Las subidas nuevas se decodifican y re-encodean a WebP mediante el binding Cloudflare Images `IMAGES`; los formatos de salida de imagen descartan EXIF/GPS. El contenido anterior permanece en R2 y es legible mediante el MIME guardado en D1. Un rollback de código no restaura los bytes originales de una subida ya convertida; no hay migración D1 asociada. El binding de Images se factura según las transformaciones únicas, por lo que un rollback de código no desactiva ni revierte cargos ya realizados.

El cron de medios revisa hasta 1.000 objetos `media/` por ejecución diaria, conserva un cursor en KV y solo elimina un objeto si su edad supera siete días y no existe `media_assets.storage_key` asociado. Excluye los prefijos privados y de facturación. La operación es idempotente para claves ya borradas, pero no restaura objetos eliminados; ante una referencia inconsistente o incidente, detener el Worker/Cron y recuperar el objeto desde la retención/copia disponible antes de reanudar. No ejecutar un borrado masivo de R2 como rollback.

### MFA administrativo

Al desplegar el control obligatorio, una cuenta con `mfa_enabled=0` solo puede entrar a `/admin/mfa-setup`; APIs y datos de administración permanecen bloqueados hasta confirmar un TOTP con la contraseña revalidada. Después, el login exige TOTP. Antes de revertir el Worker, considerar que una versión anterior podría permitir saltarse MFA. No revertir a una versión sin el gate mientras haya una cuenta con MFA deshabilitado; si se necesita rollback por incidente, mantener acceso de administrador detenido hasta volver a aplicar una versión con el gate. Guardar el secreto TOTP en un gestor de contraseñas seguro durante el enrolamiento.

## Queues y eventos (activas en este proyecto)

El proyecto usa Cloudflare Queues con outbox por módulo, ack manual y DLQ (contrato §6.5 y §8).

- Versionar el contrato del evento (`...v1`, `...v2`) cuando un cambio no sea compatible.
- Mantener consumidores capaces de procesar mensajes emitidos por versiones anteriores durante la transición.
- No retirar campos requeridos mientras haya consumidores activos que los necesiten.
- Handlers idempotentes; reintentos con backoff; DLQ y *replay* seguro.
- Antes de revertir, evaluar si conviene **pausar el consumidor** (para no procesar mensajes con código incompatible) y **detener el relay de outbox** de Cron.
- Tras el rollback, revisar profundidad, antigüedad, errores y DLQ **antes** de volver a procesar o reproducir mensajes.
- Los eventos de pagos (`payments.payment.confirmed.v1`) y de pedidos no se reproducen a ciegas: pasan por la reconciliación anterior.

## Caché (KV y Cache API)

- Tras un rollback, **purgar** las entradas que pudieron generarse con la versión nueva (productos, home, anuncios, SEO, sitemap).
- Incluir una versión de esquema/contrato en las claves de caché de contenido derivado, para evitar mezclar formatos.
- Verificar que ninguna entrada cacheada contiene datos personales (SEC-WEB-05).

## Proveedores externos

- **Wompi:** no cambiar la URL de eventos ni las llaves durante un rollback salvo que el incidente lo exija; si se rotan secretos, hacerlo con un plan y reconciliar después. Verificar sandbox vs. producción.
- **Resend:** si el fallo afecta el envío, pausar el consumidor de emails; al reanudar, confiar en la idempotencia y en `notifications_log`.

## Checklist operativo

### Antes del release

- [ ] Identificar y registrar el deployment estable anterior del Worker y el commit correspondiente.
- [ ] Confirmar compatibilidad del esquema D1 con la versión anterior y que no hay migraciones destructivas pendientes.
- [ ] Confirmar la compatibilidad de la API con los frontends activos y de los eventos con los consumidores.
- [ ] Confirmar backup/*Time Travel* de D1 y que el procedimiento de restauración se ensayó.
- [ ] Confirmar privacidad/consistencia de R2 y compatibilidad de los objetos.
- [ ] Revisar Queues/DLQ, Cron, logs, tasa de errores, latencia y alertas.
- [ ] Verificar que no hay pagos o pedidos críticos en estados inconsistentes antes de desplegar.
- [ ] Ensayar despliegue y rollback en staging con datos de prueba (incluido un pago sandbox).

### Durante el rollback

- [ ] Detener nuevos releases y designar responsable del incidente.
- [ ] Pausar consumidores de Queue y relay de outbox si corresponde.
- [ ] Confirmar objetivo estable y compatibilidad D1/R2/eventos antes de revertir.
- [ ] Revertir el Worker con el procedimiento verificado para Wrangler. Si Pages se incorpora en el futuro, coordinar su versión API compatible.
- [ ] No ejecutar migraciones destructivas ni borrar objetos como parte automática del rollback.
- [ ] Confirmar bindings y secretos compatibles con la versión restaurada.
- [ ] Purgar caché afectada.
- [ ] Verificar `/health` (el endpoint realmente implementado; variantes `live`/`ready` son objetivos futuros hasta implementarlas y probarlas).

### Después

- [ ] Ejecutar smoke tests y E2E críticos: registro/login, compra con Wompi sandbox/producción según el entorno, compra contra entrega, administración.
- [ ] Ejecutar la **reconciliación de negocio** completa.
- [ ] Revisar errores D1, coherencia D1/R2, profundidad de Queue y DLQ.
- [ ] Reanudar consumidores y Cron de forma controlada.
- [ ] Confirmar que operaciones y trabajos pendientes no se duplicaron ni se perdieron (pagos, stock, emails, cuotas).
- [ ] Registrar incidente, causa raíz, versión final y acciones preventivas.

## Evidencia y criterio de finalización

### Correcciones de conciliación de pagos (2026-10-14)

`payments__0005_settlement_corrections.sql` agrega una tabla de eventos correctivos append-only. La conciliación original permanece en `payments_settlement_costs`; el panel presenta la corrección más reciente como valor efectivo e incluye su motivo. Aplicar v5 antes de desplegar el Worker que expone la ruta de corrección. Si el Worker se revierte, conservar tabla y eventos; la versión anterior seguirá pudiendo leer conciliaciones originales, aunque no mostrará las correcciones nuevas. No borrar eventos ni restaurar un snapshot para revertir una corrección. Si una corrección fue errónea, registrar otra corrección explicativa con el valor respaldado por el reporte. Los recaudos contra entrega permanecen inmutables en el panel: su reversión requiere un flujo que también resuelva devolución de dinero, estado del pedido e invoice/nota crédito.

Guardar en CI/CD o en el registro operativo: fecha, entorno, commit inicial/final, IDs de deployments, migraciones involucradas, comandos ejecutados, resultados de smoke/E2E, resultado de la reconciliación y responsable. **No registrar secretos ni datos privados.**

La foundation de rollback solo puede declararse **COMPLETE** cuando:

- staging está aislado (Worker, D1, R2, KV, Queues, secretos, Wompi sandbox, Resend de prueba);
- el procedimiento de despliegue y rollback del Worker se ejecuta de extremo a extremo;
- la compatibilidad D1/R2/eventos está comprobada;
- el backup/restauración de D1 y la reconciliación de pagos se han ensayado;
- la evidencia se conserva.

Los controles no aplicables todavía (por ejemplo, `credit` o Durable Objects antes de incorporarlos) deben quedar explícitamente identificados como tales.

## Auditoría de migraciones correctivas (2026-10-12)

### Perfil público de tienda (2026-10-14)

`settings__0003_storefront_contact_social.sql` agrega de forma nullable ciudad, país y URLs de Instagram, TikTok y Facebook a `settings_store`. Completa `company_country='Colombia'` únicamente cuando el campo está vacío, conforme al storefront colombiano existente; no modifica pedidos ni facturas. Aplicar antes de desplegar código que lea estas columnas. Para recuperar, revertir el Worker conservando columnas y valores; no borrar campos ni restaurar un snapshot. Los enlaces sociales son opcionales y deben configurarse desde Admin → Configuración. Dirección, NIT y ciudad permanecen vacíos hasta ser ingresados por el administrador.

`settings__0004_footer_copyright.sql` agrega `footer_copyright_text` y carga el texto inicial “Todos los derechos reservados.” para la configuración existente. Es una expansión; al revertir el Worker, conservar la columna y su contenido. El nombre comercial y el año se renderizan dinámicamente, y el texto legal es editable en Admin → Configuración.

### Páginas institucionales CMS (2026-10-14)

`cms__0002_institutional_pages.sql` agrega las páginas institucionales que no existían, en estado `draft`, y conserva intactas las páginas previas. Es una migración de contenido sin DDL. Un rollback del Worker no requiere revertir ni borrar estas filas; las versiones actuales de CMS continúan pudiendo leerlas. Si la migración no se completa, revisar `cms_pages` por slug y `cms_page_versions` por ID/versión antes de reintentar. La operación es idempotente y no elimina contenido. Publicar cada borrador solo después de validar los datos comerciales o legales correspondientes.

Se añadieron `payments__0003_cod_collection_receipts.sql` y `realtime__0003_preserve_read_state.sql` como migraciones expand-only. La primera agrega columnas nullable y rellena `created_at` desde `collected_at`; la segunda sincroniza `read` con `is_read`. Ambas se probaron en SQLite temporal desde una base nueva y con filas de fixture del esquema anterior. Con autorización del usuario, pagos v3 se aplicó con Wrangler al D1 remoto; realtime se ejecutó durante reconciliación del ledger. No se desplegó el Worker.

Para recuperar: conservar las columnas añadidas y filas, y corregir hacia delante. Los bookmarks previos y posteriores a la reconciliación constan en `docs/migrations/manifest.md`. No hay reversión automática probada. No eliminar columnas ni restaurar un snapshot sin evaluar escrituras posteriores.

`orders__0002_guest_cart_capability.sql` se aplicó a `ecommerce-vega-production` con el runner numérico, después de verificar el ledger de 27 entradas, el esquema previo, y un bookmark de time-travel. La comprobación posterior encontró la nueva columna nullable y la migración registrada; las 8 órdenes guest con pago pendiente se conservaron. No se desplegó el Worker. Antes de desplegar la versión que exige el hash para invitados, conciliar los pagos Wompi pendientes y determinar un tratamiento seguro para las órdenes legacy sin hash. La migración es expand-only: la recuperación recomendada es corregir hacia delante; conservar la columna y los datos. Bookmark previo inmediato: `000001d5-00000096-00005103-6f289f94e530fd566d8b691355450464`; bookmark posterior: `000001d5-000000a6-00005103-a4dfd09e2d19e6db5e71c647017dbae2`. No restaurar ninguno sin evaluar todas las escrituras posteriores.

### Imágenes opcionales de marca (2026-10-14)

`catalog__0010_brand_image.sql` agrega una columna nullable a `catalog_brands`. Para rollback de Worker, regresar la versión y conservar la columna; el Worker previo la ignora. No borrar medios de R2 si se quita la imagen de una marca. Aplicación productiva verificada: ledger con 44 migraciones y columna presente. Bookmark anterior `00000280-00000319-00005104-84f1213e1c2180147cbcc968ea1511f3`; posterior `00000280-00000325-00005104-1be4680bac0b0e072f56d01855aeaa81`. La recuperación D1 no requiere restaurar el bookmark para este cambio expand-only.

`orders__0005_secure_order_tracking.sql` agrega hash de clave de seguimiento y plazo estimado nullable. Se aplicó en producción el 2026-10-15 después de comprobar 49 migraciones previas y el esquema; la verificación confirmó el ledger, columnas e índice y 13 pedidos intactos. Bookmark anterior: `00000319-0000019e-00005105-9644332b47d51b300b3ec6018eb1b9b7`; posterior: `00000319-000001aa-00005105-06eac73c65e096dc87017c45983141dd`. Worker desplegado al 100% como `7ac9c89a-eb45-433c-93b8-3f9c4aea54ca`; `/seguimiento-pedido` devolvió HTTP 200 y `/health` indicó D1/KV/Queue/R2 `ok`. Pedidos anteriores no reciben una clave ni se exponen a la consulta pública; conservan su acceso autenticado vigente. Si se revierte el Worker, mantener las columnas y claves emitidas; no rotar ni eliminar hashes como parte del rollback.

### Reseñas de productos (`reviews__0001_init.sql`, 2026-10-14)

La migración crea la tabla e índices del prefijo `reviews_` sin claves foráneas hacia `catalog`, `identity` u `orders` y sin modificar datos existentes. Las compras se validan al enviar mediante el Gateway de `orders`. Si se revierte el Worker, conservar la tabla y las opiniones; no ejecutar `DROP TABLE` ni borrar filas. La migración es expand-only.

Producción: `reviews__0001_init.sql` se aplicó el 2026-10-15 UTC después de consultar el bookmark de Time Travel `00000318-0000012e-00005105-4c1dc461dab69b0749040a1c7484b97e`; Wrangler confirmó luego que no quedaban migraciones pendientes. El Worker con la página pública y el API de reseñas quedó desplegado como versión `e9d2211b-405b-41fa-8d68-03ab5372e04d`. Una reversión conserva la tabla y sus opiniones; la tabla no tiene down migration.

### Integración MiPaquete (`shipping__0002_mipaquete_shipments.sql`)

La expansión agrega tablas `shipping_*` para configuración, cotizaciones, guías y eventos; no cambia pedidos anteriores ni otras tablas. Aplicada en producción el 2026-10-15. Bookmark anterior `0000031c-0000000a-00005105-f0f8576beb70c994817e0ae73956d4ff`; posterior `0000031c-00000014-00005105-e13bfad6e2a92d4cee82c9b8e44840fe`. La lectura posterior confirmó la entrada de ledger y las cuatro tablas vacías. Al revertir el Worker se conservan las tablas y guías creadas. Si `createSending` termina con respuesta ambigua, el reconciliador consulta `getSendings` con fechas acotadas y compara exactamente `Producto o Referencia` con el ID del pedido. Una sola coincidencia persiste los datos del envío; ninguna coincidencia, coincidencias múltiples, respuesta incompleta o error conservan `creation_pending`. El cron limita las consultas a una cada 15 minutos por envío pendiente. Nunca se reintenta el despacho automáticamente: la documentación no garantiza consistencia eventual, por lo que “no encontrado” no prueba que el proveedor no haya creado la guía. No borrar ni resetear estos registros para forzar un envío nuevo. El secret no se copia a D1 ni a logs.

El reconciliador se desplegó el 2026-10-15 desde `a6ddb08` como Worker `8ebfc651-16f1-40aa-a4bb-8fdb9344431f`. No requiere migración adicional. La consulta posterior confirmó que `shipping_carrier_shipments` sigue sin registros; el despliegue no creó ni consultó guías históricas. `/health` respondió 200 con D1, KV, Queue y R2 saludables.

`catalog__0011_product_shipping_dimensions.sql` y `shipping__0003_package_profiles_and_quote_snapshot.sql` son expansiones aditivas: las dimensiones de productos existentes quedan `NULL` y no se infieren; perfiles de empaque nuevos no alteran cotizaciones ni guías históricas. La reversión del Worker conserva columnas, perfiles, cotizaciones y snapshots. No activar la integración hasta completar los datos logísticos requeridos; una cotización con producto sin empaque válido falla de forma explícita y no genera guía. En cualquier reintento de guía se emplean las dimensiones/peso guardados en la cotización, nunca una caja nueva leída de configuración.

### Estado y ampliaciones documentadas al 2026-10-15

Las migraciones de logística posteriores a `shipping__0002_mipaquete_shipments.sql` incluyen perfiles de empaque y snapshots de cotización (`shipping__0003`), perfiles iniciales y activación de cotizaciones (`shipping__0004`), marca de impresión y actor (`shipping__0005`) y ajuste de zonas locales al Valle de Aburrá (`shipping__0006`). Las migraciones de catálogo `catalog__0011` y `catalog__0012` agregan medidas/peso empacados y valores iniciales estimados. En rollback de aplicación, conservar las columnas, perfiles, cotizaciones, guías, marcas de impresión y asociaciones locales; no reconstruir zonas ni dimensiones automáticamente. Consultar el detalle por versión en [`docs/migrations/manifest.md`](./docs/migrations/manifest.md).

`reviews__0002_demo_reviews.sql` conserva la columna de procedencia para identificar opiniones históricas; su fuente canónica ya no inserta reseñas ficticias en instalaciones nuevas. Las filas que ya existan en una D1 aplicada no se eliminan al cambiar el archivo ni se convierten en opiniones verificadas. `reviews__0003_manual_reviews.sql` diferencia las entradas administrativas. La secuencia de fechas anotada para `reviews__0001` y `reviews__0002` en el manifiesto debe reconciliarse contra `d1_migrations` antes de usarla como evidencia operativa.

`payments__0005_settlement_corrections.sql` es append-only: conservar cada corrección y registrar una nueva si hay que rectificarla. Las migraciones de `cms` v3-v5 agregan Blog y gestión de menús; en rollback se conserva el contenido y no se ejecutan `DROP`. `orders__0005`–`0008` agregan capacidad de seguimiento invitado, información logística, modo de cobro y modalidad de cumplimiento; conservar hashes, historia y modalidad de pedidos históricos.

Este resumen no certifica que todas las versiones desplegadas o entornos tengan el mismo ledger. El estado de preparación para rollback continúa **PENDIENTE** hasta realizar y registrar un ensayo aislado de staging con evidencia.
