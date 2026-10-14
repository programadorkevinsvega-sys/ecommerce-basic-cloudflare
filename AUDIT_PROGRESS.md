# Progreso: precios, margen, IVA y costos de pago

### Identidad y copyright del footer (2026-10-14)

- El nombre mostrado en el footer público y el checkout ahora sale de Nombre Comercial. Razón Social/Propietario y NIT aparecen en el bloque de marca, entre el nombre y la descripción “Productos seleccionados para acompañarte todos los días.”
- Añadí en Configuración el texto editable de derechos reservados. El footer compone `© año actual + nombre comercial + texto`; el año cambia automáticamente. Ajusté también el bloque de footer del checkout.
- Migración aditiva `settings__0004_footer_copyright.sql`, con valor inicial “Todos los derechos reservados.”, aplicada a producción con Wrangler; esquema reportó 38 migraciones conocidas al día.
- Pendientes de validar: vista visual en navegador. No se ejecutan pruebas automatizadas.

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
- Push no inició deployment automáticamente. Desplegué el Worker manualmente como `5fcbffec-9d0c-4dc8-86ce-c0e574480a5c`; `/health` posterior respondió `healthy` y D1/KV/Queue/R2 en `ok`. El despliegue no aplicó migraciones ni escribió datos de negocio.

### Reorganización de la navegación administrativa (2026-10-13)

- Actualicé los grupos Operación, Catálogo, Marketing y Sistema según la nueva jerarquía. Pagos y Recaudos son accesos separados; Recaudos abre el formulario existente. Productos, Categorías, Marcas, Proveedores, Atributos y Variantes llevan a sus secciones existentes. Marcas/Proveedores y Atributos/Variantes continúan compartiendo sus implementaciones actuales; no se agregaron módulos ni backend.
- Los contadores de Pedidos por atender e Inventario bajo/agotado se calculan desde las respuestas existentes de pedidos e inventario; no se codificaron los valores de ejemplo 6 y 3.
- Sin cambios de API, permisos, dominio o datos. Validación realizada: revisión del diff y `git diff --check`. No se ejecutaron pruebas automatizadas para este cambio de presentación.
- Commit `b0975a2` enviado a `main`; el push generó la versión Cloudflare `930e0f6a-087f-4ef9-aeb2-7bab8265b278`. `/health` respondió `healthy` y D1/KV/Queue/R2 `ok`.

### Ajuste visual de la navegación lateral (2026-10-13)

- La barra lateral mantiene todos los grupos en una sola columna en escritorio y móvil. Eliminé el desbordamiento con scroll propio vertical, el carrusel horizontal responsive y el desplazamiento horizontal de grupos. Los enlaces se compactaron para acercarse a la referencia; el contenido que exceda la ventana usa el desplazamiento normal de la página.
- Validación: diff revisado y `git diff --check`; no ejecuté pruebas automatizadas para este cambio CSS.
- Commit `5c3ce27` enviado a `main`; el push generó la versión Cloudflare `230de625-c3f7-431f-bea1-29fdf67027e6`. `/health` confirmó `healthy` con D1/KV/Queue/R2 `ok`.

### Vistas internas de Pagos (2026-10-13)

- Separé el contenido existente en tres páginas internas accesibles desde Pagos: Recaudos contra entrega, Conciliar liquidación Wompi y Transacciones recientes. Los formularios conservan sus IDs, validación, endpoints y llamadas actuales; no se alteró backend ni el flujo financiero.
- Pagos permanece como una única opción del menú lateral. Se añadió navegación interna con estado seleccionado, paneles exclusivos y adaptación móvil.
- Validación: diff revisado y `git diff --check`; no ejecuté pruebas automatizadas para este cambio visual.
- Commit `bb0d753` enviado a `main`; publiqué el Worker `fc1c3e42-964e-4c08-ad2a-3b6af9b45897` para asegurar la actualización. `/health` devolvió `healthy` con D1/KV/Queue/R2 en `ok`.

### Rediseño de Pagos, Envíos y Facturación (2026-10-13)

- Pagos conserva las tres vistas internas (recaudos, conciliación y transacciones) con estilos coherentes con las tarjetas y tablas nuevas del panel.
- Envíos y cobertura ahora presenta cabecera, formulario agrupado, selección DANE, tabla compacta de zonas y modal de detalle con estilo claro. Se conservaron los mismos controles, IDs, mensajes, acciones, datos DANE, y formularios de creación/edición.
- Facturación ahora tiene cabecera y tabla adaptable; mantiene consulta, ver/descargar PDF y emisión de notas crédito con los mismos endpoints, IDs y validaciones.
- Cambios solo de BFF/presentación y CSS; sin modificaciones de dominio, permisos, endpoints, D1 o datos. Diff revisado y `git diff --check`; no ejecuté pruebas automatizadas para el cambio de interfaz.
- Commit `b706dee` enviado a `main`; publiqué el Worker `07d11b99-5d34-49e3-9eff-48118c5b9c8a`. `/health` posterior respondió `healthy` y D1/KV/Queue/R2 `ok`.

