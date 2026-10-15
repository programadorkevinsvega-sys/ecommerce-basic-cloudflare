# Decisiones Concretas del Proyecto (PROJECT_RULES.md)

Este documento concreta los nombres, bindings, bounded contexts y convenciones físicas de la plataforma, en cumplimiento de la sección 22 del contrato de arquitectura.

---

## 1. Nombres de infraestructura (corte `apps/api/wrangler.jsonc`, 2026-10-15)

Todos los recursos operan directamente en el entorno de producción configurado en `apps/api/wrangler.jsonc`:

| Recurso | Nombre en Cloudflare | Binding en Worker |
|---|---|---|
| **Worker (BFF + módulos)** | `ecommerce-basic-cloudflare` | `src/index.ts` |
| **D1 Única** | `ecommerce-vega-production` | `env.DB` |
| **R2 Bucket** | `ecommerce-vega-production` | `env.MEDIA_BUCKET` |
| **KV Cache** | ID `a49472c551f04d438a1b7a082d7468d9` | `env.CACHE` |
| **Queues Principal** | `ecommerce-vega-events-production` | `env.EVENTS_QUEUE` |
| **Queues DLQ (Dead Letter Queue)** | `ecommerce-vega-events-dlq-production` | Manejo de mensajes fallidos |
| **Analytics Engine** | `ecommerce_vega_analytics_production` | `env.ANALYTICS` |
| **Images** | Cloudflare Images binding | `env.IMAGES` |

Esta configuración referencia recursos de producción. No hay que leer estos nombres como prueba de que un release concreto esté desplegado o saludable; verificar deployments, `/health` y el ledger antes de una operación productiva.

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
9. `invoicing` -> `invoicing_*`
10. `realtime` -> `realtime_*`
11. `promotions` -> `promotions_*`
12. `storefront` -> `storefront_*`
13. `cms` -> `cms_*`
14. `seo` -> `seo_*`
15. `settings` -> `settings_*`
16. `notifications` -> `notifications_*`
17. `audit` -> `audit_*`
18. `reviews` -> `reviews_*`

`credit` aparece en decisiones y el roadmap, pero todavía no existe como módulo ni posee tablas `credit_*`; su implementación requiere cerrar ADR-0009.

---

## 3. Reglas de Inmutabilidad y Moneda

- **Moneda oficial:** COP (pesos colombianos). Todos los importes en base de datos y APIs viajan en **enteros** (centavos de COP).
- **Inmutabilidad:** Las tablas `orders_lines` e `invoicing_invoices` guardan *snapshots* inmutables que nunca dependen de cambios futuros en `catalog`.
- **Integridad de Pagos:** Confirmación de Wompi estrictamente por webhook con checksum y reconciliación de API, nunca por redirección del navegador.

---

## 4. Variables de Entorno Públicas (`vars` en `wrangler.jsonc`)

| Variable | Tipo | Valor Predeterminado / Ejemplo | Descripción |
|---|---|---|---|
| `ENVIRONMENT` | String | `production` | Entorno de despliegue activo (`production`, `staging`, `development`). |
| `ADMIN_EMAIL` | String | `admin@tudominio.com` | Identificador de login para la única cuenta Superadmin activa. No se usa para enviar TOTP. |
| `RESEND_FROM_EMAIL` | String | `Vega Store <onboarding@resend.dev>` | Dirección de correo del remitente configurada en Resend para todos los envíos transaccionales. |
| `WOMPI_PUBLIC_KEY` | String | `pub_prod_...` / `pub_test_...` | Llave pública de comercio para checkout cliente y validación de contexto. |

---

## 5. Secretos Requeridos en Producción (`wrangler secret put`)

