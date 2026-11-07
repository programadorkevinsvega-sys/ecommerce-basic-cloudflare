# Auditoría técnica ejecutiva: D1, R2, eventos y seguridad

**Proyecto:** `ecommerce-basic-cloudflare`  
**Fecha del corte:** 2026-11-07  
**Tipo de revisión:** estática y documental del código/configuración del repositorio  
**Estado:** hallazgos priorizados; no equivale a pentest ni a certificación de producción.

## 1. Resumen ejecutivo

La arquitectura tiene buenas bases: módulos con prefijos D1, queries parametrizadas en los repositorios revisados, controles de sesión/MFA, validación de uploads y protección explícita de archivos privados. La configuración de Worker también declara Queue con DLQ, Cron y logs.

Aun así, esta revisión encontró dos brechas que deben tratarse antes de considerar cerrados los controles de seguridad y eventos:

1. **Riesgo alto de XSS almacenado en páginas CMS:** el sanitizador genérico permite atributos peligrosos que se representan como HTML sin escape.
2. **Pérdida silenciosa de eventos de Queue:** el consumidor ACKea tipos sin handler; actualmente el Cron relaya eventos de `settings` y `wishlist`, mientras el consumidor solo ejecuta handlers de facturación.

También hay riesgos de integridad por escrituras D1 no atómicas y costes evitables de consultas N+1, ordenamientos/búsquedas y conteos repetidos. La configuración contempla staging, pero el repo documenta que sus recursos siguen sin provisionar y que no se ha ensayado recuperación.

### Estado por área

| Área | Evaluación de código | Estado operativo verificable en esta revisión |
|---|---|---|
| Seguridad web/CMS | Hay una brecha concreta de sanitización; otras defensas relevantes sí existen | Sin ejecución de pruebas dinámicas |
| Eventos | Productor/relay/consumer no forman un flujo completo para todos los eventos relayed | Queue, DLQ y backlog no consultados en Cloudflare |
| D1 | Hay N+1, búsquedas no indexables y agregados escritos en varias llamadas | Sin `EXPLAIN QUERY PLAN`, métricas ni dataset representativo |
| R2 | Flujo de upload y bloqueo de media privada presentes | No se verificaron ACL, lifecycle, consumo ni objetos del bucket remoto |
| Recuperación | Procedimientos documentados | Staging, backup/restore y rollback siguen pendientes según la documentación del repo |

## 2. Alcance y límites

Se revisaron las reglas de arquitectura, seguridad y rollback, más código de Worker, composition root, middleware, repositorios, migraciones y adapters de media. Entre las fuentes principales están [AGENTS.md](../AGENTS.md), [SECURITY_RULES.md](../SECURITY_RULES.md), [ROLLBACK_RECOVERY.md](../ROLLBACK_RECOVERY.md), [PROJECT_RULES.md](PROJECT_RULES.md), [index.ts](../apps/api/src/index.ts), [OutboxRelayService.ts](../apps/api/src/platform/outbox/OutboxRelayService.ts), [D1ProductRepository.ts](../apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts), [D1OrderRepository.ts](../apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.ts) y [D1AdminOrderListRepository.ts](../apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1AdminOrderListRepository.ts).

**No se obtuvo acceso al entorno Cloudflare ni a datos de producción.** No se consultaron D1 remota, `EXPLAIN QUERY PLAN`, estadísticas de cardinalidad, Analytics Engine, Queue/DLQ, configuración ACL/lifecycle de R2 ni logs de Workers. Tampoco se ejecutaron suites: el entorno de trabajo no tiene `node` ni `pnpm` disponibles (el intento de `pnpm typecheck` terminó con “pnpm no encontrada”; Node tampoco está instalado). Por tanto, las conclusiones de ejecución se etiquetan como pendientes, no como aprobadas.

## 3. Hallazgos priorizados

### H-01 | Alto | XSS almacenado por sanitización insuficiente de CMS — mitigado en código

