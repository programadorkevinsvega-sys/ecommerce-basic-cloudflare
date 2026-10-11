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

- [ ] Monorepo (`pnpm workspaces`): `apps/api`, `apps/storefront`, `apps/admin`, `docs`, `tests`.
- [ ] `wrangler.jsonc` del Worker único: D1, R2, KV, Queues + DLQ, Analytics Engine, Cron; entornos dev / staging / production.
- [ ] Estructura base de §3: `bff/`, `modules/`, `shared-kernel/`, `platform/`, `composition-root.ts`, `index.ts` (`fetch`, `queue`, `scheduled`).
- [ ] `shared-kernel` mínimo (§11): `Result<T,E>`, `UUID`, `IClock`, errores base.
- [ ] `platform`: logger JSON con `trace_id`/`request_id` (§12), manejo de errores, propagación de `traceparent`.
- [ ] BFF con Hono + Zod/OpenAPI, `/health` (§13) y `/api/docs`.
- [ ] Script de **migraciones por módulo** (`<modulo>__0001_init.sql`), ejecutable módulo a módulo (§6.2).
- [ ] **Test/lint de aislamiento de tablas** (§6.1, ADR-0001): falla si un módulo referencia tablas de otro prefijo.
- [ ] Lint: dominio/aplicación sin imports de Cloudflare, sin imports entre módulos, límite de 200 líneas, prohibido `utils.ts`/`helpers.ts`.
- [ ] Outbox genérico y relay por Cron; publisher y consumer base de Queues con ack manual (§6.5, §8).
- [ ] CI en GitHub Actions: lint, tipos, tests, aislamiento, deploy a staging.
- [ ] `docs/PROJECT_RULES.md` (§22) y ADRs 0002–0013.
- [ ] `docs/migrations/manifest.md`: registro de migraciones por módulo y entorno.
- [ ] **Staging aislado** (Worker, D1, R2, KV, Queues, secretos) con Wompi sandbox y Resend de prueba, según `ROLLBACK_RECOVERY.md`.
- [ ] Escaneo de secretos (gitleaks) y auditoría de dependencias en CI; protección de la rama `main`.
- [ ] Cabeceras de seguridad base (CSP, HSTS, nosniff, etc.) en Worker y Pages (SEC-WEB-02).
- [ ] Módulo de referencia (`settings`, mínimo) como plantilla para los demás.
- [ ] Documentar en el repo cómo entregar el contrato como contexto a agentes de IA antes de generar código.

**Criterio de salida:** `GET /health` desplegado en staging, CI en verde y el test de aislamiento fallando a propósito cuando se introduce una violación.

---

## Fase 1 — Identidad y configuración

**Módulos:** `identity`, `settings`
**Contrato aplicable:** §4 (DDD), §5 (casos de uso), §9, §10, §14.
**Seguridad y recuperación:** SEC-AUTH-01..09, SEC-SES-01..06, SEC-ADM-01..05, SEC-ISO-01 y 07, SEC-RATE-01..02, SEC-LOG-01 · `ROLLBACK_RECOVERY.md`: migraciones de `identity` compatibles hacia atrás (sesiones activas).

- [ ] Administradores: login con **MFA (TOTP)**, logout, sesiones opacas con hash (`__Host-admin-session`), bloqueo progresivo por intentos, cambio y recuperación de contraseña, re-autenticación en acciones críticas.
- [ ] Clientes: registro, login, verificación de email, recuperación de contraseña (los emails reales llegan en la Fase 9; aquí se usa un `IEmailPort` con adaptador de consola/log).
- [ ] Roles y permisos (RBAC, denegar por defecto, no eliminar al último Superadmin); roles base (Superadmin, Editor, Ventas, Soporte).
- [ ] Middleware de autenticación/autorización en el BFF vía `IdentityGateway`.
- [ ] Rate limiting + Turnstile en rutas de auth.
- [ ] CRUD de usuarios administradores y roles.
- [ ] `settings`: datos de la tienda, logo, moneda **COP**, IVA, contacto, redes, scripts de analítica, verificación de pedidos contra entrega.
- [ ] Admin SPA: shell, login, layout, navegación por permisos, gestión de usuarios/roles y ajustes.
- [ ] Decisión cerrada de ADR-0003 (autenticación) conforme a `SECURITY_RULES.md`.
- [ ] Pruebas de acceso cruzado y de separación cliente/admin (SEC-ISO-06, SEC-ISO-07).

