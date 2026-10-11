# Decisiones Concretas del Proyecto (PROJECT_RULES.md)

Este documento concreta los nombres, bindings, bounded contexts y convenciones físicas de la plataforma, en cumplimiento de la sección 22 del contrato de arquitectura.

---

## 1. Nombres de Infraestructura en Cloudflare

| Recurso | Entorno Dev | Entorno Staging | Entorno Production |
|---|---|---|---|
| **Worker (BFF + módulos)** | `ecommerce-api` | `ecommerce-api-staging` | `ecommerce-api-production` |
| **D1 Única** | `ecommerce-db-dev` | `ecommerce-db-staging` | `ecommerce-db-production` |
| **R2 Bucket** | `ecommerce-media-dev` | `ecommerce-media-staging` | `ecommerce-media-production` |
| **KV Cache** | `ecommerce-cache-dev` | `ecommerce-cache-staging` | `ecommerce-cache-production` |
| **Queues Principal** | `ecommerce-events-dev` | `ecommerce-events-staging` | `ecommerce-events-production` |
| **Queues DLQ** | `ecommerce-events-dlq-dev` | `ecommerce-events-dlq-staging` | `ecommerce-events-dlq-production` |

---

## 2. Bounded Contexts y Prefijos de Tablas

Cada módulo posee soberanía exclusiva sobre sus tablas D1 con su prefijo:

1. `identity` -> `identity_*`
2. `catalog` -> `catalog_*`
3. `media` -> `media_*`
4. `inventory` -> `inventory_*`
5. `cart` -> `cart_*`
6. `orders` -> `orders_*`
7. `payments` -> `payments_*`
8. `shipping` -> `shipping_*`
9. `credit` -> `credit_*`
10. `invoicing` -> `invoicing_*`
11. `realtime` -> `realtime_*`
12. `promotions` -> `promotions_*`
13. `storefront` -> `storefront_*`
14. `cms` -> `cms_*`
15. `seo` -> `seo_*`
16. `settings` -> `settings_*`
17. `notifications` -> `notifications_*`
18. `audit` -> `audit_*`

---

## 3. Reglas de Inmutabilidad y Moneda

- **Moneda oficial:** COP (pesos colombianos). Todos los importes en base de datos y APIs viajan en **enteros** (centavos de COP).
- **Inmutabilidad:** Las tablas `orders_items` e `invoicing_invoices` guardan *snapshots* inmutables que nunca dependen de cambios futuros en `catalog`.