**Evidencia original:** [sanitizeHtml.ts](../apps/api/src/modules/cms/domain/sanitizeHtml.ts) eliminaba algunos patrones con regex, pero no usaba una lista positiva ni normalizaba entidades antes de validar URLs. El SSR de [renderCmsBlocks.ts](../apps/api/src/bff/views/renderCmsBlocks.ts) inserta HTML rico directamente, por lo que su seguridad depende del dato saneado antes de llegar al BFF.

**Corrección:** se adoptó `xss` con allowlist explícita, filtrado de tags/atributos, saneamiento de entidades y URLs; solo se conservan enlaces internos, HTTPS, `mailto`/`tel` y medios `/media/<UUID>`. [sanitizeCmsBlocks.ts](../apps/api/src/modules/cms/domain/sanitizeCmsBlocks.ts) aplica la política a páginas al guardar; los repositorios de páginas y blog la reaplican al leer, así cubren datos existentes sin depender de un backfill. CTA inválido cae a `/`; un bloque de imagen con origen no permitido se descarta. El SSR escapa los campos de texto no HTML intencional.

**Verificación:** regresiones unitarias contra esquemas codificados, atributos activos, SVG/MathML, markup malformado y URLs protocol-relative; ruta Hono admin→SSR; pruebas Workers con contenido histórico almacenado directamente en D1 para páginas y blog. La suite del repositorio se ejecutó localmente. No se comprobó el deployment ni se leyó la D1 de producción.

**Estado:** mitigado en el código actual y en las rutas SSR cubiertas por tests Workers. El contenido antiguo no se reescribe: la hidratación del repositorio lo devuelve saneado en cada lectura. No se requiere republicar para evitar servir HTML activo desde esas rutas; un inventario o backfill en producción sigue pendiente por falta de acceso operativo y no es necesario para la mitigación de lectura.

### H-02 | Alto | Los eventos sin handler se ACKean y se descartan

**Evidencia:** [index.ts](../apps/api/src/index.ts) procesa explícitamente solo `invoicing.invoice.issue.requested` y `invoicing.credit_note.issue.requested`; el `else` registra “Mensaje sin consumer registrado” y después llama `message.ack()`. Sin embargo, el Cron también relay-a `settings_outbox_events` y `wishlist_outbox_events`. [D1WishlistRepository.ts](../apps/api/src/modules/wishlist/infrastructure/persistence/d1/repositories/D1WishlistRepository.ts) escribe `wishlist.item.added.v1` y `wishlist.item.removed.v1`; [OutboxRelayService.ts](../apps/api/src/platform/outbox/OutboxRelayService.ts) marca publicados esos eventos tras `queue.send`.

El resultado actual es que al menos los tipos de wishlist publicados llegan al consumidor y se ACKean sin procesamiento. La tabla de settings también se publica, pero su catálogo de eventos y consumidor deben mapearse antes de definir su impacto de negocio. Varias otras tablas outbox usan esquemas antiguos distintos, por ejemplo `event_name/payload` en [orders migration](../apps/api/src/modules/orders/infrastructure/persistence/d1/migrations/0001_init.sql), por lo que no se pueden añadir al relay genérico sin adaptar contratos.

**Impacto:** pérdida irrecuperable desde Queue para eventos no manejados; el outbox ya queda marcado `published`. La configuración de DLQ no ayuda si el handler ACKea.

**Cierre requerido:** inventariar productores, propósito, versión y consumer esperado; definir un registry tipado de handlers Zod. Un tipo válido pero no soportado no debe ACKearse silenciosamente: derivarlo a una política explícita de cuarentena/DLQ y alertar. No publicar eventos sin consumidor activo. Añadir pruebas que demuestren procesamiento, retry y tratamiento de tipos desconocidos.

### H-03 | Alto | Relay con ventana de duplicados y sin claim/lease

**Evidencia:** [OutboxRelayService.ts](../apps/api/src/platform/outbox/OutboxRelayService.ts) selecciona filas `pending`, hace `queue.send()` y luego actualiza a `published`. Si el envío se acepta y el update falla, el siguiente Cron vuelve a publicar. Dos ejecuciones solapadas también pueden seleccionar la misma fila, porque no hay estado de claim/lease ni transición condicional previa al envío.

