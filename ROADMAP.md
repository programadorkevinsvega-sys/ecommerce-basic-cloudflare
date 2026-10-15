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

| Fase | Nombre | Tamaño | Estado | Resultado |
|---|---|:---:|:---:|---|
| 0 | Fundaciones | M | ⚠️ Parcial | Monorepo, Worker base y CI; staging aislado y ensayo de recuperación pendientes |
| 1 | Identidad y configuración | M | ✅ Completada | Login de admin y clientes, RBAC, ajustes de tienda |
| 2 | Medios y catálogo | L | ✅ Completada | CRUD de productos con políticas de venta por producto |
| 3 | Tienda pública base | L | ✅ Completada | Home, listado, detalle, SEO básico en SSR |
| 4 | Contenido de la tienda | M | ✅ Completada | Carrusel, banners y anuncios con su gestión |
| 5 | CMS y SEO completo | L | ✅ Completada | Páginas, menús, sitemap, JSON-LD, redirecciones |
| 6 | Promociones | M | ✅ Completada | Promociones, cupones y productos con descuento |
| 7 | Envíos y cobertura | M | ✅ Completada | Envío nacional o local (ciudad/municipio) por producto |
| 8 | Compra, pagos (Wompi + contra entrega) y notificaciones en tiempo real | L | ✅ Certificada | Carrito, checkout, pedidos, pagos y aviso en vivo con todos los detalles |
| 9 | Facturación, email con Resend y cuenta del cliente | L | ✅ Certificada | Facturas completas almacenadas, emails, `/cuenta`, auditoría y datos fiscales dinámicos |
| 10 | Venta a crédito | M | ⏳ Siguiente | Planes, cuotas y abonos (alcance por confirmar) |
| 11 | Endurecimiento y lanzamiento | M | 📋 Planificada | Carga, caos, seguridad, alertas, go-live |
| 12 | Evolución | — | 🔄 Parcial | Reseñas y seguimiento implementados; wishlist, i18n y extracción siguen pendientes |
| 13 | Envíos con MiPaquete | M | 🔄 Operativa con validación pendiente | Cotización nacional, perfiles de empaque, guías, trazabilidad y conciliación ambigua |