### Corrección visual tras revisión de capturas (2026-10-13)

- Las vistas de Pagos, Envíos y Facturación heredaban el fondo, tarjetas y colores de texto oscuros del contenedor legacy. Añadí modos visuales claros al cambiar de pestaña, oculté la cabecera antigua duplicada y fijé contraste de títulos, formularios y tarjetas al mismo estilo de Pedidos/Inventario.
- Verificaciones: `pnpm typecheck`, `pnpm lint`, Wrangler deploy dry-run y `git diff --check`; no ejecuté pruebas automatizadas. Sin cambios de endpoints, lógica de negocio o datos.
- Commit `13aaffe` enviado a `main`; publiqué el Worker `a860fc50-acb4-411f-95c1-1abfdba1e46d`. `/health` posterior confirmó `healthy` con D1/KV/Queue/R2 `ok`.

### Jerarquía del menú Pagos y facturas (2026-10-13)

- Se integró un grupo de menú “Pagos y facturas” con cuatro accesos laterales: Recaudos contra entrega, Conciliar, Transacciones recientes y Facturación. Envíos y cobertura quedó como elemento independiente en Operación.
- Los tres accesos de pagos muestran su panel individual dentro del módulo existente; Facturación abre el módulo de facturas. Se retiró la navegación duplicada interna de Pagos. Conservados los endpoints y acciones actuales.
- Validación: diff revisado y `git diff --check`; no ejecuté pruebas automatizadas para este cambio de navegación.

### Reorganización jerárquica de Pagos y facturas (2026-10-13)

- El menú lateral ahora presenta el grupo “Pagos y facturas” con Recaudos contra entrega, Conciliar, Transacciones recientes y Facturación como opciones hijas independientes. Envíos y cobertura permanece por separado en Operación, igual que el grupo Catálogo conserva sus subsecciones.
- Los accesos laterales seleccionan el panel correspondiente dentro de Pagos; Facturación abre su pantalla existente. Quité la navegación interna duplicada del contenido de Pagos. Sin cambios de backend o permisos.
- Validación: diff revisado y `git diff --check`; no ejecuté pruebas automatizadas para este ajuste de navegación.
- Commit `5d0d921` enviado a `main`; publiqué el Worker `5fb078fe-03bd-48cb-8c62-0bb2daebcea8`. `/health` posterior respondió `healthy` con D1/KV/Queue/R2 `ok`.

### Listas de recaudos y conciliaciones (2026-10-14)

- Recaudos contra entrega ahora presenta primero la tabla de recaudos ya registrados y el botón “Crear nuevo recaudo”; el formulario abre en un modal. Conciliar muestra la lista de liquidaciones y “Crear conciliación” abre su formulario en otro modal.
- Las filas consumen las listas que ya devuelve `GET /api/v1/admin/payments`; se conservaron POST, permisos, validaciones y contratos existentes. No hubo cambios en backend de negocio, D1 ni datos.
- Validaciones: `pnpm typecheck`, `pnpm lint` (incluye arquitectura/límite 200 líneas), `git diff --check` y `pnpm --filter @ecommerce/api exec wrangler deploy --dry-run` pasaron. No se ejecutaron pruebas automatizadas para este cambio de presentación.
- Commit `022d28e` enviado a `main`. El push no generó deployment; publiqué con `pnpm --filter @ecommerce/api run deploy`, versión `e1a1f6e5-4220-49de-8af8-fd379c3b59f5`. `/health` respondió `healthy`, D1/KV/Queue/R2 `ok`.

### Modal de zonas y página de municipios DANE (2026-10-14)

- El formulario de crear/editar zonas de envío ahora se abre en modal desde la página de zonas. Añadí una página independiente de municipios DANE con búsqueda, estado de cobertura y acción para iniciar una zona individual con municipio y código DANE precargados.
- La página usa el catálogo de solo lectura que ya entrega el servidor y conserva las rutas/contratos existentes; no se añadieron endpoints ni escritura de municipios DANE porque el backend actual no ofrece esa operación.
- Validaciones: `pnpm typecheck`, `pnpm lint`, `git diff --check` y `pnpm --filter @ecommerce/api exec wrangler deploy --dry-run` pasaron. No ejecuté pruebas automatizadas ni verificación visual en navegador.
- Commit `d230059` enviado a `main`; Wrangler registró el deployment `31f90a82-db8e-48e1-a459-5c3f779d2bf5`. `/health` respondió `healthy`, D1/KV/Queue/R2 `ok`.