**Criterio de salida:** un admin inicia sesión, un cliente se registra y entra, y un permiso faltante devuelve `403`.

---

## Fase 2 — Medios y catálogo

**Módulos:** `media`, `catalog`
**Contrato aplicable:** §4.4 (agregados), §4.5 (eventos), §6.1, §6.4 (R2), §6.5, §7 (KV), §8.
**Seguridad y recuperación:** SEC-R2-01..08, SEC-VAL-03, 04 y 06, SEC-CMS-06, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: sección R2 (ambas versiones leen los objetos), consistencia D1/R2.

- [ ] `media`: subida a R2 (validación de tipo/tamaño), carpetas, alt text obligatorio, variantes de imagen.
- [ ] `catalog`: productos (simples y con variantes), categorías jerárquicas, marcas, atributos, estados (borrador / publicado / archivado), publicación programada.
- [ ] **Políticas de venta por producto** (ver README §5.1):
  - [ ] `allows_cash_on_delivery` (sí / no).
  - [ ] `shipping_scope` (`national` / `local`) y `catalog_product_coverage` con `zone_id` como `TEXT` (sin FK).
  - [ ] `sale_mode` (`cash` / `credit` / `both`), activo cuando exista el módulo `credit`.
- [ ] Slugs únicos con historial para redirecciones.
- [ ] Búsqueda con D1 FTS5 dentro del prefijo `catalog_` (ADR-0006).
- [ ] Eventos `catalog.product.*.v1` con outbox.
- [ ] CRUD completo en admin: productos (con panel de política de venta), categorías, marcas, medios; importación/exportación CSV.
- [ ] `MediaGateway` consumido por catálogo (solo IDs, sin FKs).

**Criterio de salida:** crear desde el admin un producto con imágenes, variantes y política de venta, y consultarlo por la API con todo resuelto.

---

## Fase 3 — Tienda pública base

**Módulos:** `catalog` (lectura pública), `seo` (mínimo), BFF `store/*`
**Contrato aplicable:** §7 (KV/Cache API), §9 (BFF), §10 (Gateways), §16 (resiliencia).
**Seguridad y recuperación:** SEC-WEB-01..06, SEC-FE-01..04, SEC-VAL-05, SEC-CMS-03 · `ROLLBACK_RECOVERY.md`: rollback de Pages y purga de caché.

- [ ] Proyecto `storefront` con SSR en Pages (ADR-0002 cerrado).
- [ ] Endpoints `/api/v1/store/*` cacheables con invalidación por eventos.
- [ ] Páginas: **Home** (estructura inicial), **listado** con filtros/orden/paginación, **detalle de producto**, categorías, marcas, búsqueda.
- [ ] Detalle de producto muestra las políticas: contra entrega disponible o no, cobertura de envío (nacional / local).
- [ ] Layout público: header, footer, navegación, buscador.
- [ ] SEO base por página: `title`, `description`, `canonical`, Open Graph, `robots`.
- [ ] Imágenes optimizadas (`srcset`, AVIF/WebP, lazy loading).
- [ ] Login/registro/recuperación de clientes en la tienda.

**Criterio de salida:** home → listado → detalle con HTML renderizado en servidor y Lighthouse móvil ≥ 90 en rendimiento y SEO (staging).

---

## Fase 4 — Contenido de la tienda: carrusel, banners y anuncios

**Módulo:** `storefront`
**Contrato aplicable:** §4, §5, §6.1, §7, §8.
**Seguridad y recuperación:** SEC-CMS-01, 02 y 05, SEC-WEB-05, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: eventos de invalidación versionados y purga de caché.

- [ ] **Carruseles y slides:** imagen (desktop/móvil), título, texto, CTA, enlace, orden (drag & drop), vigencia, estado.
- [ ] **Banners:** ubicaciones (home, categoría, producto, checkout), tamaños, vigencia, activación.
- [ ] **Anuncios:** barra superior, avisos y modales por ubicación (**home, zona de clientes, productos**), audiencia (visitante / cliente), prioridad, programación, cierre persistente.
- [ ] CRUD completo en admin con vista previa y reordenamiento.
- [ ] Publicación/expiración automática con Cron.
- [ ] BFF (`store/home`, `store/announcements?placement=`) y storefront integrados.
- [ ] Evento `storefront.content.changed.v1` para invalidar caché.