```text
0 ─► 1 ─► 2 ─► 3 ─► 4 ─► 5 ─► 6 ─► 7 ─► 8 ─► 9 ─► 10 ─► 11 ─► 12 ─► 13
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
- [x] `wrangler.jsonc` del Worker único con bindings de producción para D1, R2, KV, Queue/DLQ, Analytics Engine y Cron. La configuración aislada de staging no está lista.
- [x] Estructura base de §3: `bff/`, `modules/`, `shared-kernel/`, `platform/`, `composition-root.ts`, `index.ts` (`fetch`, `queue`, `scheduled`).
- [x] `shared-kernel` mínimo (§11): `Result<T,E>`, `UUID`, `IClock`, errores base.
- [x] `platform`: logger JSON con `trace_id`/`request_id` (§12), manejo de errores, propagación de `traceparent`.
- [x] BFF con Hono + Zod/OpenAPI, `/health` (§13) y `/api/docs`.
- [x] Script de **migraciones por módulo** (`<modulo>__0001_init.sql`), ejecutable módulo a módulo (§6.2).
- [x] **Test/lint de aislamiento de tablas** (§6.1, ADR-0001): falla si un módulo referencia tablas de otro prefijo.
- [x] Lint: dominio/aplicación sin imports de Cloudflare, sin imports entre módulos, límite de 200 líneas, prohibido `utils.ts`/`helpers.ts`.
- [x] Outbox genérico y relay por Cron; publisher y consumer base de Queues con ack manual (§6.5, §8).
- [x] CI en GitHub Actions para las validaciones configuradas; no despliega a staging.
- [x] `docs/PROJECT_RULES.md` (§22) y ADRs 0002–0013.
- [x] `docs/migrations/manifest.md`: registro de migraciones por módulo y entorno.
- [ ] **Staging aislado** (Worker, D1, R2, KV, Queues, secretos) con Wompi sandbox y Resend de prueba, según `ROLLBACK_RECOVERY.md`.
- [x] Escaneo de secretos (gitleaks) y auditoría de dependencias en CI; protección de la rama `main`.
- [x] Cabeceras de seguridad base (CSP, HSTS, nosniff, etc.) en el Worker (SEC-WEB-02).
- [x] Módulo de referencia (`settings`, mínimo) como plantilla para los demás.
- [x] Documentar en el repo cómo entregar el contrato como contexto a agentes de IA antes de generar código.

**Criterio de salida:** `GET /health` desplegado en staging, CI en verde y el test de aislamiento fallando ante una violación. **Estado parcial:** el repositorio tiene Worker/CI, pero staging aislado y evidencia del ensayo de rollback siguen pendientes; ver `ROLLBACK_RECOVERY.md`.

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
- [x] UI del panel servida por el Worker en `/admin` y `/admin/login`; dashboard con navegación por secciones y scripts para sus interacciones. `apps/admin` todavía no contiene el frontend desplegado.

**Criterio de salida:** un admin inicia sesión, un cliente se registra y entra, y un permiso faltante devuelve `403`. (Completado y verificado en producción).

---

## Fase 2 — Medios y catálogo

**Módulos:** `media`, `catalog`
**Contrato aplicable:** §4.4 (agregados), §4.5 (eventos), §6.1, §6.4 (R2), §6.5, §7 (KV), §8.
**Seguridad y recuperación:** SEC-R2-01..08, SEC-VAL-03, 04 y 06, SEC-CMS-06, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: sección R2 (ambas versiones leen los objetos), consistencia D1/R2.

- [x] `media`: subida a R2 (validación de tipo/tamaño con magic bytes SEC-R2-04), carpetas, alt text obligatorio, rutas privadas y públicas.
- [x] `catalog`: productos (simples y con variantes), categorías jerárquicas, atributos, estados (borrador / publicado / archivado).
- [x] Etiquetas de producto con catálogo propio, CRUD y estado; asignación de etiquetas existentes desde crear/editar producto; migración aditiva que conserva las etiquetas existentes.
- [x] **Políticas de venta por producto** (ver README §5.1):
  - [x] `allows_cash_on_delivery` (sí / no).
  - [x] `shipping_scope` (`national` / `local`) y `catalog_product_coverage` con `zone_id` como `TEXT` (sin FK).
  - [x] `sale_mode` (`cash` / `credit` / `both`) está almacenado en catálogo; el módulo de crédito y su checkout siguen pendientes (Fase 10 / ADR-0009).
- [x] Slugs únicos con validación regex para evitar inyecciones y colisiones.
- [x] Búsqueda con D1 FTS5 dentro del prefijo `catalog_` (ADR-0006).
- [x] Endpoints BFF públicos para consultar productos por slug/listado y endpoints Admin para creación protegida con RBAC (`catalog:create`, `media:create`).
- [x] `MediaGateway` consumido por catálogo (solo IDs, sin FKs).

**Criterio de salida:** crear desde el admin un producto con imágenes, variantes y política de venta, y consultarlo por la API con todo resuelto.

---

## Fase 3 — Tienda pública base

**Módulos:** `catalog` (lectura pública), `seo` (mínimo), BFF `store/*`
**Contrato aplicable:** §7 (KV/Cache API), §9 (BFF), §10 (Gateways), §16 (resiliencia).
**Seguridad y recuperación:** SEC-WEB-01..06, SEC-FE-01..04, SEC-VAL-05, SEC-CMS-03 · `ROLLBACK_RECOVERY.md`: rollback del Worker y purga de caché. El SSR actual no está desplegado como Pages.

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
- [x] Gestión de menús principal y pie desde el admin; alta, edición, eliminación, reordenamiento y agrupación de enlaces, con RBAC `cms:read`/`cms:update` y auditoría.
- [x] Rutas públicas SSR en `/p/:slug` y navegación SSR que renderiza grupos anidados.
- [x] Blog independiente dentro del módulo CMS: artículos, autores, categorías, imágenes de Media, borrador/publicación/archivo y publicaciones programadas por Cron.
- [x] Rutas `/blog` paginada y `/blog/:slug` SSR con filtro por categoría, artículos relacionados, canonical, noindex, Open Graph, JSON-LD `BlogPosting` y sitemap específico.
- [x] Gestión administrativa independiente de Páginas CMS dentro del grupo “CMS”, con paginación de artículos, autores y categorías y RBAC `cms:*`.

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
- [x] Reglas: vigencia (starts_at/ends_at), mínimo de compra, límites de uso por cliente, prioridad de ejecución y estado activo. El mínimo se valida contra el subtotal base del carrito; las reglas con mínimo no aparecen como descuento inmediato en tarjetas de producto.
- [x] Cupones: códigos únicos en mayúsculas, límite global y límite por cliente con registro de canjes en `promotions_redemptions`.
- [x] `PromotionsGateway`: validar cupones en carrito/checkout con estado visible; el código se conserva durante la sesión y el servidor recalcula el descuento al crear el pedido, sin confiar en el importe del navegador (`SEC-VAL-06`, `SEC-ORD-05`). Los cupones por categoría comparan las categorías actuales del producto.
- [x] Etiquetas de descuento en listado y detalle (`-XX% OFF`, banner promocional y precio tachado en SSR); promociones automáticas elegibles se reflejan también en carrito, checkout y recálculo autoritativo del pedido.
- [x] CRUD completo en panel administrativo `/admin` para reglas automáticas y cupones con activación/desactivación y eliminación.
- [x] Base de datos D1 con prefijo estricto `promotions_*` y outbox de eventos (`promotions_outbox_events`).

**Criterio de salida:** una promoción sin compra mínima se aplica en listado, detalle, carrito y checkout; una promoción con mínimo solo se aplica cuando el subtotal base del carrito alcanza el umbral; un cupón respeta sus límites. (La corrección de paridad de precios se encuentra en implementación).

---

## Fase 7 — Envíos y cobertura

El envío gratis se administra como reglas independientes de las tarifas del transportista, con alcance a catálogo, producto, categoría o colección, mínimo, fechas y prioridad. No hay una regla activa por defecto; el comercio configura explícitamente sus beneficios. El servidor calcula el subsidio y guarda el flete bruto junto con su descuento en el pedido.

**Módulo:** `shipping`
**Contrato aplicable:** §4, §6.1 (IDs sin FK), §10 (`ShippingGateway`), §4.7 (ACL).
**Seguridad y recuperación:** SEC-ISO-02, SEC-ORD-07, SEC-VAL-04, SEC-ADM-01 y 03 · `ROLLBACK_RECOVERY.md`: migraciones de zonas y seed idempotentes.

- [x] Seed de divisiones político-administrativas (departamentos, ciudades, municipios; códigos DANE/DIVIPOLA).
- [x] Zonas `department`, `city` y `municipality` para entrega local del comercio con tarifa, plazo y regla de contra entrega; MiPaquete determina cobertura y tarifa nacionales.
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
- [x] `OrdersCheckoutPolicy` en el **dominio** de `orders` (README §5.1): contra entrega solo si todos los productos lo permiten y la zona lo admite; para cobertura nacional depende de MiPaquete y una cotización COD vigente, mientras que para entrega local depende de la configuración de la zona; bloqueo de productos locales fuera de cobertura; informar qué producto bloquea cada método.
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

**Notificaciones de pagos (`realtime`)** — ver README §5.1
- [x] Persistencia de notificaciones en D1 y consulta REST incremental con cursor `since`.
- [x] Canal/propietario se derivan en el servidor desde la sesión validada; lectura y marcado de no leídas.
- [x] El panel de pagos hace polling aproximadamente cada 8 segundos.
- [ ] WebSockets/Durable Objects y actualización en vivo de otras pantallas no están implementados; requieren decisión y trabajo separado antes de someterlos a pruebas de carga.

**Cliente y admin**
- [x] Páginas `/carrito` y `/checkout` (selección de dirección, zona con tarifa dinámica, validación de políticas y método de pago).
- [x] Admin: tabs dedicados a Pedidos, Inventario, Pagos y Recaudos contra entrega con actualización instantánea.
- [x] Pruebas unitarias de aislamiento, arquitectura y políticas de checkout en verde.

**Criterio de salida:** Compra completa con Wompi y compra contra entrega, con políticas de cobertura evaluadas en tiempo real, recaudo registrado en el admin y notificaciones en vivo.
- **Estado de certificación:** ✅ **COMPLETO Y CERTIFICADO EN PRODUCCIÓN**
- **Evidencia verificada:**
  - Compra real con Wompi aprobada: Orden `#ord-c66fd139`, Transacción Wompi `#11306435-1791789352-34934` por valor de $1.728.550 COP.
  - Webhook de Wompi verificado con código HTTP `200 { "received": true }` validando firma criptográfica SHA-256 sobre `properties` dinámicas de `body.data`.
  - Descuento de stock en vivo: 20 unidades descontadas de `Camiseta Oversize Vega` (SKU `TSHIRT-VEGA-001`), stock total y disponible ajustado de 50 u. a 30 u.
  - Transición de estados del pedido: `status: 'confirmed'`, `paymentStatus: 'approved'`.
  - Gestión visual en panel de administración: Modal de inspección de pedidos (`👁️ Detalle`) visualizando líneas de compra, cantidades, precios unitarios, datos de contacto, dirección completa de entrega y desglose financiero.
  - Gestión de inventario profesional: KPIs de stock (total, disponible, reservado, bajo stock) y modal de ajustes manuales con motivo auditado.

---

## Fase 9 — Facturación, email con Resend, cuenta del cliente y auditoría

**Módulos:** `invoicing`, `notifications`, `identity` (cuenta), `audit`
**Contrato aplicable:** §8 (consumers idempotentes), §12 (sin PII en logs), §16 (timeouts y retries).
**Seguridad y recuperación:** SEC-INV-01..09, SEC-RT-04..05, SEC-MAIL-01..06, SEC-AUTH-08, SEC-PRIV-01..03, SEC-ADM-03 y 06, SEC-LOG-01..02 · `ROLLBACK_RECOVERY.md`: idempotencia de emails y `notifications_log`.

**Facturación (`invoicing`)** — ver README §5.1
- [x] Cerrar ADR-0012 (factura interna inmutable; desacoplada de DIAN por el momento, puerto `IElectronicInvoicingPort` listo para futura integración) y ADR-0013 (documento HTML/CSS para impresión almacenado en R2; no es un PDF binario).
- [x] Perfil fiscal dinámico del emisor en `settings` (Razón Social, NIT de la empresa, Dirección comercial, régimen común y resolución RES-INT-2026-001) administrable en `/admin`.
- [x] Captura obligatoria de identificación fiscal / Cédula / NIT del cliente (`customerTaxId`) en checkout tanto para compras de invitado como autenticadas.
- [x] Datos de facturación del cliente capturados y guardados como *snapshot* inmutable en `invoicing_invoices`.
- [x] Emisión automática e idempotente tras confirmación de pago (Wompi o recaudo contra entrega) con todos los detalles (emisor dinámico, cliente, pedido, líneas, IVA 19%, totales, trazabilidad).
- [x] Numeración consecutiva, atómica y sin huecos (`FAC-000001`, `FAC-000002`...) mediante `invoicing_sequences`; una sola factura por pedido (`UNIQUE` + idempotencia).
- [x] **Cuadre obligatorio** contable matemático (`subtotal + tax + shipping - discount == total`); si no cuadra, no se emite y alerta.
- [x] Snapshot JSON inmutable en D1 y documento soporte formal en Cloudflare R2 (`private/invoices/{num}.html`) mediante `IInvoicePdfPort` (`HtmlInvoicePdfAdapter`).
- [x] Notas crédito (`invoicing_credit_notes`) emitibles desde el admin vinculadas a facturas existentes.
- [x] Admin `/admin` tab Facturación 🧾: listado de facturas, búsqueda, visualización/descarga de documento y emisión de notas crédito.
- [x] Cliente `/cuenta`: portal con perfil, historial de pedidos y descarga segura de sus facturas.
- [x] Puerto `IElectronicInvoicingPort` y adaptador base implementados para conectar DIAN en el futuro sin modificar el dominio.

**Email y auditoría**
- [x] `IEmailPort` + adaptador oficial **Resend** (`ResendEmailAdapter`) con soporte para secreto `RESEND_API_KEY` y remitente configurable `RESEND_FROM_EMAIL`.
- [x] Envío transaccional idempotente con registro en `notifications_log` (`status: 'sent'`).
- [x] Notificación doble de compra aprobada: correo con comprobante y factura al cliente, y correo de alerta operativa de empaque al buzón de la tienda.
- [x] Notificaciones automáticas por cambio de ciclo de vida del pedido: despacho (`shipped` con transportadora/guía), entrega (`delivered`) y cancelación (`cancelled`).
- [x] Plantillas HTML diseñadas para alta entregabilidad (deliverability optimizada, pie de página corporativo, prevención de filtros antispam).
- [x] Área `/cuenta` con vista SSR responsiva (`renderCustomerAccountPage`).
- [x] `audit`: módulo DDD completo con bitácora `audit_logs` registrando mutaciones del sistema y administradores (pagos, notas crédito, pedidos).
- [x] Admin `/admin` tab Auditoría 📜: visualización en tiempo real de la bitácora de auditoría con actor, acción, entidad y cambios.

**Criterio de salida:** cada pago aprobado produce una única factura completa, numerada sin huecos, guardada en D1 y R2, descargable por el cliente y el admin y enviada por email transaccional con bitácora inmutable de auditoría.
- **Estado de certificación:** ✅ **COMPLETO Y CERTIFICADO EN PRODUCCIÓN**
- **Evidencia verificada:**
  - Factura real emitida: **`FAC-000001`** asociada a orden `#ord-c66fd139` ($1.728.550 COP) y **`FAC-000002`** asociada a orden `#ord-d3c6f2c0` ($94.978 COP).
  - Almacenamiento en R2: Objetos `private/invoices/FAC-000001.html` y `private/invoices/FAC-000002.html` verificados físicamente y servibles con `HTTP 200` desde endpoint `/api/v1/invoices/:id/document`.
  - Configuración fiscal de tienda verificada: Campos `company_nit`, `company_legal_name` y `company_address` persistidos en `settings_store` e integrados al generador de facturas.
  - Cédula/NIT del comprador verificada en checkout y snapshot de facturación (`customerTaxId: 32154464646` / C.C. válida).
  - Envíos de correo exitosos vía Resend con dominio verificado (`no-reply@...` / `RESEND_FROM_EMAIL` dinámico) tanto para compra aprobada como actualización a enviado (`shipped`).
  - Bitácora de notificaciones: Registros en `notifications_log` con plantillas `order_confirmed` y `order_shipped` en estado `sent`.
  - Bitácora de auditoría: Registros en `audit_logs` con `action: payments.payment_confirmed` y mutaciones administrativas.
  - Portal `/cuenta` operativo y pestañas administrativas de Facturación 🧾 y Auditoría 📜 activas en `/admin`.

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
- [ ] Decidir e implementar transporte push (si se requiere); luego probar límites de conexión, reconexión y aislamiento antes de describirlo como tiempo real.
- [ ] **Chaos / resiliencia** en Miniflare: fallo de D1, saturación de Queues, fallo de Gateways, caída de Wompi o Resend (§17).
- [ ] Revisión de seguridad y **ejecución de la matriz de regresión** (`SECURITY_RULES.md` §21): IDOR, manipulación de precios, webhooks falsos/repetidos, XSS en CMS, escalada de privilegios, caché con datos personales.
- [ ] **Ensayo de rollback** en staging (Worker, D1 *Time Travel*, Queues, purga de caché) y **reconciliación de pagos** con Wompi, con evidencia (`ROLLBACK_RECOVERY.md`).
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

- [x] Reseñas públicas verificadas por compra entregada, página propia paginada y `AggregateRating` en JSON-LD; reseñas cargadas por migración permanecen internamente marcadas como no verificadas y no se atribuyen a compras.
- [x] Gestión administrativa de reseñas: listar, buscar/paginar, crear, ver, editar, publicar/ocultar y eliminar; el método de pago solo procede de la verificación del pedido y no se inventa para una reseña editorial.
- [ ] Lista de deseos.
- [x] Productos relacionados en la ficha, seleccionados por etiquetas, marca, tipo de producto y categorías compartidas; no aparecen recomendaciones sin relación.
- [x] Guías textuales por producto y enlaces a artículos publicados del blog desde la ficha; sin archivos PDF ni referencias SQL entre módulos.
- [x] Seguimiento seguro: clientes autenticados consultan pedidos de su cuenta; invitados usan una clave aleatoria enviada por correo. Admin puede gestionar estados, historial, datos de envío y guías desde sus secciones operativas.
- [ ] Validar el ciclo completo desplegado con un pedido real y una guía real, incluyendo recepción de email, tracking de la transportadora y privacidad de acceso.
- [ ] Multi-idioma con `hreflang`.
- [ ] Búsqueda avanzada y sugerencias.
- [ ] Carritos abandonados y campañas por email.
- [ ] Fidelización y gift cards.
- [ ] **Extracción de módulos** a Workers propios cuando exista necesidad real, siguiendo la sección 10.1 del contrato (D1 propia, `ServiceBinding<Modulo>Gateway`, un cambio de wiring en `composition-root.ts`).

---

## Fase 13 — Integración de envíos con MiPaquete.com

**Tamaño:** M · **Bounded context:** `shipping`.
**Contrato aplicable:** §0, §1.bis, §2 (DIP), §4.1, §6.1–6.2, §8 (Queues), §10 (Gateways), §12–13, §16–17 y §19.
**Seguridad y recuperación:** SEC-SEC-01..05 (credenciales por entorno), SEC-MOD-01..04 (fronteras y Gateways), SEC-ISO-02..06 (propiedad y consultas), SEC-ADM-01..04 (RBAC y auditoría), SEC-ORD-01/04/07 (envío, estados y reglas de pedido), SEC-PAY-03..04 como patrón de autenticidad, idempotencia y reconciliación de webhooks, SEC-WEB-02..04 (cabeceras, HTTPS y no-store), SEC-LOG-01..03 (sin secretos/PII en logs) · `ROLLBACK_RECOVERY.md`: operaciones externas idempotentes, reintentos y reconciliación de guías/estados.

**Objetivo:** cotizar, crear y consultar envíos con la [API v2 de MiPaquete](https://api.documentacion.mipaquete.com/) y reflejar guía/tracking en los paneles autorizados. El host de producción indicado por la tienda está configurado; la integración no se considera punta a punta certificada hasta comprobar la creación real de una guía, su impresión, la entrega de email y la sincronización de estados.

- [x] Configurar el host productivo indicado por la tienda (`https://api-v2.mpr.mipaquete.com`) explícitamente en Cloudflare y guardar la credencial como secret; cotizaciones de producción respondieron con tres transportadoras para Medellín y Bogotá.
- [x] Definir el contrato del adaptador `IShippingCarrierPort` en `shipping`; cliente HTTP con timeout, validación Zod y configuración explícita. El BFF consume el módulo por `ShippingGateway`; ningún otro módulo importa sus internos.
- [x] Leer la credencial del secret `MI_PAQUETE_TRANSPORTADORA` en runtime y exigir `MI_PAQUETE_API_URL` HTTPS explícita; no guardarlos en D1, frontend, logs o respuestas.
- [x] Cotizar desde servidor usando DANE, paquete y valor declarado; perfil de empaque se configura en Envíos y Cobertura. La tarifa y transportadora elegidas se guardan al crear el pedido y el servidor vuelve a validar su vigencia.
- [x] Guardar en cada producto dimensiones y peso de su unidad empacada; una unidad se cotiza directamente con sus medidas/peso, sin caja adicional. Desde dos unidades, encajarlas en la caja activa compatible de menor volumen, sumar el peso de unidades y tara, y guardar la instantánea exacta del paquete en cada cotización. Si no existe caja compatible, no ofrecer tarifa.
- [x] Gestionar los perfiles de caja desde admin con operaciones independientes de listar, ver, crear, editar, activar/desactivar y eliminar.
- [x] Separar valor declarado, valor de mercancía y recaudo COD: el mensajero recauda el total que debe el comprador (IVA incluido y flete si se factura), mientras que el valor de mercancía excluye flete y tarifa de transacción Wompi.
- [x] Separar entregas locales gestionadas por la tienda de envíos nacionales cotizados por MiPaquete; cada pedido nuevo guarda su modalidad de cumplimiento y los anteriores quedan `legacy`.
- [x] Permitir al comprador incluir el flete en el pedido o solicitar su cobro al entregar; la segunda opción queda fuera del total/factura y usa recaudo MiPaquete (flete adicional al COD o solo flete si mercancía ya se pagó por Wompi).
- [x] Disparar la creación de guía automáticamente después del webhook Wompi verificado/reconciliado o de la primera confirmación administrativa de contra entrega. No se reprocesan pedidos históricos en lote; el botón manual queda como contingencia idempotente.
- [x] Persistir en tablas `shipping_*` el identificador, transportadora, guía, URL y estado. El admin puede crear/consultar guía desde gestión de seguimiento; se refleja en el seguimiento público ya autorizado.
- [x] Mostrar guías en el panel de seguimiento, permitir abrir guías individuales o el lote visible y registrar la confirmación de impresión con actor y fecha.
- [x] La documentación revisada no describe firma verificable de webhook; no se acepta callback externo. Se consulta `getSendings` con credenciales mediante Cron cada cinco minutos y se permite sincronización administrativa autenticada, con deduplicación de eventos.
- [x] Conciliar respuestas ambiguas consultando `getSendings` por rango acotado y referencia única del pedido; una coincidencia única recupera guía/estado, con pausa entre consultas, sin volver a crear mientras siga ambiguo.
- [ ] Resolver con MiPaquete el caso sin coincidencia confirmada; sin garantía documentada de consistencia eventual, el sistema conserva el bloqueo y no autoriza un segundo `createSending` automáticamente.
- [x] Aplicar/verificar migración aditiva `shipping__0002_mipaquete_shipments.sql`; arquitectura, aislamiento, pruebas D1 vacía/idempotente y tests de adaptador/configuración pasan. Quedan pruebas de integración real con proveedor y fallos externos.
- [ ] Crear una guía real controlada tras confirmar costos y operación; verificar recaudo COD, tracking, alertas y recuperación sin duplicados.

**Estado:** código y cotizaciones de producción se documentaron como operativos; la comprobación histórica registró tres transportadoras para Medellín y Bogotá usando país `170`. No se afirma que haya una guía real ni un ciclo completo certificado. Los perfiles y medidas iniciales son estimaciones por calibrar. No se acepta webhook sin firma verificable documentada; el estado se consulta mediante API autenticada.

**Criterio de salida:** host productivo validado; cotización y guía real controlada verificadas; estados visibles para admin y cliente; costos COD conciliados; pruebas de fallos/rollback y evidencia registradas antes de activar producción.

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
| Alcance creciente | Cada fase tiene criterio de salida; lo nuevo entra a una fase planificada o a la 12/13 |

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