### Aclaración de cobertura municipal DANE (2026-10-14)

- Verifiqué D1 de producción en solo lectura: `shipping_divipola` contiene 48 municipios. Coincide con los 48 registros semilla de `shipping__0001_init.sql`; esa migración los define como ciudades/municipios principales y no como el catálogo DIVIPOLA completo. No faltó aplicar esa migración, pero los municipios restantes del país no están incluidos en el catálogo actual.
- La página municipal ahora diferencia zona local/metropolitana de cobertura nacional, permite iniciar una zona local aunque el municipio tenga respaldo nacional y explica que el catálogo es parcial. La lista de zonas identifica explícitamente los municipios resumidos como `+N municipios`.
- Validaciones: consulta D1 remota sin escrituras, `pnpm typecheck`, `pnpm lint`, `git diff --check` y dry-run de Wrangler pasaron. No se ejecutó prueba automatizada ni se añadieron registros/migraciones.
- Commit `fef04dc` enviado a `main`; Wrangler registró los deployments `e35012cd-5002-4c56-a022-1db65d46ab40` y `f0527ed2-49ba-47aa-b8cc-f48a552c8bde` tras el push. `/health` respondió `healthy` con D1/KV/Queue/R2 `ok`.

### Búsqueda y contexto de transacciones/facturas (2026-10-14)

- Transacciones muestra referencia de factura, nombre y correo del cliente junto a la referencia de pago, pedido, método, monto, estado y fecha. El frontend cruza las respuestas existentes de pagos, pedidos y facturas; cada API conserva su autorización y, si falta permiso de pedidos/facturas, esos datos quedan vacíos.
- Añadí búsqueda en transacciones por referencia, factura, pedido, nombre/correo y monto; y en Facturación por número de factura, pedido, cliente y total. Los COP se muestran en pesos enteros; la búsqueda reconoce también fracciones de montos históricos.
- Sin cambios de endpoints, permisos, backend de negocio o D1. Validaciones: `pnpm typecheck`, `pnpm lint`, `git diff --check` y dry-run de Wrangler pasaron. No ejecuté pruebas automatizadas ni visuales de navegador.
- Commit `3b3d871` enviado a `main`; Wrangler registró los deployments `a883b629-8a7b-431b-9a1e-4ab66401e172` y `9e760915-5351-4704-bce4-3c370373bfab` después del push. `/health` respondió `healthy` con D1/KV/Queue/R2 `ok`.
### Páginas institucionales CMS y rutas canónicas (2026-10-14)

- Consulta D1 remota de solo lectura: entre las diez rutas solicitadas, solo existe `terminos-y-condiciones` y está publicada. Esa página y su contenido no se modifican.
- Añadí una migración `cms__0002_institutional_pages.sql` para las nueve páginas ausentes, con borradores editables CMS. Los textos legales y de contacto quedan pendientes de completar/verificar; no se publican afirmaciones jurídicas ni canales inventados.
- Añadí rutas limpias canónicas, conservé `/p/:slug` y cambié la representación SSR a tarjetas/jerarquía visual del storefront actual. La ruta pública devuelve 404 para páginas CMS que no estén publicadas.
- Validaciones ejecutadas: `pnpm typecheck`, `pnpm lint`, `node scripts/check-migration-consistency.js` y `git diff --check`, todas correctas. No ejecuté pruebas automatizadas ni validación visual en navegador.
- `cms__0002_institutional_pages.sql` aplicada con el runner remoto después de desplegar el control de estado. La consulta posterior confirmó las nueve páginas en borrador con versión 1 y `terminos-y-condiciones` intacta/publicada. `/sobre-nosotros` devolvió 404 mientras sigue en borrador; las dos rutas de términos (`/terminos-y-condiciones` y `/p/terminos-y-condiciones`) devolvieron 200.
- Commit `7125966` enviado a `main`; el push no inició despliegue, por lo que se publicó con Wrangler, versión `5b42deb6-36c7-4edb-8f5d-e1218d74fb79`. `/health` respondió 200 con D1/KV/Queue/R2 `ok`.
### Navegación del footer para páginas CMS (2026-10-14)