| Nombre del Secreto | Servicio / Proveedor | Propósito |
|---|---|---|
| `ADMIN_PASSWORD` | Cloudflare Workers | Contraseña del Superadmin identificado por `ADMIN_EMAIL`; se configura solo como secret y nunca se registra ni se sube al repositorio. |
| `RESEND_API_KEY` | Resend | Token API para el despacho de correos electrónicos transaccionales y facturas. |
| `WOMPI_PRIVATE_KEY` | Wompi Colombia | Llave privada para reconciliación de pagos contra la API de Wompi. |
| `WOMPI_INTEGRITY_SECRET` | Wompi Colombia | Secreto para calcular y verificar el hash SHA-256 de integridad de pagos. |
| `WOMPI_EVENTS_SECRET` | Wompi Colombia | Secreto de eventos para verificación de la firma criptográfica (`x-event-checksum`) de los webhooks de Wompi. |
| `MI_PAQUETE_TRANSPORTADORA` | MiPaquete | Credencial de API de transportadora; el host se configura como `MI_PAQUETE_API_URL`. |

`RESEND_WEBHOOK_SECRET` está declarado opcionalmente en el tipo de entorno heredado, pero no hay ruta de webhook de Resend en el Worker actual; no configurarlo como si el webhook estuviera operativo.
| `MI_PAQUETE_TRANSPORTADORA` | MiPaquete | Credencial de API de transportadora; host HTTPS configurable mediante `MI_PAQUETE_API_URL` y no es un secreto. |

---

## 6. Identidad y Clientes en Órdenes (Invitado vs. Autenticado)

- **Guest Checkout (Compra como invitado):**
  - Si el usuario no tiene una sesión activa (`vega_customer_token` o cookie `__Host-session`), la orden se crea con `customer_id = NULL` en la tabla `orders_orders`.
  - Los datos de contacto, identificación fiscal (`customerTaxId` / Cédula / NIT), teléfono y dirección de entrega se almacenan inmutables en el campo JSON `shipping_address` de la orden y en el snapshot fiscal de `invoicing_invoices`.
- **Registered Customer Checkout (Compra autenticada):**
  - Si el usuario cuenta con sesión validada por `IdentityGateway`, `customer_id` se vincula con su identificador UUID en `identity_customers`.
  - Esto habilita al cliente a consultar el pedido y descargar sus facturas formalmente desde el portal `/cuenta`.

---

## 7. Configuración Fiscal de la Tienda y Facturación Dinámica

- **Datos de la Empresa en `settings_store`:**
  - `store_name`: Nombre comercial de la tienda (ej. *Vega Store*).
  - `company_legal_name`: Razón social legal del comercio (ej. *Vega Store S.A.S.*).
  - `company_nit`: Identificación fiscal / NIT de la empresa (ej. *900.123.456-7*).
  - `company_address`: Dirección fiscal y ciudad sede del negocio.
  - `support_email` / `support_phone`: Correo y teléfono de atención al cliente.
- **Inmutabilidad en Facturación (`invoicing_invoices`):**
  - Al emitirse una factura tras la confirmación del pago, se toma un *snapshot* fiscal que congela tanto los datos vigentes de la empresa como los datos del cliente (`customerTaxId`, nombre, dirección).
  - El documento generado en R2 (`private/invoices/{num}.html`) renderiza dinámicamente estos datos sin valores fijos hardcodeados.

---

## 8. Notificaciones Transaccionales y Políticas de Deliverability

- **Remitente (`RESEND_FROM_EMAIL`):**
  - Debe corresponder a un dominio verificado con registros SPF, DKIM y DMARC en Resend (ej. `no-reply@tudominio.com`).
  - Para pruebas iniciales, el dominio de desarrollo permitido es `onboarding@resend.dev` (limitado a envíos a la cuenta del titular de Resend).
- **Entregabilidad y Filtros Anti-Spam:**
  - Los correos transaccionales deben usar remitente y enlaces con dominios públicos coherentes con la tienda, incluir alternativa de texto plano cuando la plantilla la provea y evitar asuntos agresivos, exceso de mayúsculas o enlaces acortados. SPF y DKIM deben aprobar; publicar una política DMARC alineada después de identificar todos los remitentes legítimos del dominio.

