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
| **Pages: storefront y admin** | Sí, por deployment de Pages | Deben ser compatibles con la versión de API activa |
| **D1 única** | No automático | Migraciones por módulo; restauración es una operación aparte |
| **R2** (medios y documentos) | No | Nunca se borra para "revertir" |
| **KV / Cache API** | Invalidar/purgar | Puede contener respuestas de la versión nueva |
| **Queues + DLQ** | No | Mensajes ya publicados siguen existiendo |
| **Cron Triggers** | Con el Worker | Pausar si el cambio los afecta |
| **Durable Objects** (si existen) | Limitado | Cambios de clase/migración de DO son delicados |
| **Wompi / Resend** | Configuración externa | URLs de webhook y claves; no se "revierten", se reconcilian |

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

## Estrategia de release

```text
Release candidate
      ↓
Staging: aplicar migraciones compatibles (por módulo)
      ↓
Staging: Worker + Pages
      ↓
Smoke / E2E (incluye pago Wompi sandbox y contra entrega)
      ↓
Confirmar compatibilidad con la versión anterior (Worker, Pages, eventos)
      ↓
Producción: migraciones compatibles
      ↓
Producción: Worker (API) primero, luego Pages
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

## Rollback de Pages (storefront y admin)

- Cada deployment de Pages es inmutable; se puede promover un deployment anterior.
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

## R2

- Mantener el bucket privado y las claves de objeto estables durante el release.
- No exigir que un rollback borre objetos creados por la versión nueva.
- Los cambios de formato, nombre o metadatos deben permitir que **ambas versiones** lean los objetos durante la ventana de rollback.
- Si hace falta migrar objetos, hacerlo por etapas, idempotente y con plan de reintento.
- No borrar objetos ni ejecutar limpiezas masivas como respuesta automática a un rollback.
- Verificar consistencia entre metadatos D1 (`media_assets`) y objetos R2 antes de reanudar operaciones críticas (SEC-R2-08).

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

- [ ] Identificar y registrar el deployment estable anterior (Worker y Pages) y el commit correspondiente.
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
- [ ] Revertir Pages y/o Worker en el orden correcto con el procedimiento verificado para Wrangler.
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

Guardar en CI/CD o en el registro operativo: fecha, entorno, commit inicial/final, IDs de deployments, migraciones involucradas, comandos ejecutados, resultados de smoke/E2E, resultado de la reconciliación y responsable. **No registrar secretos ni datos privados.**

La foundation de rollback solo puede declararse **COMPLETE** cuando:

- staging está aislado (Worker, D1, R2, KV, Queues, secretos, Wompi sandbox, Resend de prueba);
- el procedimiento de despliegue y rollback (Worker y Pages) se ejecuta de extremo a extremo;
- la compatibilidad D1/R2/eventos está comprobada;
- el backup/restauración de D1 y la reconciliación de pagos se han ensayado;
- la evidencia se conserva.

Los controles no aplicables todavía (por ejemplo, `credit` o Durable Objects antes de incorporarlos) deben quedar explícitamente identificados como tales.