- El footer ahora combina el menú editable existente con las páginas institucionales presentes en CMS, sin duplicar enlaces ya configurados. Las páginas publicadas abren su ruta canónica; las que siguen como borrador aparecen como “En preparación” y no apuntan a una página que daría 404.
- La página de Términos existente continúa publicada y activa. No fue necesario modificar D1 ni cambiar el contenido de los borradores.
- Validaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. Sin pruebas automatizadas ni revisión visual en navegador.
- Smoke test del Home desplegado confirmó los enlaces activos y los rótulos de borrador. En la última consulta de producción, `sobre-nosotros`, `terminos-y-condiciones` y `tratamiento-de-datos` están publicados; las otras siete páginas siguen como borrador y aparecen marcadas “En preparación”.
### Limpieza de enlaces del footer (2026-10-14)

- Quité la columna “Tienda” del footer y filtré sus enlaces de Inicio, Catálogo y Carrito del menú CMS del footer. La navegación de cabecera no cambia.
- Verificación de código y despliegue registrada después de ejecutar typecheck, lint y smoke test del Home.

### Datos de tienda en el footer (2026-10-14)

- Configuración ahora administra correo de soporte, NIT, razón social, dirección, ciudad, país y URLs de Instagram, TikTok y Facebook. Las redes se validan en servidor como HTTPS y solo aceptan dominios de su plataforma; sus iconos accesibles aparecen únicamente si hay URL configurada.
- El footer público y el footer del checkout leen el perfil persistido de Settings. Se muestran correo, teléfono si no es el valor de ejemplo, identificación tributaria, dirección y ubicación; no se inventan NIT, dirección, ciudad ni URLs. País queda inicializado como Colombia donde estaba vacío.
- Migración aditiva `settings__0003_storefront_contact_social.sql` aplicada a producción con el runner Wrangler autorizado; el esquema remoto indicó 37 migraciones conocidas y al día. Se registró en `docs/migrations/manifest.md` y `ROLLBACK_RECOVERY.md`.
- Verificaciones: `pnpm typecheck`, `pnpm lint`, `pnpm db:check-migrations` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni verificación visual en navegador para este cambio.
- Pendiente: publicar el Worker con los cambios de UI/renderizado y que el administrador complete los nuevos campos de ciudad, dirección, NIT y perfiles sociales donde falten.

### Errores al guardar Configuración (2026-10-14)

- El formulario no mostraba ningún mensaje cuando PATCH `/api/v1/settings` fallaba; por eso los errores de validación/autorización parecían un botón que no respondía. Ahora muestra estado de guardado, errores del servidor (incluidos los campos rechazados), errores de red y restaura el botón al terminar.
- Verificaciones: `pnpm typecheck`, `pnpm lint`, dry-run de Wrangler y `git diff --check`. No ejecuté pruebas automatizadas ni modifiqué la validación de dominios sociales o el backend.

### Datos de Configuración en las facturas (2026-10-14)

- La emisión de factura ya capturaba correo, razón social, NIT y dirección en el snapshot, pero el PDF omitía la razón social cuando había nombre comercial, no presentaba ciudad/país y usaba un correo de ejemplo como fallback. Ahora el snapshot incluye ciudad/país, y el PDF muestra por separado nombre comercial, razón social, NIT, dirección, ciudad/país y correo de soporte tomados de Configuración. El mismo PDF se adjunta al email de confirmación.
- Sin migración D1: `company` está serializado dentro del snapshot JSON y los nuevos campos son opcionales. Las facturas emitidas conservan su snapshot inmutable; los PDFs históricos no se reescriben al cambiar Configuración.
- Pendiente de validar una factura real nueva después del despliegue. No ejecuté pruebas automatizadas.

### Marcas del catálogo y búsqueda (2026-10-14)

- Confirmado en producción: `catalog_brands` tenía “Vega Eyewear”, mientras que `catalog_products.brand` contenía nombres independientes (incluida esa marca) y el índice FTS solo cubría nombre, descripción y SKU. `Marcas` lista `catalog_brands`; el formulario del producto era texto libre; la búsqueda de catálogo no consultaba `brand` y además ignoraba el filtro de estado cuando había texto de búsqueda.
- El formulario de producto ahora selecciona marcas registradas; ofrece valores históricos ya usados para no perder marcas al editar productos antiguos. El alta de marca genera slug mientras se escribe y permite editarlo; el servidor normaliza acentos también.
- La búsqueda incluye coincidencias de marca y aplica `status=published` a búsquedas públicas. No requiere migración: mantiene la columna de texto y el índice existentes.
- Una consulta D1 remota de solo lectura reprodujo la causa: FTS devolvió 0 filas para “Vega Eyewear”, mientras la consulta por `brand` encontró el producto publicado. Pendiente validación visual del flujo en navegador. No ejecuté pruebas automatizadas.

### Directorio y páginas públicas de marcas (2026-10-14)