**Impacto:** entrega al menos una vez y posibles duplicados. No es necesariamente un defecto si todos los handlers son idempotentes, pero no debe tratarse como entrega exactly-once.

**Cierre requerido:** declarar el contrato at-least-once; incluir `eventId` idempotente en cada efecto consumidor y conservar deduplicación persistente. Implementar claim/release con expiración y actualización condicional, dentro de las capacidades transaccionales de D1, o una estrategia de relay que acepte explícitamente duplicados. Probar timeout entre `send` y `published`, solapamiento de Cron y reintento de consumidor.

### H-04 | Alto | Escrituras de pedido no atómicas

**Evidencia:** [D1OrderRepository.ts](../apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.ts) guarda/actualiza el pedido, luego elimina las líneas y las inserta una a una; la etiqueta de entrega local se inserta después. Son llamadas D1 independientes, no una operación batch atómica.

**Impacto:** un error intermedio puede dejar un pedido sin líneas o con líneas incompletas, aunque el pedido principal ya figure actualizado. En un flujo de compra esto afecta conciliación, inventario, facturación y atención al cliente.

**Cierre requerido:** construir todas las sentencias del agregado `orders_*` y ejecutarlas en un `DB.batch()` transaccional dentro del mismo prefijo; conservar la outbox del pedido en esa misma unidad de escritura si aplica. Añadir pruebas de fallo en cada paso y comprobar que no queda estado parcial. No mezclar tablas de otros módulos en el batch.

### H-05 | Alto | Escrituras de catálogo dejan relaciones parcialmente reemplazadas

**Evidencia:** [D1ProductRepository.ts](../apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts) hace batch del upsert del producto y los deletes de relaciones, pero después inserta categorías, imágenes y cobertura en loops con `.run()` independientes.

**Impacto:** si una inserción falla, el producto queda guardado sin todas sus relaciones o con relaciones incompletas; además cada relación añade un round trip D1.

**Cierre requerido:** incluir upsert, deletes e inserts de `catalog_*` en un solo `DB.batch()`; validar límites de tamaño y número de sentencias. Probar rollback completo y mantener el test de aislamiento de tablas.

### H-06 | Medio-Alto | Lectura administrativa de pedidos multiplica consultas por fila

**Evidencia:** [D1AdminOrderListRepository.ts](../apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1AdminOrderListRepository.ts) ejecuta conteo filtrado, conteo global por estado y página de IDs en cada request. Después consulta `findById` por cada pedido; [D1OrderRepository.ts](../apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1OrderRepository.ts) hace otra consulta para las líneas. La lista general de pedidos también carga líneas en un loop secuencial.

**Impacto:** al crecer `pageSize`, el número de consultas sube por fila y los conteos escanean tablas en cada página. En admin, status counts son globales aun cuando el usuario pagina o filtra.

**Cierre requerido:** devolver un DTO administrativo mínimo desde queries paginadas; cargar líneas solo al abrir el detalle. Para agregados por estado, evaluar caché de corta duración o consultas solo cuando se soliciten. Batch-load de relaciones, sin consultas por cada fila. Medir requests D1 por endpoint antes/después.

### H-07 | Medio-Alto | Catálogo usa hidratación N+1

**Evidencia:** [D1ProductMapper.ts](../apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductMapper.ts) ejecuta 3 queries por producto para categorías, imágenes y cobertura. [D1ProductRepository.ts](../apps/api/src/modules/catalog/infrastructure/persistence/d1/repositories/D1ProductRepository.ts) llama al mapper para cada resultado de list/search.

**Impacto:** una página de `N` productos ejecuta aproximadamente `1 + 3N` consultas D1, incluso si las relaciones no se muestran en esa vista. Las consultas paralelas reducen tiempo secuencial, pero no el número de operaciones ni presión/concurrencia sobre D1.

**Cierre requerido:** separar modelo compacto de listado de la hidratación completa de producto; para detalle, cargar relaciones con consultas por lote para todos los IDs de la página. Medir lista, búsqueda y página de detalle con tamaños representativos.