**Criterio de salida:** un slide, un banner y un anuncio programados aparecen y desaparecen en la tienda en el momento configurado.

---

## Fase 5 — CMS y SEO completo

**Módulos:** `cms`, `seo`
**Contrato aplicable:** §4.7 (ACL), §6.1 (sin JOINs entre prefijos), §8 (eventos para el sitemap).
**Seguridad y recuperación:** SEC-CMS-01..06, SEC-WEB-06, SEC-VAL-03 · `ROLLBACK_RECOVERY.md`: slugs/redirecciones y sitemap reconstruible tras un rollback.

**CMS**
- [ ] Páginas con bloques (texto enriquecido, imagen, galería, FAQ, productos destacados, CTA, HTML sanitizado).
- [ ] Versionado, borrador/publicado, programación y restauración.
- [ ] Menús (header, footer) anidados.
- [ ] CRUD completo en admin con editor y vista previa; rutas `/p/:slug`.

**SEO**
- [ ] `seo_metadata` por entidad (producto, categoría, marca, página, home) con plantillas y sobrescritura manual.
- [ ] Editor SEO en cada formulario del admin con vista previa de buscador y tarjeta social.
- [ ] JSON-LD: `Organization`, `WebSite`, `Product`/`Offer`, `BreadcrumbList`, `FAQPage`.
- [ ] `sitemap.xml` (índice + por tipo) mantenido por eventos, y `robots.txt` editable.
- [ ] Redirecciones 301/302 con CRUD y creación automática al cambiar un slug.
- [ ] Control de indexación y canonical para filtros/paginación.
- [ ] Auditoría SEO en el admin (sin descripción, imágenes sin alt, títulos duplicados).

**Criterio de salida:** sitemap válido en Search Console, datos estructurados válidos y redirecciones funcionando.

---

## Fase 6 — Promociones

**Módulo:** `promotions`
**Contrato aplicable:** §4, §5, §10 (`PromotionsGateway`), §8.
**Seguridad y recuperación:** SEC-ORD-05, SEC-RATE-01, SEC-VAL-06, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: reconciliar `promotions_redemptions` con pedidos.

- [ ] Tipos: porcentaje, monto fijo, NxM, envío gratis, precio especial por producto/categoría/marca (**productos con descuento**).
- [ ] Reglas: vigencia, mínimo de compra, segmentos de cliente, límites de uso, prioridad y combinabilidad.
- [ ] Cupones: únicos o masivos, límite global y por cliente, canjes registrados.
- [ ] `PromotionsGateway`: evaluación de carrito/producto sin acoplar `cart` ni `catalog`.
- [ ] Página `/promociones`, etiquetas de descuento en listado y detalle.
- [ ] CRUD completo en admin con simulador de reglas.
- [ ] Evento `promotions.promotion.changed.v1`.

**Criterio de salida:** una promoción programada se aplica en listado y detalle con el precio correcto, y un cupón respeta sus límites.

---

## Fase 7 — Envíos y cobertura

**Módulo:** `shipping`
**Contrato aplicable:** §4, §6.1 (IDs sin FK), §10 (`ShippingGateway`), §4.7 (ACL).
**Seguridad y recuperación:** SEC-ISO-02, SEC-ORD-07, SEC-VAL-04, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: migraciones de zonas y seed idempotentes.

- [ ] Seed de divisiones político-administrativas (departamentos, ciudades, municipios; códigos DANE/DIVIPOLA).
- [ ] Zonas `national`, `department`, `city`, `municipality` con tarifas, plazos y **si admiten contra entrega**.
- [ ] `ShippingGateway`: ¿cobertura para dirección X?, tarifa, ¿zona admite contra entrega?
- [ ] CRUD completo en admin: zonas, cobertura y tarifas; selector de zonas en el formulario de producto (`local`).
- [ ] Validación en detalle de producto: "¿llega a mi ciudad?" por selector de municipio.
- [ ] Evento `shipping.zone.changed.v1` para invalidar caché.