- El CTA “Ver catálogo” en “Compra por línea” ahora lleva a `/marcas`. El directorio lista todas las marcas registradas y muestra nombre y descripción; cada marca abre `/marcas/:slug` con descripción y productos publicados que coinciden con esa marca.
- La administración de Catálogo permite guardar descripción al crear una marca y editar la descripción de marcas existentes. El endpoint de actualización requiere `catalog:edit` y registra la mutación en auditoría. Se reutiliza la columna `catalog_brands.description`; no requiere migración.
- Las tarjetas de marcas en Inicio enlazan a la página individual cuando la marca está registrada; los nombres históricos sin entidad conservan búsqueda de productos.
- Verificaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni verificación visual en navegador. Pendiente confirmar las páginas en el despliegue.

### Atributos seleccionables al crear productos (2026-10-14)

- El formulario de producto ahora recibe los atributos registrados. Los de tipo `select` muestran sus opciones; los de tipo texto y número muestran el control correspondiente.
- Los valores se guardan dentro de `specifications` usando el código del atributo, aparecen al editar el producto y continúan visibles en sus especificaciones públicas. No requiere cambio de esquema ni migración.
- La entidad independiente de variantes (combinaciones con SKU/stock/precio propios) no existe en el modelo actual; esta corrección asigna valores de atributos al producto existente y no simula una tabla de variantes.
- Verificaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni hice verificación visual en navegador.

### Rediseño de administración de Productos (2026-10-14)

- Productos abre con una lista diseñada al estilo de Inventario/Pedidos: resumen de catálogo, búsqueda, filtros por publicación, tabla y acción principal “Crear producto”.
- El formulario existente se presenta en un modal accesible para creación y edición, con cierre por botón, fondo o Escape, foco inicial y retorno de foco. Se conserva la lógica actual de precios, medios de pago, atributos, imágenes, envío, SEO y publicación.
- La herramienta de conversión de precios históricos continúa disponible en el listado. El cambio es de frontend y no requiere migraciones ni cambios de API.
- Verificaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni hice revisión visual en navegador.

### Ajuste de acentos heredados del modal de Productos (2026-10-14)

- Reemplacé los acentos azules heredados en filtros/acciones de Productos, foco de inputs, vista previa SEO y estado de imagen principal por tonos verdes y neutros del diseño actualizado. Sin cambios de lógica o API.
- Verificaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni hice revisión visual en navegador.

### Vistas independientes de taxonomías del catálogo (2026-10-14)

- Categorías, Marcas, Proveedores, Atributos y Variantes ahora abren vistas independientes desde la navegación y cada vista tiene su propia tabla, encabezado y formulario cuando hay operaciones existentes.
- Categorías, marcas y atributos muestran sus registros reales. El proyecto no tiene una entidad D1/API independiente para proveedores ni variantes con SKU/precio/stock propios; sus tablas muestran el estado vacío y explican esta limitación, sin copiar marcas ni inventar variantes.
- Sin cambios de backend o base de datos. Pendiente typecheck/lint y revisión visual; no se ejecutan pruebas automatizadas por instrucción vigente.

### Corrección de estilos heredados en Catálogo, Pagos y Facturas (2026-10-14)

- Las búsquedas de Pagos y Facturas ahora tienen selectores más específicos que la regla heredada de formularios oscuros; recuperan fondo blanco, texto legible, borde y foco coherentes con Envíos.
- El botón principal de Catálogo pasa al tono verde usado por las vistas recientes.
- No se añadieron botones ficticios: Catálogo aún carece de operaciones completas de edición/estado para varias entidades. Los recaudos y conciliaciones tampoco tienen flujos auditados de reversión; editar o borrar directamente esos registros financieros no es seguro. Queda pendiente implementar esas operaciones de dominio con auditoría antes de exponerlas.

### Páginas independientes de Marketing (2026-10-14)

- La navegación de Marketing ahora tiene cinco páginas separadas: Banners Hero Promocionales, Banners Hero Informativos, Anuncios & Barra Superior, Regla de Promoción y Cupón de Descuento.
- Cada opción muestra únicamente su propio formulario y listado existentes. Se conservan los controladores, endpoints, permisos y operaciones actuales.
- Se añadió encabezado de página con título y descripción, selección activa de navegación y regla accesible para ocultar paneles no seleccionados. Sin cambios de backend ni base de datos.

### Consistencia de acciones principales del panel (2026-10-14)

- Centralicé el color de acciones principales en un token verde oscuro compartido por Productos, Catálogo, Inventario, Pedidos, Pagos, Envíos, Facturación y formularios administrativos heredados.
- Las acciones principales comparten color base, hover y foco visible; las acciones secundarias y destructivas conservan su jerarquía semántica.
- Sin cambios de lógica, API o base de datos.