### H-08 | Medio | Búsqueda administrativa con `LIKE '%texto%'` y filtros sin índices dirigidos

**Evidencia:** [D1AdminOrderListRepository.ts](../apps/api/src/modules/orders/infrastructure/persistence/d1/repositories/D1AdminOrderListRepository.ts) busca con comodín inicial en ID, nombre, correo y teléfono. La migración base de órdenes [0001_init.sql](../apps/api/src/modules/orders/infrastructure/persistence/d1/migrations/0001_init.sql) declara índices de cliente, estado y fecha, pero no índices dedicados para `payment_status`/`payment_method` ni la combinación de filtros con orden por fecha. `LIKE` con comodín inicial no suele aprovechar índices B-tree.

**Impacto:** lectura proporcional al volumen de pedidos para búsquedas administrativas y filtros; el coste crece con historial.

**Cierre requerido:** limitar longitud y frecuencia de búsqueda; definir requisitos de búsqueda (prefijo exacto, email/teléfono normalizado o FTS) y escoger índice acorde. Añadir índices compuestos solo tras revisar consultas con `EXPLAIN QUERY PLAN` en staging y medir escritura/almacenamiento adicional. Considerar keyset pagination para tablas grandes en vez de OFFSET profundo.

### H-09 | Medio | Relay concatena identificadores de tabla SQL

**Evidencia:** [OutboxRelayService.ts](../apps/api/src/platform/outbox/OutboxRelayService.ts) interpola `tableName` en `FROM` y `UPDATE`. Los callers revisados usan literales internos fijos; no hay evidencia de que hoy venga del request, así que **no se clasifica como SQL injection explotable en el flujo actual**.

**Impacto:** riesgo de mantenimiento y futura inyección si se reutiliza el servicio con valores no confiables; también permite nombres fuera de los prefijos esperados si se pasa mal desde código.

**Cierre requerido:** reemplazar el string por un enum/mapa cerrado de tablas y metadatos de productor, validado internamente; probar que valores desconocidos se rechazan. Los parámetros `.bind()` protegen valores, no nombres de tabla.

### H-10 | Medio | Costo de upload R2 y caché de medios por confirmar

**Evidencia:** [MediaController.ts](../apps/api/src/bff/controllers/media/MediaController.ts) limita multipart a 11 MiB y convierte el archivo a `Uint8Array`; [UploadMediaUseCase.ts](../apps/api/src/modules/media/application/use-cases/UploadMediaUseCase.ts) procesa la imagen, escribe a R2 y hace `HEAD` para verificar tamaño. [R2MediaStorageAdapter.ts](../apps/api/src/modules/media/infrastructure/storage/r2/R2MediaStorageAdapter.ts) usa `put/get/head/delete` y lista hasta 1.000 objetos por página.

**Evaluación:** la verificación `HEAD` aumenta operaciones, pero está exigida por SEC-R2-07 y no debe quitarse sin un control equivalente. El límite hace el uso de memoria acotado por request, aunque parser, array buffer y conversión pueden elevar el pico concurrente. La respuesta pública declara `max-age=31536000, immutable` con IDs inmutables, lo cual es coherente; no se confirmó que exista caché en edge para `/media/*` ni la configuración de bucket/lifecycle remota.

**Cierre requerido:** medir bytes y duración de procesamiento, concurrencia, operaciones R2 por upload/lectura y cache hit ratio; confirmar que el bucket no es público (`r2.dev`/dominio), que los privados no se listan ni sirven por la ruta pública, y que lifecycle no borra documentos. Mantener el `HEAD` o reemplazarlo solo por una garantía verificable de tamaño. Aplicar cache de edge únicamente con claves inmutables y sin cachear respuestas privadas.

### H-11 | Medio | Observabilidad de backlog, errores y consultas no demuestra salud integral

**Evidencia:** Wrangler habilita logs y define Analytics Engine, Queue/DLQ y Cron en [apps/api/wrangler.jsonc](../apps/api/wrangler.jsonc). Esta revisión no halló evidencia operativa para backlog/edad de outbox, porcentaje de eventos rechazados, p95 de queries, errores D1/R2 o alertas asociadas. Una binding configurada no prueba que el dataset reciba métricas ni que haya alertas.

