# Manifiesto de Migraciones D1

Registro de control de migraciones aplicadas por módulo y entorno. Todo cambio de esquema debe reflejarse en este archivo conforme al contrato de arquitectura y reglas de recuperación (ROLLBACK_RECOVERY.md).

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

---

## Módulo: `storefront`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `storefront__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | d60a32e | ✅ Aplicada con éxito |
| `storefront__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | d60a32e | ✅ Compilada y verificada |
| `storefront__0002_banner_description.sql` | v2 | Producción (`ecommerce-vega-production`) | 2026-10-12 | HEAD | ✅ Aplicada con éxito (expand-only: description) |
| `storefront__0002_banner_description.sql` | v2 | Local (Miniflare) | 2026-10-12 | HEAD | ✅ Verificada y retrocompatible |

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

---

## Módulo: `orders`

| Archivo | Versión | Entorno | Fecha de Aplicación | Commit | Estado |
|---|---|---|---|---|---|
| `orders__0001_init.sql` | v1 | Producción (`ecommerce-vega-production`) | 2026-10-11 | HEAD | ✅ Aplicada con éxito |
| `orders__0001_init.sql` | v1 | Local (Miniflare) | 2026-10-11 | HEAD | ✅ Compilada y verificada |

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


