# Progreso: precios, margen, IVA y costos de pago

## Fases

1. **Diagnóstico y compatibilidad — completada.** Confirmado que el catálogo v1 guardaba precios antes de IVA, checkout lo añadía, la factura lo reconstruía y los snapshots de pedidos/facturas eran inmutables. En producción la tasa configurada leída fue 19%.
2. **Dominio y persistencia — completada.** Precio proveedor, margen objetivo, métodos permitidos, versión de precio y precio anterior; snapshot de IVA y estimación por pedido; flag fiscal de factura; ledger de costos de liquidación.
3. **Cálculo y checkout — implementada.** Precio recomendado calculado en servidor para margen sobre venta neta; cargo fijo Wompi de $700 explícito una vez por pedido online; IVA incluido para productos v2; métodos de pago intersectados por todas las líneas; el checkout informa el cargo Wompi y no calcula IVA en línea aparte para producto v2.
4. **Transición y conciliación — implementada con paso administrativo.** Vista previa con fingerprint y confirmación para convertir productos v1, conservando el precio anterior. Los costos reales pueden registrarse con referencia de reporte para pedidos Wompi aprobados y compararse con estimación.
5. **Documentación y validación — completada en local.** ADR, reglas, rollback, manifiesto, tests y este registro actualizados.

## Migraciones D1

- `catalog__0004_product_pricing.sql` — aplicada y verificada en producción; esquema aditivo, no convierte productos automáticamente.
- `orders__0003_pricing_snapshots.sql` — aplicada y verificada en producción.
- `invoicing__0002_tax_included.sql` — aplicada y verificada en producción.
- `payments__0004_settlement_costs.sql` — aplicada y verificada en producción; tabla vacía.
- Bookmark anterior: `00000266-000000e0-00005104-627c6de1a2d6f60d6b950aef18301ef6`.
- Bookmark posterior: `00000266-00000106-00005104-619b6cb14d8e3317ab1bc3e062828c78`.
- Producción: 8 productos permanecen en v1. Ningún precio, pedido, factura ni pago fue modificado.

## Archivos modificados y creados

Incluyen `README.md`, `SECURITY_RULES.md`, `ROLLBACK_RECOVERY.md`, `docs/adr/ADR-0015-precio-final-margen-y-costo-de-pago.md`, `docs/migrations/manifest.md`, módulos `catalog`, `orders`, `invoicing`, `payments`, vistas/controladores/gateways del BFF, migraciones fuente y copias generadas, tests unitarios/Workers y `scripts/verify-migration-upgrades.py`.

## Pruebas ejecutadas

- `pnpm typecheck` — aprobado.
- `pnpm lint` — aprobado; arquitectura e imports limpios, límite 200 líneas.
- `pnpm test` — 36 archivos, 92 pruebas aprobadas.
- `pnpm test:workers` — 3 archivos, 12 pruebas aprobadas.
- `pnpm db:test-migrations` — esquema vacío y upgrades previos aprobados; comprobó preservación de precios v1 y snapshots históricos.
- `pnpm db:test-wrangler-migrations` — 34 migraciones aplicadas en D1 temporal desde cero y segunda pasada idempotente.
- `pnpm db:check-migrations` — fuentes y copias coinciden.
- `pnpm test:isolation` — aprobado.
- Wrangler D1 remoto — ledger y esquema verificados tras aplicar las cinco migraciones aditivas; `orders__0004` dejó 12 pedidos previos con cargo cero.

## Pendientes

- Revisar y aplicar la vista previa administrativa para convertir los ocho productos históricos. Esto cambia precios publicados (conserva el importe previo como base y suma IVA configurado); no se ha ejecutado en producción.
- Cargar costos de proveedor reales para los ocho productos para que el panel pueda recomendar precios con margen del 20%; no se inventaron costos.
- Registrar comisiones liquidadas usando referencias de reportes reales de Wompi cuando existan. La tabla está vacía; no se simuló una liquidación.
- No existe integración Mercado Pago; no se ofrece como método habilitable.
- La tarifa Wompi (4,09% + $700 + IVA de comisión como escenario conservador) es configuración de código y requiere revisión cuando cambie el contrato comercial.


## Actualización de cargo transaccional checkout

- El pago Wompi suma $700 COP por pedido como cargo explícito, autoritativo en servidor; contra entrega suma $0.
- Se añadió `transaction_fee_cents` a la orden vía `orders__0004_checkout_transaction_fee.sql`, aplicada y verificada en D1 producción (12 pedidos previos, todos con cargo cero).
- El precio recomendado ahora estima porcentaje Wompi sobre producto + envío y reconoce que los $700 fijos se muestran al comprador; estima IVA de la comisión.
- El checkout actualiza total y etiqueta del cargo al cambiar medio de pago. El snapshot se imprime en el PDF y correo de factura, y aparece en panel y resultado de compra.
- Verificación de migrations local vacío e idempotente aprobada (34); Workers 12/12; unit tests 92/92; aislamiento y consistencia de migraciones aprobados.