**Cierre requerido:** publicar métricas agregadas y sin PII: latencia/cantidad D1 por operación, edad y tamaño de outbox pendiente/failed, reintentos, ACK/retry/DLQ, éxito y duración R2, errores y cache hits. Crear dashboards y umbrales de alerta; probar que disparan en staging.

### H-12 | Medio | Staging y recuperación no están certificados

**Evidencia:** [ROLLBACK_RECOVERY.md](../ROLLBACK_RECOVERY.md) declara estado de preparación pendiente; [wrangler.staging.jsonc](../apps/api/wrangler.staging.jsonc) conserva IDs placeholder de D1/KV y la documentación advierte que no se ha ejecutado ensayo formal de rollback/restauración.

**Impacto:** sin entorno aislado no existe un lugar válido para probar migraciones, fallos de Queue, restauración o carga sin tocar producción.

**Cierre requerido:** provisionar Worker/D1/R2/KV/Queues/DLQ y rate limits exclusivos de staging; verificar sandbox y secretos. Ensayar migración, backup/restore, rollback, replay idempotente, reconciliación de pagos y coherencia R2. Guardar evidencia fechada y responsable antes de marcar la fase completa.

## 4. Controles positivos confirmados en código

- Las consultas D1 examinadas usan `.bind()` para valores; no se encontró concatenación directa de valores request en el SQL de esos repositorios.
- [GetMediaAssetUseCase.ts](../apps/api/src/modules/media/application/use-cases/GetMediaAssetUseCase.ts) rechaza `isPrivate` antes de leer el objeto R2; por ello no se confirma exposición pública de media privada por `GET /media/:id`.
- [UploadMediaUseCase.ts](../apps/api/src/modules/media/application/use-cases/UploadMediaUseCase.ts) valida magic bytes/extensión, limite de bytes, alt text, procesa/decodifica la imagen y elimina el objeto si no registra metadatos.
- [AuthMiddleware.ts](../apps/api/src/bff/middleware/AuthMiddleware.ts) verifica tipo de actor, permisos y MFA para admin; [SecurityHeadersMiddleware.ts](../apps/api/src/bff/middleware/SecurityHeadersMiddleware.ts) declara CSP, HSTS, `nosniff` y `Referrer-Policy`.
- [CsrfProtectionMiddleware.ts](../apps/api/src/bff/middleware/CsrfProtectionMiddleware.ts) rechaza `Origin` distinto, `Sec-Fetch-Site: cross-site` y requests con cookie de sesión que omiten Origin.
- La configuración de Queue declara retries y DLQ; la brecha es de handlers y semántica, no ausencia del binding.

Estas observaciones son de código/configuración; no certifican configuración de zona, permisos de cuenta Cloudflare o comportamiento desplegado.

## 5. Plan por fases para cerrar brechas

### Fase 0 | Preparar evidencia y entorno seguro

1. Provisionar staging aislado con recursos distintos a producción y ejecutar el check de configuración (`pnpm staging:check`) cuando el entorno tenga Node/pnpm.
2. Crear dataset no sensible con volúmenes representativos de catálogo, pedidos, líneas y eventos.
3. Capturar baseline: p50/p95/p99 por endpoint, número de consultas D1, `EXPLAIN QUERY PLAN`, tamaño/edad de outbox, operaciones R2, cache hit ratio y errores.
4. Confirmar backups disponibles, restauración posible y responsable de operaciones. No probar restauración ni migraciones destructivas en producción.

**Salida:** staging funcional, baseline reproducible y plan de recuperación aprobado.

### Fase 1 | Cerrar XSS CMS

**Estado al 2026-11-07:** cerrada en código; validada en Node/Vitest y en `workerd` local. La comprobación de deployment/contenido de producción queda fuera del alcance de este entorno.

