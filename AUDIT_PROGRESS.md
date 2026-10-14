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
- Producción: ledger mostraba las 34 migraciones anteriores; se aplicó solo `catalog__0005_profit_target_pricing.sql`. Consulta posterior confirmó ledger y columnas; los 8 productos conservan modo `margin`, cero objetivos fijos, y 7 siguen con `pricing_version=1`. Pendiente de esta entrada: commit/push, despliegue Worker y `/health` posterior.
