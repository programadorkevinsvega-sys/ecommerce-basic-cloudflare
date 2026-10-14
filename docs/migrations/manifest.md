# Manifiesto de Migraciones D1

Registro de control de migraciones aplicadas por módulo y entorno. Todo cambio de esquema debe reflejarse en este archivo conforme al contrato de arquitectura y reglas de recuperación (ROLLBACK_RECOVERY.md).

> Las filas históricas de abajo son afirmaciones heredadas de este manifiesto; no representan evidencia individual de que Wrangler las aplicara. La sección final registra la consulta y reconciliación remota realizada durante esta auditoría.

---

## Módulo: `settings`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `settings__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 6092431 | ✅ Aplicada con éxito |
| `settings__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 6092431 | ✅ Verificada |
| `settings__0002_company_tax_fields.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | 9a0a0c4 | ✅ Aplicada con éxito (expand-only: company_nit, company_legal_name, company_address) |
| `settings__0002_company_tax_fields.sql` | v2 | Local (Miniflare) | 2026-10-12 | 9a0a0c4 | ✅ Verificada y retrocompatible |

---

## Módulo: `identity`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `identity__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 52eace0 | ✅ Aplicada con éxito |
| `identity__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 52eace0 | ✅ Compilada y verificada |

---

## Módulo: `media`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `media__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 8a6dafe | ✅ Aplicada con éxito |
| `media__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 8a6dafe | ✅ Compilada y verificada |

---

## Módulo: `catalog`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `catalog__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | 8a6dafe | ✅ Aplicada con éxito |
| `catalog__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | 8a6dafe | ✅ Compilada y verificada |
| `catalog__0002_product_seo_fields.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `catalog__0002_product_seo_fields.sql` | v2 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `catalog__0003_brands_attributes.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `catalog__0003_brands_attributes.sql` | v3 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `catalog__0004_product_pricing.sql` | v4 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aditiva; metadata nueva, precios previos intactos; prueba de actualización agregada |
| `catalog__0004_product_pricing.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; 8 productos siguen v1, sin conversión de precios |

---

## Módulo: `storefront`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `storefront__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | d60a32e | ✅ Aplicada con éxito |
| `storefront__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | d60a32e | ✅ Compilada y verificada |
| `storefront__0002_banner_description.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (expand-only: description) |
| `storefront__0002_banner_description.sql` | v2 | Local (Miniflare) | 2026-10-12 | HEAD | ✅ Verificada y retrocompatible |
| `storefront__0003_banner_types_and_cta.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (expand-only: banner_type, button_text) |
| `storefront__0003_banner_types_and_cta.sql` | v3 | Local (Miniflare) | 2026-10-12 | HEAD | ✅ Verificada y retrocompatible |

---

## Módulo: `seo`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `seo__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `seo__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

---

## Módulo: `cms`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `cms__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `cms__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

---

## Módulo: `promotions`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `promotions__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `promotions__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `promotions__0002_coupon_targets.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |

---

## Módulo: `shipping`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `shipping__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `shipping__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

---

## Módulo: `cart`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `cart__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `cart__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

---

## Módulo: `inventory`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `inventory__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `inventory__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `inventory__0002_idempotent_order_consumption.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-13 | HEAD | ✅ Aplicada por runner y verificada en D1; crea tabla de idempotencia sin filas iniciales |
| `inventory__0002_idempotent_order_consumption.sql` | v2 | Local (Miniflare) | 2026-10-13 | HEAD | ✅ Aplicación desde cero y actualización verificadas |

---