### Rediseño de páginas de Marketing (2026-10-14)

- Las cinco pantallas de Marketing usan ahora la misma superficie clara, tarjetas blancas, tablas, controles y estados de acción del resto del panel.
- Los formularios existentes de banners promocionales e informativos, anuncios, reglas promocionales y cupones se abren en modales accesibles con botones Crear y Cancelar. Editar abre el modal existente con los datos cargados; al cerrar o cancelar se restablece el formulario.
- Se conservaron filtros, vista previa, carga a R2, publicar/desactivar, duplicar, eliminar, edición y endpoints existentes. Sin cambios de API ni D1.
- Typecheck, lint de arquitectura y `git diff --check` pasaron; no ejecuté pruebas automatizadas ni revisión visual en navegador.

### Alineación de acciones de Marketing y páginas de Auditoría/Configuración (2026-10-14)

- Los cinco botones de creación de Marketing ahora se agrupan en una barra alineada a la derecha, siguiendo el patrón de acciones principales del resto de páginas. Se mantienen sus formularios y flujos actuales.
- Auditoría y Configuración adoptan encabezados, tarjetas, tablas y formularios claros, con ajuste móvil y controles coherentes con las páginas renovadas.
- Auditoría pagina los resultados desde el endpoint: 10 por página, con `Anterior`/`Siguiente`; el servidor consulta 11 para detectar si existe la página siguiente y valida el parámetro de página. No se carga toda la bitácora para paginar en el navegador.
- Sin cambios de dominio, D1 ni migraciones. Verificaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni revisión visual en navegador.

### Paginación en listados del panel (2026-10-14)

- Añadí controles accesibles y consistentes de 10 filas por página a Pedidos, Inventario, Transacciones, Recaudos contra entrega, Conciliaciones, Facturación, Productos, las cinco tablas de Catálogo y los listados de Banners Hero Promocionales/Informativos, Anuncios, Reglas de Promoción y Cupones.
- La paginación reutilizable conserva las acciones de cada fila; los filtros de Pedidos, Productos, Transacciones y banners reinician en la página 1. Las listas con filas SSR guardan una copia de las filas originales para que filtrar banners siga funcionando al cambiar de página.
- Se conserva el origen actual de datos y sus límites de respuesta existentes; esta mejora pagina los resultados actualmente entregados al panel, no amplía los límites de consulta de las API.
- Verificaciones: `pnpm typecheck`, `pnpm lint` y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni revisión visual en navegador.

### Acciones y paginación BFF del Catálogo (2026-10-14)

- Categorías, Marcas, Proveedores, Atributos y Variantes ahora cargan desde endpoints administrativos paginados en el BFF: 10 filas por página y una fila adicional para determinar `hasMore`; D1 recibe `LIMIT`/`OFFSET` y el navegador ya no descarga la lista completa.
- Cada fila ofrece Ver, Editar, Ocultar/Mostrar y Eliminar. Las mutaciones pasan por RBAC, validación Zod y auditoría; las eliminaciones rechazan entidades relacionadas o variantes con stock. Los cambios de stock siguen en Inventario.
- La migración aditiva `catalog__0007_taxonomy_status.sql` añade estado a categorías, marcas y atributos, conserva las filas actuales como activas y fue aplicada/verificada en producción el 2026-10-14 07:55 UTC. Copias generadas y manifiesto actualizados.
- Verificaciones: `pnpm --filter @ecommerce/api exec tsc --noEmit`, `pnpm lint`, `pnpm db:check-migrations`, `git diff --check` y consulta remota de estado/esquema de migración. No ejecuté pruebas automatizadas ni verificación visual en navegador.

### Paginación de Municipios DANE y controles de Marketing (2026-10-14)

- Municipios DANE ahora consulta 10 filas por página en un endpoint BFF protegido, con búsqueda y conteo en D1. La búsqueda del directorio y el selector de municipios del modal dejaron de precargar el catálogo completo; la búsqueda pública también limita resultados.
- Los paginadores genéricos se insertan junto a su tabla y dentro de la página correspondiente. Antes se insertaban después de la tarjeta, dejando visibles juntos los controles de banners promocionales, informativos y cupones aunque sus páginas estuvieran ocultas.
- Sin cambios de esquema ni migraciones. Verificaciones: TypeScript, lint de arquitectura y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni validación visual en navegador.

### Corrección de páginas vacías del Catálogo (2026-10-14)