**Criterio de salida:** un producto `local` solo se acepta para direcciones de sus zonas, y uno `national` para cualquier dirección cubierta.

---

## Fase 8 — Compra y pagos (Wompi + contra entrega)

**Módulos:** `cart`, `inventory`, `orders`, `payments`, `realtime`
**Contrato aplicable:** §4.4 (un agregado por transacción), §5 (idempotencia), §6.5 (Outbox), §8 (ack manual, DLQ), §10, §16, §17 (caos), §20.
**Seguridad y recuperación:** SEC-ISO-02..06, SEC-ORD-01..07, SEC-PAY-01..09, SEC-RT-01..09, SEC-RATE-01, SEC-LOG-01..04, SEC-SES-05 · `ROLLBACK_RECOVERY.md`: reconciliación de negocio (Wompi, stock, recaudos), Queues/DLQ, pausa de consumidores.

**Carrito e inventario**
- [ ] `cart`: invitado y cliente, fusión al iniciar sesión, validación de precio/stock/cobertura vía Gateways.
- [ ] `inventory`: stock por variante, movimientos, reservas con expiración (Cron), alerta de stock bajo; Durable Object solo si la concurrencia lo exige.

**Pedidos y política de checkout**
- [ ] `orders`: creación con snapshot de productos, estados e historial, cancelaciones y devoluciones básicas.
- [ ] `OrdersCheckoutPolicy` en el **dominio** de `orders` (README §5.1): contra entrega solo si todos los productos lo permiten y la zona lo admite; bloqueo de productos locales fuera de cobertura; informar qué producto bloquea cada método.
- [ ] Flujo orquestado por eventos y outbox (sin transacciones entre módulos): `order.placed` → reserva → pago → confirmación.

**Pagos con Wompi**
- [ ] `IPaymentPort` + adaptador Wompi; referencia única y **firma de integridad**; montos en centavos COP.
- [ ] Webhook `POST /api/v1/webhooks/wompi`: verificación del checksum, idempotencia por `eventId`, outbox hacia `payments.payment.confirmed.v1`.
- [ ] Estados aprobado / rechazado / pendiente / anulado / error; reconsulta de pendientes por Cron.
- [ ] Sandbox y producción separados; secretos solo en Cloudflare Secrets.
- [ ] Reembolsos y anulaciones desde el admin.

**Pago contra entrega**
- [ ] Método `cash_on_delivery` en `payments` y tabla `payments_cod_collections`.
- [ ] Estados `placed → confirmed → shipped → delivered → cash_collected`; registro de recaudo en el admin.
- [ ] Verificación opcional previa (teléfono/dirección) configurable en `settings`.

**Notificaciones en tiempo real de pagos (`realtime`)** — ver README §5.1
- [ ] Durable Object `REALTIME_HUB` con WebSockets (Hibernation), salas `admin:payments` y `customer:{id}` decididas por el servidor (ADR-0011).
- [ ] Upgrade autenticado por sesión + permiso, verificación de `Origin`, límites de conexiones y *heartbeat* (SEC-RT).
- [ ] Consumer idempotente de `payments.payment.confirmed.v1`, `payments.payment.failed.v1` y `payments.cod.collected.v1`: arma el detalle completo vía Gateways (ACL), guarda `realtime_notifications` y publica al hub.
- [ ] Notificación **con todos los detalles** (pago, pedido, cliente, entrega) según el rol; sin datos de tarjeta.
- [ ] Historial, no leídas y recuperación de perdidas por HTTP (`?since=`); entrega al menos una vez con deduplicación por `notificationId`.
- [ ] Frontend admin: *toast*, sonido opcional, contador, `/admin/notifications` y feed en vivo en `/admin/payments`.
- [ ] Frontend cliente: actualización en vivo del estado del pago en `/checkout/resultado` y `/cuenta/pedidos/:id`.
- [ ] Cierre de sockets al cerrar o revocar la sesión; reconexión con *backoff*.

**Cliente y admin**
- [ ] Páginas `/carrito` y `/checkout` (selección de dirección, envío, método de pago).
- [ ] Admin: pedidos, inventario, pagos, recaudos y reembolsos.
- [ ] Pruebas de contrato y de caos: webhooks duplicados, desordenados y con firma inválida.