## Módulo: `orders`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `orders__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `orders__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `orders__0002_guest_cart_capability.sql` | v2 | `ecommerce-vega-production` y Local | 2026-10-12 | `3c33f1c` | ✅ Aplicada por runner y verificada en D1 remota; columna nullable, sin pérdida de datos. |
| `orders__0003_pricing_snapshots.sql` | v3 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aditiva; tax, versión fiscal y comisión estimada congeladas en pedido |
| `orders__0003_pricing_snapshots.sql` | v3 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; pedidos históricos conservaron default v1 |
| `orders__0004_checkout_transaction_fee.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Expand-only aplicada y verificada; columna `transaction_fee_cents` default 0, 12 pedidos previos intactos |
| `orders__0004_checkout_transaction_fee.sql` | v4 | D1 temporal / Workers | 2026-10-13 | trabajo actual | ✅ Aplicación vacía y repetición idempotente verificadas |

---

## Módulo: `payments`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `payments__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `payments__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `payments__0002_expand_columns.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | 1a555ba | ✅ Aplicada con éxito (expand-only: transactions, outbox, webhooks) |

---

## Módulo: `realtime`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `realtime__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `realtime__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |
| `realtime__0002_expand_columns.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | 576d038 | ✅ Aplicada con éxito (expand-only: body, data_json, read, recipient_id) |

---

## Módulo: `invoicing`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `invoicing__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (secuencias, facturas, notas crédito, outbox) |
| `invoicing__0002_tax_included.sql` | v2 | Local temporal | 2026-10-13 | trabajo actual | ✅ Aditiva; conserva documentos previos y marca IVA incluido |
| `invoicing__0002_tax_included.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; facturas previas conservan `tax_included=0` |

---

## Módulo: `notifications`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `notifications__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (bitácora de emails e idempotencia) |

---

## Módulo: `audit`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `audit__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (auditoría inmutable de acciones admin) |

---

## Migraciones correctivas de auditoría

| Archivo | Versión | Entorno | Estado | Motivo / compatibilidad |
|---|---|---|---|---|
| `payments__0003_cod_collection_receipts.sql` | v3 | `ecommerce-vega-production` | Aplicada con Wrangler; verificada | Añade `receipt_number`, `created_at`, backfill desde `collected_at` e índice; esquema consultado después de aplicar. |
| `payments__0004_settlement_costs.sql` | v4 | Local temporal | 2026-10-13 | trabajo actual | ✅ Tabla aditiva de comisiones reales reportadas, estimación congelada y referencia de liquidación |
| `payments__0004_settlement_costs.sql` | v4 | Producción (`ecommerce-vega-production`) | 2026-10-13 | trabajo actual | ✅ Aplicada y verificada; tabla creada vacía |
| `realtime__0003_preserve_read_state.sql` | v3 | `ecommerce-vega-production` | SQL aplicado y ledger reconciliado | Copia `is_read` a `read`; consulta posterior confirmó 0 discrepancias. |

## Reconciliación remota de auditoría (2026-10-12)

Base consultada: `ecommerce-vega-production` (`9b69f19a-cad8-4e53-b0d1-0bd2adb11945`). Wrangler mostraba 16 archivos como pendientes, aunque el esquema ya contenía la mayoría de sus tablas y columnas. Se inspeccionó `sqlite_master`, índices, datos semilla y `d1_migrations`; no se recrearon tablas ni se borraron datos.

Cambios de código, fuentes canónicas y evidencia publicados en `c48622f` (`fix(security): audit commerce, migrations, and checkout`).

Se ejecutó DDL base idempotente (`IF NOT EXISTS` / `INSERT OR IGNORE`) para asegurar índices y semillas ausentes, se sincronizó el campo `read`, y se registraron en `d1_migrations` las 15 migraciones históricas cuyo esquema ya estaba presente. Wrangler aplicó después `payments__0003_cod_collection_receipts.sql`. El ledger quedó con 27 entradas. La consulta posterior confirmó `receipt_number` y `created_at`, y cero filas con `read != is_read`. No se insertaron pedidos, pagos ni datos de prueba en la base remota.

Time-travel bookmark antes: `000001d3-00000000-00005103-de470059e507085a4470e642050b3f9b`. Después del DDL idempotente: `000001d3-0000000a-00005103-671f1eee9f16534d6381bdb95291ba9e`. Después de sincronizar el ledger y lectura: `000001d3-00000012-00005103-c4868733b8f504b0b2f67ae94990981b`. Guardar estos bookmarks para recuperación operativa. No se desplegó el Worker.