- Se encontró un error de sintaxis confirmado en el JavaScript generado para las acciones de filas: las comillas de los `onclick` hacían inválido todo el bloque del Catálogo, por lo que sus páginas quedaban ocultas y el encabezado no cambiaba.
- Reemplacé los manejadores inline por atributos de datos y un listener delegado para Ver, Editar, Ocultar/Mostrar y Eliminar. Verifiqué que el JavaScript renderizado pase `node --check`.
- Verificaciones: typecheck, lint de arquitectura y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni revisión visual con navegador.

### Consistencia de botones de acciones del panel (2026-10-14)

- Centralicé el estilo de acciones de filas en Productos, Pedidos, Inventario, Envíos, Facturación, Catálogo, CMS y Marketing: altura de 34 px, tipografía de 12 px, padding, borde, radio, foco accesible y estados hover compartidos.
- Las acciones neutrales, principales, de publicación/ocultamiento y destructivas mantienen colores semánticos uniformes. Los botones principales de encabezado y formularios conservan su tamaño mayor.
- TypeScript, lint de arquitectura y `git diff --check` pasaron. No ejecuté pruebas automatizadas ni revisión visual en navegador.

### Contención del detalle extenso en Auditoría (2026-10-14)

- La tabla mostraba el JSON completo en cada celda de Detalles, forzando que el texto ocupara demasiado espacio y deformara la lectura de la tabla.
- La celda ahora limita la vista previa a tres líneas y ofrece “Ver detalle”. El diálogo muestra el JSON formateado en un área desplazable, asignándolo como texto para evitar interpretar contenido como HTML. La tabla usa columnas de ancho controlado y mantiene el desplazamiento horizontal solo en pantallas estrechas.
- Verificaciones: typecheck, lint de arquitectura y `git diff --check`. No ejecuté pruebas automatizadas ni revisión visual con navegador.

### Alineación cromática de Pedidos (2026-10-14)

- La vista de Pedidos conservaba acentos azules en la pestaña activa, el enlace del pedido y el estado Confirmado. El selector de estado heredaba el fondo oscuro global del panel.
- Unifiqué esos acentos con el verde del resto de las páginas y forcé el selector a conservar fondo blanco y texto oscuro dentro de Pedidos. Sin cambios de lógica o backend.
- Verificaciones: typecheck, lint de arquitectura y `git diff --check`. No ejecuté pruebas automatizadas ni revisión visual en navegador.

### Alineación visual del Resumen administrativo (2026-10-14)

- Reorganicé el Resumen para seguir la referencia: encabezado con búsqueda/rango/notificaciones/exportación, cuatro KPI, gráfico de ventas, distribución por estado, pedidos recientes y bloque de atención.
- Los KPI y el gráfico se calculan con pedidos reales devueltos por la API administrativa (máximo 100). La conversión no se inventa: se muestra proporción de pagos aprobados. Inventario, conciliaciones y banners alimentan las alertas cuando sus endpoints/datos están disponibles.
- El rango de 7/30/90 días filtra la muestra disponible y la exportación genera CSV local. La búsqueda filtra pedidos recientes. La paginación completa del análisis requeriría soporte de consultas agregadas, que no forma parte de este cambio de interfaz.
- Se comprobó la sintaxis del JavaScript generado y el HTML de la sección. Typecheck, lint de arquitectura y `git diff --check` pendientes de repetición tras el último ajuste; no hay navegador disponible para inspección visual.


### Rediseño y versionado del PDF de facturas (2026-10-14)

- Rediseñé el documento generado con encabezado de marca, número y fecha destacados, bloques separados para comercio/cliente/entrega, tabla de productos, desglose legible y total resaltado. Eliminé el `COP` duplicado del total.
- Los PDFs históricos permanecen intactos en R2. Al consultar una factura antigua, se crea y reutiliza una representación `-v2.pdf` desde el snapshot inmutable; el PDF original sigue disponible y un rollback del Worker continúa leyendo la clave original. Las nuevas facturas se guardan directamente en la ruta versionada.
- Aprobado y Confirmado en Pedidos usan el mismo tono verde de la interfaz; la verificación de despliegue anterior seguía mostrando el estilo anterior en esa captura.
- Verificaciones: typecheck, lint de arquitectura y `git diff --check`. No ejecuté pruebas automatizadas ni inspección visual del PDF en navegador.

### Estados visuales de Transacciones recientes (2026-10-14)

- La tabla usaba la clase genérica heredada `.tag`, que aplicaba fondo azul oscuro y texto claro a estados como `approved`.
- Reemplacé esa clase por estados acotados: Aprobado/Recaudado en verde, Pendiente en ámbar, errores/rechazos en rojo y valores desconocidos en neutro. Los estados se muestran en español.
- Verificaciones: typecheck, lint de arquitectura y `git diff --check`. No ejecuté pruebas automatizadas ni revisión visual en navegador.