1. `xss` con allowlist y reglas explícitas de tags, atributos, esquemas, links e imágenes compatible con Workers.
2. Sanitización común de bloques al crear/actualizar y al hidratar páginas históricas; blog saneado al guardar e hidratar. Texto, FAQ y atributos no HTML se escapan al renderizar.
3. Pruebas adversariales para referencias codificadas, handlers, SVG/MathML, markup malformado/nested, protocol-relative, imágenes remotas y rich text benigno.
4. Prueba de ruta que crea una página con permiso `cms:create` y comprueba el HTML SSR; pruebas Workers verifican filas heredadas de D1 para página y blog.
5. No se hizo backfill ni republicación de producción. Las filas legadas se sanea al leer y antes de SSR; un backfill administrativo puede hacerse después si se necesita limpiar el almacenamiento persistente.

**Gate:** aprobado para código y runtime local: typecheck, arquitectura, 216 tests unitarios y 27 tests Workers pasan. No se afirma que el deployment de producción esté actualizado ni se inspeccionó su D1.

### Fase 2 | Hacer confiable el pipeline de eventos

1. Inventariar todas las tablas/productores outbox y clasificarlos como activos, retirados o pendientes; documentar quién consume cada evento.
2. Unificar envelope/versionado y schemas Zod. Crear registry explícito producer/event/version -> handler.
3. Deshabilitar emisión de eventos sin consumer operativo. Rechazar/cuarentenar tipos desconocidos; nunca ACKearlos como éxito sin acción definida.
4. Establecer idempotencia persistente por `eventId` en efectos; hacer compatibles retries, replay y DLQ.
5. Resolver la ventana send/update y solapamientos: claim con lease/expiración o estrategia equivalente, estado condicional y recuperación de leases vencidos.
6. Añadir métricas/alertas para backlog, edad, fallos, eventos en DLQ y eventos desconocidos.
7. Probar envío exitoso, fallo antes/después del send, ejecución concurrente, redelivery, DLQ y replay.

**Gate:** ningún evento de negocio se pierde por ACK desconocido; reintentos no duplican efectos; backlog/DLQ es observable.

### Fase 3 | Atomizar agregados D1

1. En `catalog`, preparar las sentencias del producto y sus categorías/imágenes/cobertura en un mismo batch prefijado `catalog_*`.
2. En `orders`, preparar pedido, líneas y estado auxiliar del agregado en un batch prefijado `orders_*`; coordinar outbox en la misma transacción cuando corresponda.
3. Verificar límites de D1 batch, límites de input y protección contra operaciones excesivamente grandes.
4. Añadir fault injection a cada paso y comprobar rollback total; preservar la regla de no mezclar prefijos entre batches.

**Gate:** toda operación completa o falla sin dejar pedido/producto ni relaciones parcialmente aplicadas.

### Fase 4 | Optimizar lecturas D1

1. Crear DTO/query de lista de producto que no hidrate relaciones no visibles.
2. Cargar categorías, imágenes y coverage por lote de IDs, no por producto.
3. Cambiar lista administrativa de pedidos para que devuelva solo columnas necesarias y cargar líneas en la vista de detalle.
4. Medir el conteo global de estados: eliminarlo de cada página si no es necesario, cachearlo brevemente o separarlo de la consulta paginada.
5. Definir semántica de búsqueda de pedidos; eliminar `LIKE '%...%'` si el producto no requiere substring, o usar una estrategia de búsqueda/index adecuada.
6. Ejecutar `EXPLAIN QUERY PLAN` para consultas reales en staging; proponer índices compuestos según filtros/orden más frecuentes. Revisar costo de índices en escritura y tamaño D1.
7. Evaluar keyset pagination para tablas grandes y controlar límites máximos de página.

**Gate:** los requests D1 de listas no crecen linealmente con filas; planes no muestran scans/sorts evitables para consultas de alto volumen; mejora medida contra baseline.

### Fase 5 | Optimizar y certificar R2