La fuente canónica es `apps/api/src/modules/<módulo>/infrastructure/persistence/d1/migrations/`. `node scripts/build-migrations.js` genera copias para ambos directorios de Wrangler (`migrations/` raíz y `apps/api/migrations/`); no elimina archivos. Ejecutar cada script desde la raíz o desde `apps/api/` produce las mismas salidas. El runner `apps/api/scripts/apply-migrations.js` aplica por módulo y versión numérica y registra los nombres en `d1_migrations`; úselo en local y remoto. Wrangler 3 no ordenó adecuadamente nombres prefijados por módulo desde base vacía (`settings__0002` antes de `settings__0001`). Con Wrangler 4.149.0, la prueba local desde base vacía verificó 29 migraciones, orden correcto y segunda pasada sin cambios. El runner se ejecutó en producción para `orders__0002_guest_cart_capability.sql` y `inventory__0002_idempotent_order_consumption.sql` después de verificar ledger, esquema y time-travel. Las consultas posteriores confirmaron ambas entradas; la columna guest es nullable y la tabla de idempotencia está vacía. La base tiene 8 pedidos guest con `payment_status='pending'` (3 Wompi, 5 contra entrega); antes de desplegar código que exige capability deben conciliarse los pedidos Wompi/checkout en curso y definirse el seguimiento seguro de pedidos previos sin hash. La migración inventory v2 es aditiva, no modifica datos ni tablas de otros módulos. Modo remoto requiere `ALLOW_REMOTE_D1_MIGRATIONS=1`; revisar respaldo y estado conforme a `ROLLBACK_RECOVERY.md`.

Time-travel bookmarks para inventory v2: anterior `000001d5-000000ba-00005103-eb91d48b70aea4fec605c7d2d20c96ad`; posterior `000001d5-000000c8-00005103-d2640c92983f646d012ce00d26d099ca`. Verificado después de aplicar: entrada en `d1_migrations`, tabla presente y vacía. No se ejecutaron escrituras funcionales ni datos de prueba en producción.

### Precios, snapshots fiscales y conciliación (2026-10-13)

Se consultó el ledger remoto y solo aparecían pendientes `catalog__0004_product_pricing.sql`, `invoicing__0002_tax_included.sql`, `orders__0003_pricing_snapshots.sql` y `payments__0004_settlement_costs.sql`. Wrangler aplicó las cuatro con el runner. Una interrupción de red ocurrió después de las dos primeras; la lectura posterior confirmó exactamente esas dos en ledger/esquema y las otras dos pendientes. Se reintentó el runner, que aplicó las restantes. La consulta posterior confirmó las cuatro entradas, columnas/tablas, `settings_store.tax_rate_percent=19`, ocho productos aún con `pricing_version=1` y cero filas en `payments_settlement_costs`. Las migraciones solo añadieron esquema y no cambiaron precios, pedidos, facturas ni pagos.

Time-travel bookmark anterior: `00000266-000000e0-00005104-627c6de1a2d6f60d6b950aef18301ef6`. Bookmark posterior: `00000266-00000106-00005104-619b6cb14d8e3317ab1bc3e062828c78`. No se desplegó el Worker en esta etapa; verificar `/health` y deployments después del push integrado.

El inventario estático de tablas, columnas, restricciones, índices y referencias TypeScript está en [schema-audit.md](./schema-audit.md). La lista de fuentes y copias se conserva en esos dos directorios; la auditoría no eliminó históricos.




La migración adicional `orders__0004_checkout_transaction_fee.sql` se aplicó a producción después de consultar el ledger y `PRAGMA table_info(orders_orders)`: agregó la columna con default cero. La lectura posterior confirmó el ledger, la columna y 12 pedidos previos con suma de cargos cero. No se modificaron pedidos existentes.
