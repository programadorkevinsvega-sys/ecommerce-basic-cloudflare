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