1. Verificar bucket privado, bindings de mínimo privilegio y ausencia de acceso público directo.
2. Probar upload autorizado, rechazo de formatos/tamaños inválidos, limpieza tras fallo, lectura pública de media pública y rechazo de media privada.
3. Medir el pico de memoria bajo concurrencia y costo de `put + head`; conservar la verificación de tamaño exigida por política.
4. Confirmar cache para contenido público inmutable en edge; nunca compartir cache entre claves privadas o usuarios.
5. Definir lifecycle por prefijo y retención: medios huérfanos públicos separados de facturas/documentos privados; validar con listado de staging antes de activar borrado.
6. Ejecutar reconciliación D1/R2 y documentar cómo se recuperan objetos faltantes sin exponer claves privadas.

**Gate:** pruebas de privacidad y consistencia pasan; lifecycle y cache se verifican en staging con evidencia.

### Fase 6 | Carga, seguridad y operación

1. Ejecutar tests unitarios, Workers/Miniflare, aislamiento de tablas y arquitectura después de cada fase.
2. Ejecutar prueba de carga gradual desde staging para catálogo, búsqueda, pedidos, checkout y media; establecer SLOs a partir de baseline, no de supuestos.
3. Revisar permisos de cada ruta admin, aislamiento entre clientes, CSRF, headers, límites de body/rate, pagos y redacción de logs.
4. Ensayar Queue/DLQ, Cron, rollback de Worker y restauración en staging; reconciliar pagos sandbox y objetos.
5. Confirmar que CI y protección de rama bloquean fallos; registrar commit, config, métricas y evidencia del ensayo.
6. Solo entonces planear release productivo con migraciones compatibles y rollback probado.

**Gate final:** suites verdes, sin eventos desconocidos descartados, sin escrituras agregadas parciales, presupuesto de latencia acordado, backup/restore ensayado y operación Cloudflare observada.

## 6. Orden recomendado de ejecución

1. Fase 0: asegurar staging y baseline.
2. Fase 1: cerrar XSS CMS (prioridad de seguridad).
3. Fase 2: impedir ACK/pérdida silenciosa y hacer consumidores idempotentes.
4. Fase 3: atomizar órdenes y catálogo (integridad de ventas).
5. Fase 4: reducir N+1 y optimizar índices/búsqueda con planes medidos.
6. Fase 5: certificar R2, cache y retención.
7. Fase 6: pruebas de carga, recuperación y gate de release.

No se recomienda añadir índices en lote ni cambiar políticas de borrado R2 antes de capturar planes, cardinalidades y prefijos/datos reales de staging.

## 7. Lista de cierre verificable

- [x] Sanitizador CMS con allowlist/parser y regresiones contra bypass por entidades; prueba Workers confirmada localmente. Producción sin verificar.
- [ ] Todos los eventos publicados tienen handler versionado; eventos desconocidos no se ACKean como éxito.
- [ ] Productor/relay/consumer documenta entrega at-least-once, deduplicación y recuperación ante solapamiento.
- [ ] Outbox backlog/edad/fallos/DLQ medidos y alertados.
- [ ] Guardado de pedido y producto es transaccional dentro de su prefijo; fault tests no dejan filas parciales.
- [ ] Lecturas de catálogo y pedidos no tienen consultas por fila; conteos y búsqueda justificados por medición.
- [ ] Índices añadidos solo con `EXPLAIN QUERY PLAN` y comparación de rendimiento/costo.
- [ ] Bucket R2 privado y políticas lifecycle/cache verificadas en staging; medios privados rechazados en rutas públicas.
- [ ] Suites `typecheck`, `test`, `test:workers`, `test:isolation`, `test:architecture`, migraciones y lint ejecutadas y archivadas.
- [ ] Staging, backup/restore, rollback y reconciliación de pagos probados antes del release.

## 8. Resultado de esta auditoría

**Prioridad inmediata:** corregir H-01 y H-02.  
**Prioridad de integridad:** H-03, H-04 y H-05.  
**Prioridad de rendimiento:** H-06 a H-08, midiendo primero el entorno de staging.  
**Prioridad operativa:** H-10 a H-12.

Este documento no modifica código ni infraestructura y no afirma que la base, Queue o bucket de producción estén actualmente afectados; describe los riesgos que se desprenden del código revisado y el trabajo necesario para comprobar/cerrarlos de forma segura.