- Commit `c364eb8` en `main`, push completado. Cloudflare no mostró un deployment nuevo después del push; se publicó explícitamente con `pnpm --filter @ecommerce/api run deploy` (versión `c0d2aeac-0e54-48dc-9cee-94dd1e4f9799`).
- Verificación posterior: `/health` devolvió `healthy` con D1, KV, Queue y R2 en `ok`; `wrangler deployments list` mostró el nuevo release al 100%.

## Entrada de importes en el panel

- Campos de COP del panel usan pesos completos, separador de miles automático y conversión a centavos internos solo al serializar. No se muestran importes en centavos en los formularios.
- `140000` se presenta `140.000`; al pegar `140,000.00` se interpreta como $140.000. Decimales diferentes de cero se rechazan para evitar confusiones con centavos.
- Incluye costo/precio de producto, tarifas de envío, recaudo COD, liquidaciones Wompi, notas crédito, descuentos fijos y compra mínima de cupones. Porcentajes siguen admitiendo decimales sin formato COP.
- Pruebas: `pnpm lint`, `pnpm typecheck`, `pnpm test` (37 archivos, 96 tests), `wrangler deploy --dry-run` (bindings y bundle válidos).

## Corrección de vista previa y desglose de precio del producto

- La vista previa de conversión histórica (`POST /api/v1/admin/products/pricing-migration/preview`) es de solo lectura y ya no se envía al middleware de auditoría como si fuera una mutación; esa clasificación intentaba leer un estado previo inexistente y bloqueaba la operación con 503. La excepción aplica solo a esa ruta y método. La aplicación de la conversión sigue requiriendo snapshot y auditoría.
- El panel del producto muestra precio bruto recomendado (IVA incluido), IVA estimado, costo del proveedor, costo Wompi estimado después de descontar los $700 cobrados una vez al comprador, ganancia neta estimada y margen sobre venta sin IVA. El envío queda explícitamente fuera del precio del producto y el desglose aclara que el cargo transaccional aparece en checkout.
- Archivos modificados: `AdminMutationAuditMiddleware.ts`, `renderAdminDashboardCss.ts`, `renderProductFormCard.ts`, `renderProductFormsScript.ts`, `admin-mutation-audit.test.ts`; se añadió `product-price-breakdown-view.test.ts`.
- Pruebas ejecutadas: `pnpm lint` y `pnpm typecheck` correctos; `pnpm test` correcto (38 archivos, 98 tests); `git diff --check` correcto.
- `wrangler deploy --dry-run` reconoció los bindings configurados. Commit `390c3ca` fue enviado a `main`; no apareció una versión nueva por el push, así que se desplegó explícitamente a Cloudflare: versión `24d2bcc8-bd54-4b3d-9ada-97e190e7408c` al 100%.
- Verificación posterior: `/health` devolvió `healthy` y D1, KV, Queue y R2 en `ok`. No se modificaron ni migraron datos.

## Protección contra bloqueo al calcular márgenes extremos

- Causa reproducida: al teclear 99%, el precio con Wompi nunca puede alcanzar ese margen por su comisión porcentual. El cálculo doblaba el límite superior indefinidamente, congelando el hilo del navegador y provocando el aviso de página sin respuesta.
- El panel ahora calcula el umbral teórico Wompi antes de buscar el precio, borra el precio anterior y presenta un mensaje si el margen no se puede alcanzar. También limita búsquedas que excedan el rango numérico.
- El servicio de dominio aplica la misma validación y límite, así que una petición directa a la API tampoco puede iniciar un bucle sin fin. El cálculo de precios se separó a `renderProductPricingScript.ts` para conservar el máximo de 200 líneas por archivo.
- Archivos: `CalculateRecommendedPrice.ts`, `renderProductPricingScript.ts` (nuevo), `renderProductFormsScript.ts`, `renderAdminDashboardPage.ts`, `recommended-price.test.ts`, `product-price-breakdown-view.test.ts`.
- Pruebas: `pnpm lint`, `pnpm typecheck` y `pnpm test` correctos (38 archivos, 100 tests); `git diff --check` correcto. No se modificaron datos.
- Commit `8ae73da` enviado a `main`; al igual que en el push previo no se creó automáticamente una versión, así que desplegué manualmente la versión `c775ca84-4164-4632-a5df-2c6cc993ff40`.
- `/health` confirmó `healthy`, con D1, KV, Queue y R2 en `ok`.