**Criterio de salida:** compra completa en sandbox de Wompi y compra contra entrega, con stock descontado una sola vez aun con webhooks duplicados, y el **admin recibe en tiempo real la notificación del pago con todos los detalles** (y el cliente la de su propio pago), sin duplicados tras reconexiones.

---

## Fase 9 — Facturación, email con Resend, cuenta del cliente y auditoría

**Módulos:** `invoicing`, `notifications`, `identity` (cuenta), `audit`
**Contrato aplicable:** §8 (consumers idempotentes), §12 (sin PII en logs), §16 (timeouts y retries).
**Seguridad y recuperación:** SEC-INV-01..09, SEC-RT-04..05, SEC-MAIL-01..06, SEC-AUTH-08, SEC-PRIV-01..03, SEC-ADM-03 y 06, SEC-LOG-01..02 · `ROLLBACK_RECOVERY.md`: idempotencia de emails y `notifications_log`.

**Facturación (`invoicing`)** — ver README §5.1
- [ ] Cerrar ADR-0012 (documento interno vs. factura electrónica con validez legal) y ADR-0013 (generación del PDF) antes de empezar.
- [ ] Perfil fiscal del emisor en `settings` (razón social, identificación fiscal, dirección, resolución/prefijo).
- [ ] Datos de facturación del cliente capturados en el checkout y guardados como *snapshot* en el pedido.
- [ ] Consumer idempotente de `payments.payment.confirmed.v1` y `payments.cod.collected.v1` → emisión de la factura con **todos los detalles** (encabezado, emisor, cliente, pedido/envío, líneas, impuestos, totales, pago, trazabilidad).
- [ ] Numeración consecutiva, atómica y sin huecos por prefijo/resolución; un solo documento por pago/pedido (`UNIQUE` + idempotencia).
- [ ] **Cuadre obligatorio** contra el monto confirmado por Wompi; si no cuadra, no se emite y se alerta.
- [ ] Snapshot JSON inmutable en D1 y PDF en R2 (`private/invoices/…`) mediante `IInvoicePdfPort`.
- [ ] Notas crédito y anulaciones trazables; ninguna edición ni borrado de facturas emitidas.
- [ ] Evento `invoicing.invoice.issued.v1` → email con Resend (PDF o enlace seguro) y actualización de la notificación en tiempo real con el número de factura.
- [ ] Admin `/admin/invoices`: búsqueda y filtros, detalle completo, descarga, reenvío por email, notas crédito, exportación auditada.
- [ ] Cliente `/cuenta/facturas`: listado y descarga de sus facturas (404 si son ajenas).
- [ ] Si ADR-0012 exige facturación electrónica legal: `IElectronicInvoicingPort` con el proveedor elegido, y almacenamiento de XML, identificadores fiscales y acuses devueltos.
- [ ] Política de retención de facturas conforme a la normativa aplicable.

**Email y cuenta**
- [ ] `IEmailPort` + adaptador **Resend**; dominio de envío verificado (SPF/DKIM/DMARC).
- [ ] Envío desde consumer de Queue: reintentos con backoff, DLQ y `Idempotency-Key`.
- [ ] Webhook `POST /api/v1/webhooks/resend` con firma verificada; entregas, rebotes y quejas en `notifications_log`.
- [ ] Plantillas versionadas y editables en admin: bienvenida, verificación, recuperación, confirmación de pedido, cambio de estado, recaudo contra entrega, stock bajo (interno).
- [ ] Reemplazo del adaptador de consola de la Fase 1 por Resend.
- [ ] Área `/cuenta`: perfil, direcciones, historial y detalle de pedidos.
- [ ] `audit`: consumidor de eventos y acciones admin; consulta por usuario, entidad y fecha.
- [ ] Dashboard del admin (ventas, pedidos, stock bajo, pagos pendientes).

**Criterio de salida:** cada pago aprobado (o recaudo contra entrega) produce **una única factura completa**, numerada sin huecos, guardada en D1 y R2, descargable por el cliente y el admin y enviada por email; los emails llegan con reintentos y DLQ, y cada acción administrativa relevante queda auditada. **No se lanza a producción sin esta fase completa.**

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
