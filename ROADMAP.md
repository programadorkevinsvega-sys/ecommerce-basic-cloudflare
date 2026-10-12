# Roadmap — Ecommerce Profesional en Cloudflare

Plan de construcción por fases. Cada fase termina en algo **desplegable y verificable**.

> ## 📐 Documento de arquitectura (obligatorio)
> **[`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md)** rige todo este plan.
> - Ninguna fase se cierra sin cumplir su *Definition of Done* (§19) y sin respetar las prohibiciones explícitas (§20).
> - Cada fase indica abajo el **"Contrato aplicable"** (secciones `§N` del documento de arquitectura) que debe releerse antes de empezar.
> - Si el roadmap y el contrato se contradicen, **gana el contrato** (§23); cualquier excepción requiere un ADR.
>
> Contexto y decisiones del proyecto: [`README.md`](./README.md).
>
> Documentos normativos complementarios (también obligatorios):
> - [`SECURITY_RULES.md`](./SECURITY_RULES.md): reglas `SEC-*`; cada fase indica las que aplican en **"Seguridad y recuperación"**.
> - [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md): release, rollback y reconciliación; ninguna fase que toque D1, Queues, R2 o caché se cierra sin ser compatible con rollback.

**Restricciones transversales a todas las fases**

- 100% Cloudflare, **sin Cloudflare Containers** (§0). Si surge un requerimiento que no pueda correr en Workers → detenerse y consultar antes de continuar.
- Un solo Worker y una sola D1 con prefijos por módulo (ADR-0001, §6.1, §23).
- Comunicación entre módulos solo por Gateways y Queues (§0, §10, §8).
- Máximo 200 líneas por archivo; una responsabilidad pública por archivo (§1.bis).
- Proveedores definidos: **Wompi** (pagos) y **Resend** (email), siempre detrás de puertos (§1 DIP, §2).

**Tamaños:** S (pocos días) · M (≈1–2 semanas) · L (≈2–4 semanas). Son referencias relativas.

---

## Vista general

| Fase | Nombre | Tamaño | Resultado |
|---|---|:---:|---|
| 0 | Fundaciones | M | Monorepo, Worker base, CI, aislamiento de tablas |
| 1 | Identidad y configuración | M | Login de admin y clientes, RBAC, ajustes de tienda |
| 2 | Medios y catálogo | L | CRUD de productos con políticas de venta por producto |
| 3 | Tienda pública base | L | Home, listado, detalle, SEO básico en SSR |
| 4 | Contenido de la tienda | M | Carrusel, banners y anuncios con su gestión |
| 5 | CMS y SEO completo | L | Páginas, menús, sitemap, JSON-LD, redirecciones |
| 6 | Promociones | M | Promociones, cupones y productos con descuento |
| 7 | Envíos y cobertura | M | Envío nacional o local (ciudad/municipio) por producto |
| 8 | Compra, pagos (Wompi + contra entrega) y notificaciones en tiempo real | L | Carrito, checkout, pedidos, pagos y aviso en vivo con todos los detalles |
| 9 | Facturación, email con Resend y cuenta del cliente | L | Facturas completas almacenadas, emails, `/cuenta`, auditoría |
| 10 | Venta a crédito | M | Planes, cuotas y abonos (alcance por confirmar) |
| 11 | Endurecimiento y lanzamiento | M | Carga, caos, seguridad, alertas, go-live |
| 12 | Evolución | — | Reseñas, wishlist, i18n, extracción de módulos |

```text
0 ─► 1 ─► 2 ─► 3 ─► 4 ─► 5 ─► 6 ─► 7 ─► 8 ─► 9 ─► 10 ─► 11 ─► 12
          │         ▲    ▲         ▲    ▲
          └─────────┴────┘         └────┘  (checkout depende de catalog, promotions y shipping)
```

Las fases 4, 5, 6 y 7 son módulos independientes y pueden solaparse si hay más de una persona. La fase 10 depende de 8 (Wompi) y 9 (Resend para recordatorios).

---

## Fase 0 — Fundaciones

**Contrato aplicable:** §0, §0.1, §1.bis, §2, §3, §6.2, §6.5, §8, §11, §12, §13, §14, §20, §22.
**Seguridad y recuperación:** SEC-SEC-01..05 (secretos y entornos), SEC-DEP-01..04, SEC-MOD-01..04, SEC-WEB-02, SEC-LOG-01..03 · `ROLLBACK_RECOVERY.md`: staging aislado, `docs/migrations/manifest.md`, estrategia expand/contract.

**Objetivo:** dejar el esqueleto que hace cumplir la arquitectura desde el primer commit.

- [x] Monorepo (`pnpm workspaces`): `apps/api`, `apps/storefront`, `apps/admin`, `docs`, `tests`.
- [x] `wrangler.jsonc` del Worker único: D1, R2, KV, Queues + DLQ, Analytics Engine, Cron; entornos dev / staging / production.
- [x] Estructura base de §3: `bff/`, `modules/`, `shared-kernel/`, `platform/`, `composition-root.ts`, `index.ts` (`fetch`, `queue`, `scheduled`).
- [x] `shared-kernel` mínimo (§11): `Result<T,E>`, `UUID`, `IClock`, errores base.
- [x] `platform`: logger JSON con `trace_id`/`request_id` (§12), manejo de errores, propagación de `traceparent`.
- [x] BFF con Hono + Zod/OpenAPI, `/health` (§13) y `/api/docs`.
- [x] Script de **migraciones por módulo** (`<modulo>__0001_init.sql`), ejecutable módulo a módulo (§6.2).
- [x] **Test/lint de aislamiento de tablas** (§6.1, ADR-0001): falla si un módulo referencia tablas de otro prefijo.
- [x] Lint: dominio/aplicación sin imports de Cloudflare, sin imports entre módulos, límite de 200 líneas, prohibido `utils.ts`/`helpers.ts`.
- [x] Outbox genérico y relay por Cron; publisher y consumer base de Queues con ack manual (§6.5, §8).
- [x] CI en GitHub Actions: lint, tipos, tests, aislamiento, deploy a staging.
- [x] `docs/PROJECT_RULES.md` (§22) y ADRs 0002–0013.
- [x] `docs/migrations/manifest.md`: registro de migraciones por módulo y entorno.
- [x] **Staging aislado** (Worker, D1, R2, KV, Queues, secretos) con Wompi sandbox y Resend de prueba, según `ROLLBACK_RECOVERY.md`.
- [x] Escaneo de secretos (gitleaks) y auditoría de dependencias en CI; protección de la rama `main`.
- [x] Cabeceras de seguridad base (CSP, HSTS, nosniff, etc.) en Worker y Pages (SEC-WEB-02).
- [x] Módulo de referencia (`settings`, mínimo) como plantilla para los demás.
- [x] Documentar en el repo cómo entregar el contrato como contexto a agentes de IA antes de generar código.

**Criterio de salida:** `GET /health` desplegado en staging, CI en verde y el test de aislamiento fallando a propósito cuando se introduce una violación. **Estado: completado y probado según confirmación del responsable del proyecto.**

---

## Fase 1 — Identidad y configuración

**Módulos:** `identity`, `settings`
**Contrato aplicable:** §4 (DDD), §5 (casos de uso), §9, §10, §14.
**Seguridad y recuperación:** SEC-AUTH-01..09, SEC-SES-01..06, SEC-ADM-01..05, SEC-ISO-01 y 07, SEC-RATE-01..02, SEC-LOG-01 · `ROLLBACK_RECOVERY.md`: migraciones de `identity` compatibles hacia atrás (sesiones activas).

- [x] Administradores: login con **MFA (TOTP)**, logout, sesiones opacas con hash (`__Host-admin-session`), bloqueo progresivo por intentos, cambio de contraseña, re-autenticación en acciones críticas.
- [x] Clientes: registro, login, verificación de contraseña con PBKDF2 100k iteraciones, sesiones opacas (`__Host-session`).
- [x] Roles y permisos (RBAC, denegar por defecto, protección del último Superadmin); roles base sembrados (Superadmin, Editor, Ventas, Soporte).
- [x] Middleware de autenticación/autorización en el BFF vía `IdentityGateway`.
- [x] Rate limiting básico por intentos fallidos en auth.
- [x] Rutas públicas y protegidas en el BFF para autenticación de clientes y administradores.
- [x] `settings`: datos de la tienda, moneda **COP**, IVA, contacto, redes, soporte.
- [x] Decisión cerrada de ADR-0003 (autenticación) conforme a `SECURITY_RULES.md`.
- [x] Pruebas de acceso cruzado y de separación cliente/admin (SEC-ISO-06, SEC-ISO-07).
- [x] Admin SPA: UI integrada en `/admin` y `/admin/login` con gestión de catálogo, banners, anuncios, configuración y logout.

**Criterio de salida:** un admin inicia sesión, un cliente se registra y entra, y un permiso faltante devuelve `403`. (Completado y verificado en producción).

---

## Fase 2 — Medios y catálogo

**Módulos:** `media`, `catalog`
**Contrato aplicable:** §4.4 (agregados), §4.5 (eventos), §6.1, §6.4 (R2), §6.5, §7 (KV), §8.
**Seguridad y recuperación:** SEC-R2-01..08, SEC-VAL-03, 04 y 06, SEC-CMS-06, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: sección R2 (ambas versiones leen los objetos), consistencia D1/R2.

- [x] `media`: subida a R2 (validación de tipo/tamaño con magic bytes SEC-R2-04), carpetas, alt text obligatorio, rutas privadas y públicas.
- [x] `catalog`: productos (simples y con variantes), categorías jerárquicas, atributos, estados (borrador / publicado / archivado).
- [x] **Políticas de venta por producto** (ver README §5.1):
  - [x] `allows_cash_on_delivery` (sí / no).
  - [x] `shipping_scope` (`national` / `local`) y `catalog_product_coverage` con `zone_id` como `TEXT` (sin FK).
  - [x] `sale_mode` (`cash` / `credit` / `both`), activo para el módulo `credit`.
- [x] Slugs únicos con validación regex para evitar inyecciones y colisiones.
- [x] Búsqueda con D1 FTS5 dentro del prefijo `catalog_` (ADR-0006).
- [x] Endpoints BFF públicos para consultar productos por slug/listado y endpoints Admin para creación protegida con RBAC (`catalog:create`, `media:create`).
- [x] `MediaGateway` consumido por catálogo (solo IDs, sin FKs).

**Criterio de salida:** crear desde el admin un producto con imágenes, variantes y política de venta, y consultarlo por la API con todo resuelto.

---

## Fase 3 — Tienda pública base

**Módulos:** `catalog` (lectura pública), `seo` (mínimo), BFF `store/*`
**Contrato aplicable:** §7 (KV/Cache API), §9 (BFF), §10 (Gateways), §16 (resiliencia).
**Seguridad y recuperación:** SEC-WEB-01..06, SEC-FE-01..04, SEC-VAL-05, SEC-CMS-03 · `ROLLBACK_RECOVERY.md`: rollback de Pages y purga de caché.

- [x] Proyecto `storefront` con SSR (renderizado en servidor 100% Cloudflare Worker y BFF integrado, mismo origen ADR-0007).
- [x] Páginas: **Home** (`/`), **listado** (`/productos` con filtros y orden), **detalle de producto** (`/productos/:slug`), y **búsqueda** integrada (`/productos?q=`).
- [x] Detalle de producto muestra las políticas comerciales completas: contra entrega disponible o no, cobertura de envío (nacional / local) y modalidad de venta.
- [x] Layout público: header con navegación, footer informativo y barra de búsqueda interactiva.
- [x] SEO base por página: `title`, `description`, `canonical`, Open Graph (`og:title`, `og:description`), meta `robots` (index, follow).
- [x] Autenticación de clientes en la tienda: formulario de login interactivo conectado a la API con cookie segura `__Host-session`.

**Criterio de salida:** home → listado → detalle con HTML renderizado en servidor y Lighthouse móvil ≥ 90 en rendimiento y SEO (staging).

---

## Fase 4 — Contenido de la tienda: carrusel, banners y anuncios

**Módulo:** `storefront`
**Contrato aplicable:** §4, §5, §6.1, §7, §8.
**Seguridad y recuperación:** SEC-CMS-01, 02 y 05, SEC-WEB-05, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: eventos de invalidación versionados y purga de caché.

- [x] **Banners promocionales:** ubicaciones (`home`, `category`, `product`, `checkout`), vigencia programada (`startsAt`/`endsAt`), enlaces y alt text obligatorio.
- [x] **Anuncios:** barra superior (`top_bar`), mensajes de alerta y avisos con vigencia temporal.
- [x] CRUD completo de banners y anuncios en el backend y endpoints de administración protegidos con RBAC.
- [x] Base de datos D1 con prefijo estricto `storefront_*` (`storefront_banners`, `storefront_announcements`, `storefront_outbox_events`).
- [x] `StorefrontGateway` consumido por el BFF para renderizar banners y top-bar dinámicamente en el SSR del Home.
- [x] Validación de enlaces conforme a SEC-CMS-05 y prevención de inyecciones HTML.

**Criterio de salida:** un slide, un banner y un anuncio programados aparecen y desaparecen en la tienda en el momento configurado.

---

## Fase 5 — CMS y SEO completo

**Módulos:** `cms`, `seo`
**Contrato aplicable:** §4.7 (ACL), §6.1 (sin JOINs entre prefijos), §8 (eventos para el sitemap).
**Seguridad y recuperación:** SEC-CMS-01..06, SEC-WEB-06, SEC-VAL-03 · `ROLLBACK_RECOVERY.md`: slugs/redirecciones y sitemap reconstruible tras un rollback.

**CMS**
- [x] Páginas con bloques (texto enriquecido, imagen, galería, FAQ, CTA, HTML sanitizado).
- [x] Versionado automático con histórico en `cms_page_versions` y control de borrador/publicado.
- [x] Menús dinámicos anidados en árbol jerárquico (`header`, `footer`) en `cms_menus` y `cms_menu_items`.
- [x] CRUD y endpoints de administración protegidos con RBAC (`cms:create`, `cms:update`) y rutas públicas SSR en `/p/:slug`.

**SEO**
- [x] `seo_metadata` por entidad (producto, categoría, página) con plantillas y sobrescritura manual en BD D1.
- [x] Editor SEO en formulario de productos del admin con SERP Preview (Google Snippet) y contadores de caracteres (~70 y ~160).
- [x] JSON-LD estructurado: `schema.org/Product` con precio en COP, stock, condición física (`itemCondition`), marca y SKU.
- [x] `sitemap.xml` dinámico con exclusión de items marcados como `noindex`, y `robots.txt` público configurado con rutas permitidas/denegadas.
- [x] Redirecciones 301/302 con tabla `seo_redirects`, resolución en middleware SSR de Storefront y endpoints de administración.
- [x] Control de indexación y canonical para filtros/paginación (noindex automático en búsquedas internas `?q=`).

**Criterio de salida:** sitemap válido en Search Console, datos estructurados válidos y redirecciones funcionando.

---

## Fase 6 — Promociones

**Módulo:** `promotions`
**Contrato aplicable:** §4, §5, §10 (`PromotionsGateway`), §8.
**Seguridad y recuperación:** SEC-ORD-05, SEC-RATE-01, SEC-VAL-06, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: reconciliar `promotions_redemptions` con pedidos.

- [x] Tipos: porcentaje, monto fijo por producto/categoría/todo el catálogo (**productos con descuento**).
- [x] Reglas: vigencia (starts_at/ends_at), mínimo de compra, límites de uso por cliente, prioridad de ejecución y estado activo.
- [x] Cupones: códigos únicos en mayúsculas, límite global y límite por cliente con registro de canjes en `promotions_redemptions`.
- [x] `PromotionsGateway`: evaluación desacoplada de precios de productos y validación server-side de cupones sin confiar en el cliente (`SEC-VAL-06`, `SEC-ORD-05`).
- [x] Etiquetas de descuento en listado y detalle (`-XX% OFF`, banner promocional y precio tachado en SSR).
- [x] CRUD completo en panel administrativo `/admin` para reglas automáticas y cupones con activación/desactivación y eliminación.
- [x] Base de datos D1 con prefijo estricto `promotions_*` y outbox de eventos (`promotions_outbox_events`).

**Criterio de salida:** una promoción programada se aplica en listado y detalle con el precio correcto, y un cupón respeta sus límites. (Completado y verificado en vivo en producción).

---

## Fase 7 — Envíos y cobertura

**Módulo:** `shipping`
**Contrato aplicable:** §4, §6.1 (IDs sin FK), §10 (`ShippingGateway`), §4.7 (ACL).
**Seguridad y recuperación:** SEC-ISO-02, SEC-ORD-07, SEC-VAL-04, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: migraciones de zonas y seed idempotentes.

- [x] Seed de divisiones político-administrativas (departamentos, ciudades, municipios; códigos DANE/DIVIPOLA).
- [x] Zonas `national`, `department`, `city`, `municipality` con tarifas, plazos y **si admiten contra entrega**.
- [x] `ShippingGateway`: ¿cobertura para dirección X?, tarifa, ¿zona admite contra entrega?
- [x] CRUD completo en admin: zonas, cobertura y tarifas; selector de zonas en el formulario de producto (`local`).
- [x] Validación en detalle de producto: "¿llega a mi ciudad?" por selector de municipio.
- [x] Evento `shipping.zone.changed.v1` para invalidar caché.

**Criterio de salida:** un producto `local` solo se acepta para direcciones de sus zonas, y uno `national` para cualquier dirección cubierta. (Completado y verificado en producción).

---

## Fase 8 — Compra y pagos (Wompi + contra entrega)

**Módulos:** `cart`, `inventory`, `orders`, `payments`, `realtime`
**Contrato aplicable:** §4.4 (un agregado por transacción), §5 (idempotencia), §6.5 (Outbox), §8 (ack manual, DLQ), §10, §16, §17 (caos), §20.
**Seguridad y recuperación:** SEC-ISO-02..06, SEC-ORD-01..07, SEC-PAY-01..09, SEC-RT-01..09, SEC-RATE-01, SEC-LOG-01..04, SEC-SES-05 · `ROLLBACK_RECOVERY.md`: reconciliación de negocio (Wompi, stock, recaudos), Queues/DLQ, pausa de consumidores.

**Carrito e inventario**
- [x] `cart`: invitado y cliente, fusión al iniciar sesión, validación de precio/stock/cobertura vía Gateways.
- [x] `inventory`: stock por variante, movimientos, reservas con expiración (Cron), alerta de stock bajo; Durable Object solo si la concurrencia lo exige.

**Pedidos y política de checkout**
- [x] `orders`: creación con snapshot de productos, estados e historial, cancelaciones y devoluciones básicas.
- [x] `OrdersCheckoutPolicy` en el **dominio** de `orders` (README §5.1): contra entrega solo si todos los productos lo permiten y la zona lo admite; bloqueo de productos locales fuera de cobertura; informar qué producto bloquea cada método.
- [x] Flujo orquestado por eventos y outbox (sin transacciones entre módulos): `order.placed` → reserva → pago → confirmación.

**Pagos con Wompi**
- [x] `IPaymentPort` + adaptador Wompi; referencia única y **firma de integridad**; montos en centavos COP.
- [x] Webhook `POST /api/v1/webhooks/wompi`: verificación del checksum, idempotencia por `eventId`, outbox hacia `payments.payment.confirmed.v1`.
- [x] Estados aprobado / rechazado / pendiente / anulado / error; reconsulta de pendientes por Cron.
- [x] Sandbox y producción separados; secretos solo en Cloudflare Secrets.
- [x] Reembolsos y anulaciones desde el admin.

**Pago contra entrega**
- [x] Método `cash_on_delivery` en `payments` y tabla `payments_cod_collections`.
- [x] Estados `placed → confirmed → shipped → delivered → cash_collected`; registro de recaudo en el admin.
- [x] Verificación opcional previa (teléfono/dirección) configurable en `settings`.

**Notificaciones en tiempo real de pagos (`realtime`)** — ver README §5.1
- [x] Realtime notifications en D1 con deduplicación por `notificationId`, streaming y polling con `?since=`.
- [x] Canales `admin` y `customer:{id}` decididos por el servidor con suscripción segura.
- [x] Publicación y persistencia de eventos de pagos aprobados, fallidos y recaudos contra entrega.
- [x] Notificación con todos los detalles (pago, pedido, cliente, método de entrega) sin datos de tarjeta.
- [x] Historial, no leídas y recuperación de perdidas por HTTP (`?since=`); entrega al menos una vez con deduplicación.
- [x] Frontend admin: campana/badge de notificación en vivo, feed y actualización continua.
- [x] Frontend cliente: actualización de confirmación en `/checkout/resultado`.

**Cliente y admin**
- [x] Páginas `/carrito` y `/checkout` (selección de dirección, zona con tarifa dinámica, validación de políticas y método de pago).
- [x] Admin: tabs dedicados a Pedidos, Inventario, Pagos y Recaudos contra entrega con actualización instantánea.
- [x] Pruebas unitarias de aislamiento, arquitectura y políticas de checkout en verde.

**Criterio de salida:** compra completa con Wompi o compra contra entrega, con políticas de cobertura evaluadas en tiempo real, recaudo registrado en el admin y notificaciones en vivo. (Completado y verificado en producción).

---

## Fase 9 — Facturación, email con Resend, cuenta del cliente y auditoría

**Módulos:** `invoicing`, `notifications`, `identity` (cuenta), `audit`
**Contrato aplicable:** §8 (consumers idempotentes), §12 (sin PII en logs), §16 (timeouts y retries).
**Seguridad y recuperación:** SEC-INV-01..09, SEC-RT-04..05, SEC-MAIL-01..06, SEC-AUTH-08, SEC-PRIV-01..03, SEC-ADM-03 y 06, SEC-LOG-01..02 · `ROLLBACK_RECOVERY.md`: idempotencia de emails y `notifications_log`.

**Facturación (`invoicing`)** — ver README §5.1
- [x] Cerrar ADR-0012 (documento interno vs. factura electrónica con validez legal) y ADR-0013 (generación del PDF) antes de empezar.
- [x] Perfil fiscal del emisor en `settings` (razón social, identificación fiscal, dirección, resolución/prefijo).
- [x] Datos de facturación del cliente capturados en el checkout y guardados como *snapshot* en el pedido.
- [x] Consumer idempotente de `payments.payment.confirmed.v1` y `payments.cod.collected.v1` → emisión de la factura con **todos los detalles** (encabezado, emisor, cliente, pedido/envío, líneas, impuestos, totales, pago, trazabilidad).
- [x] Numeración consecutiva, atómica y sin huecos por prefijo/resolución; un solo documento por pago/pedido (`UNIQUE` + idempotencia).
- [x] **Cuadre obligatorio** contra el monto confirmado por Wompi; si no cuadra, no se emite y se alerta.
- [x] Snapshot JSON inmutable en D1 y PDF en R2 (`private/invoices/…`) mediante `IInvoicePdfPort`.
- [x] Notas crédito y anulaciones trazables; ninguna edición ni borrado de facturas emitidas.
- [x] Evento `invoicing.invoice.issued.v1` → email con Resend (PDF o enlace seguro) y actualización de la notificación en tiempo real con el número de factura.
- [x] Admin `/admin/invoices`: búsqueda y filtros, detalle completo, descarga, reenvío por email, notas crédito, exportación auditada.
- [x] Cliente `/cuenta/facturas`: listado y descarga de sus facturas (404 si son ajenas).
- [x] Si ADR-0012 exige facturación electrónica legal: `IElectronicInvoicingPort` con el proveedor elegido, y almacenamiento de XML, identificadores fiscales y acuses devueltos.
- [x] Política de retención de facturas conforme a la normativa aplicable.

**Email y cuenta**
- [x] `IEmailPort` + adaptador **Resend**; dominio de envío verificado (SPF/DKIM/DMARC).
- [x] Envío desde consumer de Queue: reintentos con backoff, DLQ y `Idempotency-Key`.
- [x] Webhook `POST /api/v1/webhooks/resend` con firma verificada; entregas, rebotes y quejas en `notifications_log`.
- [x] Plantillas versionadas y editables en admin: bienvenida, verificación, recuperación, confirmación de pedido, cambio de estado, recaudo contra entrega, stock bajo (interno).
- [x] Reemplazo del adaptador de consola de la Fase 1 por Resend.
- [x] Área `/cuenta`: perfil, direcciones, historial y detalle de pedidos.
- [x] `audit`: consumidor de eventos y acciones admin; consulta por usuario, entidad y fecha.
- [x] Dashboard del admin (ventas, pedidos, stock bajo, pagos pendientes).

**Criterio de salida:** cada pago aprobado (o recaudo contra entrega) produce **una única factura completa**, numerada sin huecos, guardada en D1 y R2, descargable por el cliente y el admin y enviada por email; los emails llegan con reintentos y DLQ, y cada acción administrativa relevante queda auditada. **No se lanza a producción sin esta fase completa.** **Estado: completado y probado según confirmación del responsable del proyecto.**

---

## Fase 10 — Venta a crédito

**Módulo:** `credit`
**Contrato aplicable:** §4 (agregados), §5, §6.5, §8, §10.
**Seguridad y recuperación:** SEC-PAY-10, SEC-PAY-01..06, SEC-R2-05, SEC-PRIV-04, SEC-ISO-02 · `ROLLBACK_RECOVERY.md`: reconciliar cuotas y abonos con Wompi.

> ⚠️ **Alcance por confirmar (ADR-0009).** Supuesto actual: venta financiada en cuotas por la tienda. Si "a crédito" significa otra cosa (por ejemplo, créditos o saldo a favor del cliente), esta fase se redefine antes de empezar.

- [ ] Planes de crédito (cuotas, frecuencia, interés/cargos) con CRUD en admin.
- [ ] Elegibilidad del cliente y cupo; `CreditGateway` consumido por `orders`.
- [ ] Cuentas de crédito, calendario de cuotas y abonos.
- [ ] Abonos en línea con **Wompi**, referenciando `installment_id` como `TEXT`.
- [ ] Recordatorios por Cron + **Resend** (`credit.installment.due.v1`).
- [ ] Comprobantes de abono y facturación de la venta a crédito según ADR-0009/ADR-0012; los abonos también notifican en tiempo real.
- [ ] Manejo de mora y estados de cuenta.
- [ ] Vista del cliente en `/cuenta/credito` y gestión en `/admin/credit`.
- [ ] Integración con `sale_mode` del producto y con la política de checkout.
- [ ] Revisión legal de condiciones de financiación (ver riesgos).

**Criterio de salida:** compra de un producto a crédito, pago de una cuota por Wompi y recordatorio de la siguiente por email.

---

## Fase 11 — Endurecimiento y lanzamiento

**Contrato aplicable:** §12, §13, §15 (k6), §16, §17 (caos), §18 (alertas), §19 (DoD).
**Seguridad y recuperación:** **Toda** `SECURITY_RULES.md` (matriz de certificación, sección 21) y criterio **COMPLETE** de `ROLLBACK_RECOVERY.md`.

- [ ] **k6** sobre home, listado, detalle, carrito y checkout; p95/p99 y límites de CPU de Workers (§15).
- [ ] Prueba de carga de **conexiones WebSocket**: máximo por usuario, reconexión masiva, difusión de un pago a todas las sesiones admin y generación de facturas en ráfaga sin huecos de numeración.
- [ ] **Chaos / resiliencia** en Miniflare: fallo de D1, saturación de Queues, fallo de Gateways, caída de Wompi o Resend (§17).
- [ ] Revisión de seguridad y **ejecución de la matriz de regresión** (`SECURITY_RULES.md` §21): IDOR, manipulación de precios, webhooks falsos/repetidos, XSS en CMS, escalada de privilegios, caché con datos personales.
- [ ] **Ensayo de rollback** en staging (Worker, Pages, D1 *Time Travel*, Queues, purga de caché) y **reconciliación de pagos** con Wompi, con evidencia (`ROLLBACK_RECOVERY.md`).
- [ ] Revisión legal de privacidad y condiciones de venta (SEC-PRIV-04).
- [ ] Accesibilidad (WCAG 2.1 AA) en tienda y admin.
- [ ] Observabilidad completa y SLOs: latencia p50–p99, error rate < 0.1 %, lag de colas (§12, §13).
- [ ] Alertas: excepciones no capturadas, DLQ saturada, CPU excedida, 5xx (§18).
- [ ] Backups y restauración de D1 (Time Travel) y plan de recuperación.
- [ ] E2E de flujos críticos: registro, compra con Wompi, compra contra entrega, compra a crédito, gestión admin.
- [ ] Wompi en producción (llaves, URL de eventos, pruebas reales de bajo monto) y Resend en producción.
- [ ] Dominio, rutas del Worker, Cloudflare Access para el admin, datos iniciales.
- [ ] Checklist de lanzamiento y plan de rollback.

**Criterio de salida:** SLOs medidos en staging, alertas probadas, ADRs cerrados, checklist de go-live completo, **matriz de certificación de `SECURITY_RULES.md` ejecutada con evidencia** y **ensayo de rollback y restauración documentado** conforme a `ROLLBACK_RECOVERY.md` (estado COMPLETE).

---

## Fase 12 — Evolución (post-lanzamiento)

**Seguridad y recuperación:** SEC-MOD-01..04 · `ROLLBACK_RECOVERY.md` y contrato §10.1 al extraer módulos (D1 propia, migración de datos, reconciliación).

- [ ] Reseñas y valoraciones (alimentan `AggregateRating` en JSON-LD).
- [ ] Lista de deseos y productos relacionados.
- [ ] Multi-idioma con `hreflang`.
- [ ] Búsqueda avanzada y sugerencias.
- [ ] Carritos abandonados y campañas por email.
- [ ] Integración con transportadoras (guías y seguimiento).
- [ ] Fidelización y gift cards.
- [ ] **Extracción de módulos** a Workers propios cuando exista necesidad real, siguiendo la sección 10.1 del contrato (D1 propia, `ServiceBinding<Modulo>Gateway`, un cambio de wiring en `composition-root.ts`).

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Fuga de datos entre clientes (IDOR) o escalada de privilegios en admin | Reglas SEC-ISO y SEC-ADM, pruebas de acceso cruzado en cada funcionalidad, RBAC denegar por defecto |
| Rollback que deja pagos, stock o emails inconsistentes | Reconciliación de negocio obligatoria y ensayada (`ROLLBACK_RECOVERY.md`) |
| Notificaciones en vivo con datos de otros clientes o sin pago verificado | Salas decididas por el servidor, notificar solo tras reconciliación con Wompi, pruebas de suscripción no autorizada (SEC-RT) |
| Facturas duplicadas, con huecos de numeración o que no cuadran con el pago | Numeración atómica e idempotente, cuadre contra Wompi antes de emitir, inmutabilidad y notas crédito (SEC-INV) |
| Factura interna que no cumple la obligación de facturación electrónica | ADR-0012 cerrado antes de la Fase 9; puerto `IElectronicInvoicingPort` previsto |
| Violación silenciosa del aislamiento entre módulos | Test/lint de tablas e imports en CI desde la Fase 0 (§6.1, §20) |
| Pagos duplicados o confirmaciones falsas | Firma de integridad, verificación de checksum, idempotencia por `eventId`, no confiar en la redirección del navegador |
| Reglas de contra entrega / cobertura dispersas en el BFF | Política de checkout en el dominio de `orders`; el BFF solo compone (§9, §20) |
| Carritos mixtos confusos (local + nacional, contra entrega + online) | ADR-0010 y mensajes explícitos de qué producto bloquea qué método |
| Sobreventa de stock | Actualización condicional atómica; Durable Object si hace falta |
| Alcance de "crédito" ambiguo | ADR-0009 antes de la Fase 10; revisión legal de la financiación |
| Límites de CPU o tamaño del Worker | k6 temprano y medición del bundle en CI |
| Caída de Wompi o Resend | Puertos + adaptadores, timeouts con `AbortController`, reintentos con backoff, DLQ (§16) |
| SEO deficiente por renderizado en cliente | SSR obligatorio en la tienda; auditoría SEO en admin |
| Alcance creciente | Cada fase tiene criterio de salida; lo nuevo entra a una fase planificada o a la 12 |

---

## Cómo se trabaja cada fase

1. Releer el **contrato aplicable** de la fase (secciones `§N` indicadas arriba).
2. Delimitar el *bounded context* y su lenguaje ubicuo antes de escribir código (§4.1).
3. Definir `module.public-api.ts` y los Gateways que consumirá el BFF.
4. Dominio y casos de uso con tests unitarios primero.
5. Persistencia D1 con migración propia y test de aislamiento.
6. Controladores del BFF con Zod/OpenAPI, sin lógica de negocio.
7. Pantallas de admin y tienda con el cliente generado desde OpenAPI.
8. Eventos, caché e invalidación.
9. Verificación contra el Definition of Done (§19) y despliegue a staging.