### Acciones seguras para Municipios DANE y movimientos financieros (2026-10-14)

- Añadí una acción Ver accesible para municipios, recaudos contra entrega y conciliaciones; los detalles se construyen con `textContent`. En municipios, la acción existente ahora se llama Editar cobertura porque edita la zona de envío relacionada, no la fuente oficial DANE.
- No expuse Desactivar/Eliminar para municipios: `shipping_divipola` es un catálogo oficial de referencia sin estado, y eliminar una fila podría romper zonas y validación de checkout. Tampoco habilité edición/desactivación/eliminación de recaudos o conciliaciones: son registros financieros sin operaciones de reversión, y borrar o cambiar valores sobrescribiría el historial. Hace falta definir una operación de anulación/corrección append-only con motivo y auditoría antes de agregar esas acciones.
- Sin migraciones ni cambios de backend. Typecheck, lint de arquitectura y `git diff --check`; no ejecuté pruebas automatizadas ni revisión visual.

### Política de mantenimiento para datos DANE y financieros (2026-10-14)

- Decisión aplicada: los registros DANE oficiales continúan de solo lectura; las zonas de cobertura relacionadas siguen siendo editables. No se crean estados locales que cambien artificialmente el catálogo oficial ni se permite borrar municipios usados en cobertura.
- Las conciliaciones nuevas no pueden sobrescribir un registro existente. La acción Corregir agrega un evento con comisión, referencia de reporte, motivo y actor; la lectura muestra la corrección vigente y conserva el historial original. La migración `payments__0005_settlement_corrections.sql` es aditiva.
- Los recaudos contra entrega permanecen en Ver solamente. No hay una operación segura de anulación aislada: una devolución real también afecta pago del pedido y documento/factura; una corrección de digitación necesita evidencia del recaudo. Se evita ofrecer un botón de borrado que deje esos datos inconsistentes.
- `payments__0005_settlement_corrections.sql` se aplicó a producción con el runner al confirmar las 40 migraciones previas y que la tabla aún no existía. La consulta posterior confirmó ledger, columnas, índice y tabla vacía; no se alteraron conciliaciones.
- Commit `c014d0d` fue enviado a `main`. Al comprobar Wrangler a las 09:03 UTC, el deployment más reciente seguía siendo `1907801f-83fc-4699-b2c1-a9326f27a0b3` de las 08:53 UTC; el despliegue automático de este push no estaba reflejado todavía. No se hizo un deploy manual.
- Typecheck, lint de arquitectura, consistencia de copias de migración, `git diff --check` y `pnpm db:test-migrations` pasaron. No se ejecutó prueba automatizada específica del flujo financiero ni inspección visual en navegador.

### Entidad y páginas de colecciones (2026-10-14)

- Añadí `catalog_collections` y `catalog_collection_products` como entidad propia del bounded context `catalog`; la relación mantiene el orden editorial de productos. El estado de creación es oculto por defecto. No se alteran productos ni contenido CMS existentes.
- Implementé CRUD administrativo paginado en el BFF con permisos `catalog:read/create/edit/delete` y eventos de auditoría sin datos personales; edición, publicación/ocultamiento y eliminación con confirmación.
- Implementé `/colecciones` paginada y `/colecciones/:slug`, con colecciones activas solamente, productos publicados solamente, metadatos SEO, enlaces de navegación y 404 cuando no existe o está oculta.
- Pruebas añadidas para publicación, unicidad de slug, asociación solo de productos publicados, escape HTML, paginación y persistencia D1 real. Migración `catalog__0008_collections.sql` aditiva y aplicada tras consultar las 41 entradas previas; confirmados ledger, tablas y columnas en D1 productiva. No se insertó contenido de tienda.
- Pruebas unitarias: 44 archivos / 121 pruebas aprobados. Workers/Miniflare: 5 archivos / 14 pruebas aprobados; una primera ejecución paralela agotó timeout en `/health`, y la ejecución aislada pasó. Verificadas migraciones desde cero y actualizaciones legacy, tipos, lint, aislamiento, arquitectura y consistencia de copias.
- Commits `4255fe5` (implementación) y `45a7639` (título de colección) enviados a `main`. Cloudflare desplegó automáticamente el código; deployment `3397e239-b37a-4624-8982-e862d221ce15`, versión `ebc94fcf-be85-4d5e-b44c-4ba8f2919e80`, 100% activo a las 09:48 UTC. `/health` devolvió HTTP 200 con D1/KV/Queue/R2 `ok`; `/colecciones` devolvió HTTP 200 y `<title>Colecciones | Vega Store</title>`. No se hizo inspección visual en navegador.
