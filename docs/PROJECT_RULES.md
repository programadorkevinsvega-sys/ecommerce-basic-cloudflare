# Decisiones Concretas del Proyecto (PROJECT_RULES.md)

Este documento concreta los nombres, bindings, bounded contexts y convenciones físicas de la plataforma, en cumplimiento de la sección 22 del contrato de arquitectura.

---

## 1. Nombres de Infraestructura en Cloudflare (100% Producción Directa)

Todos los recursos operan directamente en el entorno de producción configurado en `apps/api/wrangler.jsonc`:

| Recurso | Nombre en Cloudflare | Binding en Worker |
|---|---|---|
| **Worker (BFF + módulos)** | `ecommerce-vega-api` | Entrypoint principal |
| **D1 Única** | `ecommerce-vega-production` | `env.DB` |
| **R2 Bucket** | `ecommerce-vega-production` | `env.MEDIA_BUCKET` |
| **KV Cache** | `ecommerce-vega-cache-production` | `env.CACHE` |
| **Queues Principal** | `ecommerce-vega-events-production` | `env.EVENTS_QUEUE` |
| **Queues DLQ (Dead Letter Queue)** | `ecommerce-vega-events-dlq-production` | Manejo de mensajes fallidos |
| **Analytics Engine** | `ecommerce_vega_analytics_production` | `env.ANALYTICS` |

---

## 2. Bounded Contexts y Prefijos de Tablas

Cada módulo posee soberanía exclusiva sobre sus tablas D1 con su prefijo (`<modulo>_*`):

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
- **Inmutabilidad:** Las tablas `orders_lines` e `invoicing_invoices` guardan *snapshots* inmutables que nunca dependen de cambios futuros en `catalog`.
- **Integridad de Pagos:** Confirmación de Wompi estrictamente por webhook con checksum y reconciliación de API, nunca por redirección del navegador.