## Objetivo de ganancia porcentual o fijo

- El formulario de producto deja elegir margen sobre venta o ganancia neta fija en pesos COP. El campo fijo usa separadores de miles y, en ambos modos, muestra precio bruto, IVA, costo, comisión Wompi estimada, ganancia estimada y margen real.
- El servidor calcula el precio autoritativamente y D1 guarda `pricing_target_type` y `target_profit_cents`. `catalog__0005_profit_target_pricing.sql` agrega ambos campos con defaults/restricciones: los productos existentes siguen en modo porcentaje; no se tocaron precios.
- Se actualizó edición/carga del producto, validación, gateway, repositorio y mapper D1. Los endpoints públicos omiten costo y objetivos internos para no exponer el margen o la ganancia deseada; el panel admin conserva acceso a esos datos.
- Archivos de migración fuente y copias: `apps/api/src/modules/catalog/infrastructure/persistence/d1/migrations/0005_profit_target_pricing.sql`, `apps/api/migrations/catalog__0005_profit_target_pricing.sql`, `migrations/catalog__0005_profit_target_pricing.sql`. Manifiesto y matriz de esquema actualizados. Rollback: conservar columnas y ledger; el Worker previo las ignora.
- Verificaciones: `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 archivos, 103 tests), `pnpm test:workers` (4 archivos, 13 tests), `pnpm db:check-migrations`, `pnpm db:test-migrations`, `pnpm db:test-wrangler-migrations` (35 migraciones desde vacío, idempotentes), `git diff --check`.
- Producción: ledger mostraba las 34 migraciones anteriores; se aplicó solo `catalog__0005_profit_target_pricing.sql`. Consulta posterior confirmó ledger y columnas; los 8 productos conservan modo `margin`, cero objetivos fijos, y 7 siguen con `pricing_version=1`.
- Commit `4392264` enviado a `main`. El push no produjo un deployment nuevo; se publicó el Worker `ab9e970a-967c-4947-a2d3-fc1309cbd753`. `/health` devolvió `healthy` y D1/KV/Queue/R2 en `ok`. Consulta pública en vivo devolvió 200 sin costo proveedor, modo ni ganancia objetivo.

### Métodos de pago por producto y checkout (2026-10-13)

- Corregido el formulario de catálogo: contra entrega queda definida por el selector comercial “Contra Entrega” y genera el método `cash_on_delivery`; se eliminó la casilla duplicada que podía dejar una lista vacía y disparar “Validación fallida”. Guardar un producto sin ningún medio muestra ahora el motivo antes de llamar a la API.
- El checkout calcula los medios comunes de todos los productos al renderizar. Si Wompi no está habilitado en cada producto, inicia con Wompi bloqueado, COD seleccionado como única opción (pendiente de cobertura) y sin mostrar la tarifa fija Wompi. El borrador no puede volver a seleccionar un medio que el producto excluye.
- El servidor conserva los medios de pago en la evaluación final del pedido y rechaza cualquier método que no esté permitido por todos los productos. COD solo se habilita cuando también permiten las reglas del producto y la zona de envío.
- Verificaciones: `pnpm test` (40 archivos, 108 tests), `pnpm test:workers` (4 archivos, 13 tests), `pnpm lint`, `pnpm typecheck`, `git diff --check`. Sin cambios de esquema.
- Commit `270d36a` enviado a `main`; Wrangler publicó el Worker `0ac5a858-3f5d-4a20-b2bd-1adfc85b7881`. `/health` posterior devolvió `healthy` con D1/KV/Queue/R2 en `ok`. No se hicieron consultas ni escrituras en D1 de producción.

### Compatibilidad de contra entrega con productos sin Wompi (2026-10-13)

- Corregido un caso legado: `allowed_payment_methods=[]` por sí solo ya no desactiva contra entrega si la política propia del producto dice que COD está permitido. Wompi sigue dependiendo exclusivamente de `allowed_payment_methods` y la cobertura COD sigue dependiendo de producto y zona.
- El panel carga “Contra Entrega” desde `salePolicy.allowsCashOnDelivery` sin exigir el antiguo elemento duplicado `cash_on_delivery`; al guardar reconstruye la lista canónica. El checkout público decide COD desde esa misma política, evitando mostrar “Ningún medio de pago” para ese estado legado.
- Agregadas regresiones para lista vacía heredada, checkout COD-only y creación autoritativa del pedido sin comisión Wompi.
- Verificaciones: `pnpm test` (40 archivos, 110 tests), `pnpm test:workers` (4 archivos, 13 tests), `pnpm lint`, `pnpm typecheck`, `git diff --check`, Wrangler deploy dry-run. Sin cambios de esquema ni escrituras en D1.
- Commit `65a74ba` enviado a `main`; Worker publicado como `bc8dfab4-ae53-4f3f-9fea-ec690388e284`. `/health` posterior respondió `healthy` con D1/KV/Queue/R2 en `ok`. No se tocaron migraciones ni datos de producción.

### Rediseño del resumen del panel administrativo (2026-10-13)

- Se aplicó la referencia de `Resumen-html.zip` al marco del panel: navegación lateral adaptable, cabecera, tipografía, paleta clara y tarjetas de resumen. El resumen usa conteos ya cargados del catálogo y banners; los pedidos recientes vienen de `/api/v1/admin/orders`, que mantiene la autorización existente.
- La vista anterior de cada módulo quedó dentro del panel de administración con sus identificadores, campos, formularios, acciones y scripts existentes. No se modificaron controladores, casos de uso, gateways, D1 ni reglas de negocio.
- Se añadió prueba de renderizado para la vista nueva, la presencia de controles legacy y el escape de la etiqueta administrativa.
- Verificaciones: `pnpm typecheck`, `pnpm lint`, `pnpm test` (41 archivos, 112 pruebas), `pnpm test:workers` (4 archivos, 13 pruebas), build Worker `wrangler deploy --dry-run` y `git diff --check`. No se efectuaron cambios de esquema ni escrituras de producción.
- Commit `04ee346` enviado a `main`. El push no produjo un deployment; se publicó explícitamente el Worker `1660e4aa-6fcc-457a-8ca6-d1a05b6b1522`.
- `/health` posterior respondió `healthy` con D1, KV, Queue y R2 en `ok`. No se hizo comprobación visual en navegador; la evidencia de esta pasada es el renderizado de servidor, las pruebas automatizadas y el bundle de Worker.

### Rediseño de la sección administrativa Pedidos (2026-10-13)

- Se adaptó la sección Pedidos a la referencia: cabecera, filtros por estado, búsqueda, método y pago, tabla compacta, total filtrado y estados vacíos. Los conteos y filas se calculan desde `/api/v1/admin/orders`; no se copiaron los ejemplos estáticos del ZIP.
- Se añadió exportación CSV del subconjunto visible, con campos protegidos ante fórmulas de hoja de cálculo. Se mantuvieron el detalle del pedido, los datos de cliente/dirección, desglose fiscal y financiero y los cambios de estado existentes.
- Archivos: render de sección y modal de detalle, scripts administrativos de lista/filtros, CSS del panel, pruebas de presentación y este registro. Sin cambios en controladores, endpoints, dominio, D1 o reglas de acceso.
- Verificaciones: `pnpm typecheck`, `pnpm lint`, `pnpm test` (42 archivos, 114 pruebas), `pnpm test:workers` (4 archivos, 13 pruebas), `wrangler deploy --dry-run` y `git diff --check`.
- Commit `d96e27c` enviado a `main`. El push no produjo un deployment; se publicó explícitamente el Worker `b0a93065-1030-4d2f-bf80-17c07f644c92`.
- `/health` posterior respondió `healthy` con D1, KV, Queue y R2 en `ok`. No se hizo comprobación visual automatizada: no hay Chromium instalado en el entorno.

### Rediseño de Inventario administrativo (2026-10-13)

- Se adaptó Inventario a la referencia visual: métricas de stock total/disponible/reservado y alertas, filtros por nivel, búsqueda, exportación CSV y panel de movimientos recientes. La tabla conserva la cantidad total, reservada y disponible; los ejemplos estáticos del ZIP no se copiaron.
- Se rehízo el modal de ajuste con entrada, salida y corrección, motivo, nota, vista previa del total, validación de enteros, límites del endpoint y foco/teclado accesibles. Por compatibilidad con la ruta existente, el frontend convierte el movimiento a stock total y lo envía en `deltaQuantity`, nombre heredado del contrato actual; no se cambió API ni backend.
- El historial se lee de la bitácora administrativa autorizada y solo muestra mutaciones de ajuste completadas. Cuando la sesión carece de `audit:read`, el panel informa que el historial no está disponible. Sin nuevas rutas ni cambios de permisos.
- Pruebas: presentación/render y sintaxis del script; `pnpm typecheck`, `pnpm lint`, `pnpm test` (43 archivos, 116 pruebas al momento de esa ejecución), `pnpm test:workers` (4 archivos, 13 pruebas), `pnpm test:architecture`, `wrangler deploy --dry-run`, `git diff --check`. Se añadió una aserción adicional del panel general después de correr la suite completa; se reejecutará el test afectado antes del commit.
- No se modificó dominio, controlador, repositorio, esquema ni datos. Sin comprobación visual de navegador automatizada porque Chromium no está instalado en este entorno.
