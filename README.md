# Ecommerce Profesional en Cloudflare (100% Serverless)

Plataforma de comercio electrónico completa, con tienda para clientes, panel de administración, CMS, promociones y SEO, construida **100% sobre Cloudflare** y **sin Cloudflare Containers**.

> ## 📐 Documento de arquitectura (obligatorio)
> **[`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md)** es el contrato que rige todo el código de este repositorio.
>
> - Debe leerse **antes** de este README y de escribir cualquier línea de código.
> - Debe entregarse como contexto a cualquier agente de IA (Claude, Codex, Copilot…) antes de generar código.
> - Ante cualquier conflicto, **la arquitectura tiene prioridad** sobre este README y sobre atajos (sección 23 del contrato). Si una petición contradice una regla, se señala antes de generar código.
> - Este README solo concreta las decisiones del proyecto; **no reemplaza ni relaja ninguna regla** del contrato.
>
> A lo largo de este documento, "§N" significa "sección N del contrato de arquitectura".

Plan de trabajo por fases: [`ROADMAP.md`](./ROADMAP.md).
Estado sincronizado entre código, operación y evidencia: [`docs/IMPLEMENTATION_STATUS.md`](./docs/IMPLEMENTATION_STATUS.md).

---

## 0. Instrucciones obligatorias para agentes de IA y desarrolladores

El punto de entrada para agentes es [`AGENTS.md`](./AGENTS.md) (y `CLAUDE.md`, que lo importa): lista todo lo que hay que leer y el checklist previo a implementar. Este repositorio se construye siguiendo **cuatro documentos normativos**. Un agente (Claude, Codex, Copilot, etc.) debe leerlos **antes de escribir, modificar o revisar cualquier archivo**, y no puede declarar terminada una tarea sin cumplirlos.

| Orden | Documento | Qué regula | Prioridad |
|:---:|---|---|---|
| 1 | [`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md) | Capas, módulos, D1 única con prefijos, Gateways, Queues, límite de 200 líneas, testing | **Máxima** |
| 2 | [`SECURITY_RULES.md`](./SECURITY_RULES.md) | Reglas `SEC-*`: aislamiento de clientes, sesiones, pagos (Wompi), admin, CMS, R2, privacidad | Obligatoria |
| 3 | [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md) | Releases, migraciones compatibles, rollback, reconciliación de pagos, Queues y caché | Obligatoria |
| 4 | [`ROADMAP.md`](./ROADMAP.md) + este README | Qué se construye y en qué orden; decisiones del proyecto | Contextual |

**Procedimiento para cada tarea**

1. Identifica la fase del [`ROADMAP.md`](./ROADMAP.md) y relee su **"Contrato aplicable"** y su **"Seguridad y recuperación"**.
2. Delimita el *bounded context* (`src/modules/<contexto>`) y no toques otros módulos: la comunicación es solo por Gateways y Queues.
3. Escribe el código respetando capas, un archivo = una responsabilidad y **máximo 200 líneas por archivo**.
4. Aplica las reglas `SEC-*` pertinentes: propiedad por sesión, validación Zod, importes calculados en el servidor, RBAC en admin, firma de webhooks, sanitización de contenido.
5. Si el cambio toca D1, Queues, R2 o caché, verifica que sea **compatible con un rollback** (expand/contract, eventos versionados, claves de caché).
6. Añade tests: unitarios, integración (Miniflare), **acceso cruzado entre clientes** y, si hay SQL, el test de aislamiento de tablas.
7. Completa el *Definition of Done* (§19 del contrato) y el checklist de PR de `SECURITY_RULES.md`.

**Reglas que un agente nunca debe saltarse**

- **Sin Cloudflare Containers.** Si un requerimiento no puede correr en un Worker, **detenerse y preguntar** (Containers vs. VM externa); jamás improvisar.
- Prohibido importar internals de otro módulo; prohibidos JOINs, FKs, vistas, triggers y `db.batch()` entre prefijos.
- Prohibida la lógica de negocio en controladores del BFF y en los frontends.
- Prohibido confiar en precios, totales, roles o `customerId` enviados por el cliente.
- Prohibido confirmar pagos por redirección del navegador; solo por webhook verificado y reconciliado con Wompi.
- Las notificaciones financieras se persisten después de los eventos autorizados; cada lectura REST exige sesión y deriva en el servidor qué actor puede verlas.
- Prohibido emitir, editar o borrar facturas desde el frontend o con datos del cliente; una factura emitida es inmutable y se corrige con nota crédito. La numeración es consecutiva, atómica e idempotente.
- Prohibido registrar secretos, datos de tarjeta o PII en logs, y guardarlos en el repositorio.
- No marcar como "probado", "certificado" o "COMPLETE" nada que no tenga evidencia reproducible (tests o verificación documentada). Los estados de seguridad y rollback están **PENDIENTES** hasta entonces.
- Si una petición contradice una regla, **señalarlo antes de generar código** y, si hace falta una excepción, documentarla en un ADR/PR.
- Ante duda entre dos documentos, gana el de mayor prioridad de la tabla.

---

## 1. Alcance funcional (estado del código, 2026-10-15)

Este cuadro describe capacidades presentes en el repositorio; no implica por sí solo que cada versión esté desplegada o que la integración externa haya pasado una prueba punta a punta. La evidencia por entorno se registra en [`AUDIT_PROGRESS.md`](./AUDIT_PROGRESS.md), [`ROADMAP.md`](./ROADMAP.md) y [`docs/migrations/manifest.md`](./docs/migrations/manifest.md).

| Requerimiento | Módulo responsable | Admin | Tienda pública |
|---|---|:---:|:---:|
| Panel y rutas de administración de todo el ecommerce | `identity` + todos | ✅ | — |
| Login y registro de clientes | `identity` | — | ✅ |
| Home | `storefront` + `catalog` + `cms` | — | ✅ |
| Listado de productos, filtros, búsqueda | `catalog` | ✅ CRUD | ✅ |
| Detalle de producto | `catalog` + `seo` + `promotions` + `reviews` | ✅ CRUD | ✅ |
| Reseñas y valoraciones | `reviews` + `orders` | ✅ Listar, crear, editar, publicar/ocultar y eliminar; compra/pago se consulta por Gateway | ✅ Ficha y página de opiniones por producto; las opiniones sembradas se mantienen diferenciadas internamente de una compra verificada |
| Carrusel y su gestión | `storefront` | ✅ CRUD | ✅ |
| Gestión de banners | `storefront` | ✅ CRUD | ✅ |
| Anuncios (home, clientes, productos) | `storefront` | ✅ CRUD | ✅ |
| Gestión de promociones y cupones | `promotions` | ✅ CRUD | ✅ |
| Canje de cupones en carrito y checkout | `promotions` + `orders` | — | ✅ Validación visible; descuento recalculado por el servidor al crear el pedido |
| CMS (páginas, bloques, menús) y Blog (artículos, autores, categorías) | `cms` | ✅ Páginas CMS, Menús y Blog en pantallas separadas | ✅ SSR público para páginas publicadas y blog |
| Colecciones | `catalog` | ✅ CRUD, imagen opcional y selección/búsqueda de productos | ✅ Directorio y detalle paginados por colección publicada |
| Seguimiento e impresión de pedidos | `orders` + `shipping` | ✅ Seguimiento operativo; guías MiPaquete y etiquetas internas paginadas para entregas locales | ✅ Cuenta autenticada por propiedad; invitado mediante clave de capacidad enviada por email |
| SEO | `seo`, `catalog`, `cms` | ✅ Redirecciones y campos SEO específicos existentes | ✅ Metadatos SSR en las rutas que los implementan |
| Biblioteca de medios | `media` | ✅ CRUD | — |
| Carrito, checkout, pedidos | `cart`, `orders`, `inventory` | ✅ | ✅ |
| Pagos en línea con **Wompi** | `payments` | ✅ | ✅ |
| Notificaciones de pagos | `realtime` | ✅ Lectura incremental autenticada desde D1 | ✅ Solo las asociadas a su sesión/propiedad |
| **Facturas** generadas y almacenadas con todos los detalles | `invoicing` | ✅ | ✅ (solo las suyas) |
| **Pago contra entrega** configurable por producto | `catalog` + `orders` + `payments` | ✅ | ✅ |
| **Entrega local o envío nacional** | `orders` + `shipping` + `catalog` | ✅ Zonas locales y transportadora configuradas por separado | ✅ Local según zonas de Medellín/Valle de Aburrá; nacional cotizado por MiPaquete |
| Productos con descuento | `promotions`, `catalog` | ✅ | ✅ |
| Cuenta del cliente (pedidos, direcciones) | `identity`, `orders` | — | ✅ |
| Configuración de la tienda | `settings` | ✅ | — |
| Auditoría de acciones | `audit` | ✅ lectura | — |
| Emails transaccionales con Resend | `notifications` | ✅ Envío desde plantillas implementadas en código | — |

Las acciones administrativas dependen del contrato y del valor histórico de cada entidad; no se asume que todo dato admita borrado físico. Los módulos financieros y de auditoría conservan trazabilidad y usan correcciones/estados en lugar de alterar el historial.

---

## 2. Reglas no negociables (resumen del contrato)

1. **Un solo Worker** (un binario, un despliegue) con el BFF y todos los módulos. No se crean Workers adicionales sin necesidad real (ADR-0001).
2. **Una sola D1** (`env.DB`) con **tablas prefijadas por módulo** (`<modulo>_*`). Cero JOINs, subconsultas, vistas, triggers y FKs entre prefijos. Las referencias entre módulos son IDs simples (`TEXT`).
3. **Ningún módulo importa código de otro**, ni el BFF importa internals de un módulo. Solo hay dos canales:
   - **Gateways** (interfaz del consumidor + adaptador en proceso; Service Binding si algún día se separa).
   - **Cloudflare Queues** (eventos de integración versionados con Zod, outbox por módulo, ack manual y DLQ).
4. **Capas DDD / Clean / Hexagonal**: `domain` ← `application` ← `infrastructure`. El dominio y la aplicación nunca importan tipos de Cloudflare (`D1Database`, `R2Bucket`, `KVNamespace`, `Queue`).
5. **Máximo 200 líneas por archivo**, una responsabilidad pública por archivo, nombre de archivo = nombre de lo que exporta. Prohibidos `utils.ts` / `helpers.ts`.
6. **Gateways cableados únicamente en `src/composition-root.ts`**.
7. **BFF (Hono) sin lógica de negocio.** Solo valida (Zod/OpenAPI), invoca Gateways y compone respuestas.
8. **Sin Cloudflare Containers.** Ningún requerimiento actual los necesita. Si aparece uno que no pueda correr en Workers, el agente/desarrollador **debe detenerse y consultar** (Containers vs. VM externa) antes de seguir, como exige el contrato.
9. **Logs JSON estructurados** con `trace_id`; nunca contraseñas, secretos ni PII.
10. **Test automático de aislamiento de tablas** en CI: falla si el SQL de un módulo menciona tablas de otro prefijo.

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript (strict) |
| API / BFF | **Hono** + `@hono/zod-openapi` en un único Worker |
| Base de datos | **Cloudflare D1** (única, con prefijos por módulo) |
| Archivos e imágenes | **Cloudflare R2** (keys `<modulo>/...`) + Cloudflare Images / Image Resizing para variantes |
| Caché | Binding Workers KV configurado; no se encontró uso generalizado en las rutas revisadas |
| Eventos | **Cloudflare Queues** y consumidor/DLQ configurados; outbox por módulo según cada implementación |
| Tareas programadas | Cron Trigger cada 5 minutos para los handlers registrados en el Worker |
| Consistencia fuerte | Actualización condicional en D1; Durable Objects no están configurados |
| Rate limiting | Bindings de rate limit para autenticación, checkout y escrituras; no se encontró integración Turnstile |
| Observabilidad | Logs y binding Analytics Engine configurado; la instrumentación de cada métrica debe verificarse por handler |
| Storefront | Rutas HTML SSR integradas al Worker Hono (ver controladores `storefront` y vistas) |
| Panel admin | Dashboard servido por el Worker en `/admin`, con secciones en una página y scripts del cliente; `apps/admin` es un paquete placeholder, no el frontend desplegado |
| Cliente de API | Peticiones desde vistas/JS del Worker; no hay un frontend independiente generado desde OpenAPI desplegado |
| Tests | Vitest, `@cloudflare/vitest-pool-workers` (Miniflare), k6 |
| Despliegue | Cloudflare Workers Builds (push a `main` despliega automáticamente); GitHub Actions ejecuta CI |

| Pasarela de pago | **Wompi** (adaptador de `IPaymentPort`) |
| Email transaccional | **Resend** (adaptador de `IEmailPort`) |
| Notificaciones de pagos | Historial en D1 y consulta HTTP autenticada incremental; el panel de pagos consulta periódicamente |
| Documento de factura | HTML/CSS de impresión almacenado en R2 y servido con acceso autorizado; el Worker no genera un PDF binario (ADR-0013) |

> Wompi y Resend se integran por **HTTP desde el Worker** mediante puertos (`IPaymentPort`, `IEmailPort`) implementados en `infrastructure/` de `payments` y `notifications`. El dominio y la aplicación **no conocen** a ningún proveedor (D de SOLID, §1 y §2); cambiar de proveedor es cambiar un adaptador. Son servicios SaaS externos consumidos por HTTPS, no módulos no-serverless, por lo que la regla de consulta sobre Containers (§0) no se activa.

---

## 4. Arquitectura

```text
 Clientes / Administradores
        │
        ▼
 Storefront y Admin UI (SSR desde el Worker)
        │  REST (/api/*, mismo origen)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  UN SOLO WORKER                                                   │
│                                                                   │
│  BFF (Hono) ── sin lógica de negocio                              │
│     │  Gateways (en proceso hoy → Service Binding si se separa)   │
│     ▼                                                             │
│  identity · catalog · media · inventory · cart · orders ·         │
│  payments · shipping · invoicing · promotions · reviews · │
│  storefront · cms · seo · settings · notifications ·              │
│  realtime · audit                                                 │
│     │                                                             │
│     ▼                                                             │
│  D1 única (prefijos)  ·  R2  ·  KV  ·  Queues (+DLQ)  ·  Cron    │
└───────────────────────────────────────────────────────────────────┘
```

### Cómo se componen las páginas públicas

El BFF **compone**, los módulos **no se conocen entre sí**. Ejemplo, detalle de producto:

```text
GET /api/v1/store/products/:slug
  BFF → CatalogGateway.getProductBySlug()
      → PromotionsGateway.getActiveForProduct()
      → SeoGateway.getForEntity("product", id)
      → StorefrontGateway.getAnnouncements("product")
  BFF une los DTOs y responde como HTML SSR
```

---

## 5. Bounded contexts

Cada carpeta `src/modules/<contexto>` es un "servicio en potencia" con dominio, aplicación, infraestructura, tablas y puertos propios.

| Módulo | Responsabilidad | Tablas principales (D1) |
|---|---|---|
| `identity` | Clientes, administradores, roles/permisos (RBAC), sesiones y direcciones | `identity_customers`, `identity_admins`, `identity_roles`, `identity_sessions`, `identity_addresses`, `identity_outbox_events` |
| `catalog` | Productos, variantes, categorías, marcas, proveedores, atributos, colecciones y búsqueda | `catalog_products`, `catalog_product_variants`, `catalog_categories`, `catalog_brands`, `catalog_suppliers`, `catalog_product_categories`, `catalog_product_images`, `catalog_attributes`, `catalog_product_coverage`, `catalog_collections`, `catalog_collection_products`, `catalog_products_fts`, `catalog_outbox_events` |
| `media` | Biblioteca de archivos en R2, carpetas, metadatos y alt text | `media_assets`, `media_folders`, `media_outbox_events` |
| `inventory` | Stock, movimientos, reservas y consumo idempotente por pedido | `inventory_stocks`, `inventory_movements`, `inventory_reservations`, `inventory_order_consumptions`, `inventory_outbox_events` |
| `cart` | Carritos de invitado y de cliente | `cart_carts`, `cart_items`, `cart_outbox_events` |
| `orders` | Pedidos, líneas, estados, historial, tracking de invitado y modalidad logística | `orders_orders`, `orders_lines`, `orders_history`, `orders_outbox_events` |
| `reviews` | Opiniones de productos, puntuaciones y agregados | `reviews_product_reviews` |
| `payments` | Pagos con Wompi, webhooks, recaudos contra entrega y conciliación de liquidaciones | `payments_transactions`, `payments_webhook_events`, `payments_cod_collections`, `payments_settlement_costs`, `payments_settlement_corrections`, `payments_outbox_events` |
| `shipping` | Entrega local del comercio, catálogo DANE, paquetes, integración MiPaquete, guías y tracking | `shipping_zones`, `shipping_zone_locations`, `shipping_divipola` y tablas `shipping_*` de transportadora/paquetes |
| `invoicing` | Facturas inmutables, secuencias, notas crédito y documento HTML de impresión | `invoicing_invoices`, `invoicing_sequences`, `invoicing_credit_notes`, `invoicing_outbox_events` |
| `realtime` | Notificaciones persistidas y estado de lectura | `realtime_notifications` |
| `promotions` | Reglas promocionales, cupones y canjes | `promotions_rules`, `promotions_coupons`, `promotions_redemptions`, `promotions_outbox_events` |
| `storefront` | Banners y anuncios (ubicación y vigencia) | `storefront_banners`, `storefront_announcements`, `storefront_outbox_events` |
| `cms` | Páginas institucionales versionadas, menús y Blog editorial | `cms_pages`, `cms_page_versions`, `cms_menus`, `cms_menu_items`, `cms_blog_authors`, `cms_blog_categories`, `cms_blog_posts`, `cms_blog_post_categories`, `cms_outbox_events` |
| `seo` | Metadatos por entidad/página y redirecciones 301/302; el Worker genera robots/sitemaps | `seo_metadata`, `seo_redirects`, `seo_outbox_events` |
| `settings` | Perfil, moneda, impuestos, datos fiscales/contacto, redes y copyright | `settings_store`, `settings_outbox_events` |
| `notifications` | Envío transaccional con plantillas en código, log y outbox | `notifications_log`, `notifications_outbox_events` |
| `audit` | Registro inmutable de acciones administrativas | `audit_logs` |

Varios módulos con escrituras de integración mantienen `<modulo>_outbox_events`; verifica la migración del módulo antes de asumirlo.

### Reglas de datos entre módulos (ejemplos concretos)

- `catalog_product_images.media_id` es un `TEXT` sin FK hacia `media_assets`; la URL se resuelve vía `MediaGateway`.
- `orders_lines` guarda un **snapshot** (nombre, SKU, precio) del producto; no depende del catálogo después de la compra.
- El **sitemap** lo mantiene `seo` consumiendo eventos (`catalog.product.published.v1`, `cms.page.published.v1`, …); nunca consulta tablas de `catalog` o `cms`.
- El stock se descuenta con `UPDATE ... WHERE stock >= :qty` dentro del propio módulo `inventory`; si la concurrencia lo exige, se pasa a un Durable Object.

---

## 5.1 Reglas comerciales por producto

Cada producto declara su **política de venta**. Los datos viven en `catalog`; las reglas que los combinan viven en el dominio de `orders` (política de checkout), **no en el BFF** (§9, §20).

| Atributo del producto | Valores | Significado |
|---|---|---|
| `slug` | `string` (único, indexado) | URL / handle autogenerado desde el nombre y editable (`/productos/:slug`) |
| `condition` | `new` / `used` / `refurbished` | Condición física del producto |
| `specifications` | `JSON` | Ficha técnica y atributos específicos como objeto clave-valor |
| `brand` | `string` | Marca o proveedor del producto |
| `product_type` | `string` | Categorización o tipo de producto |
| `tags` | `JSON array` | Etiquetas para filtrado y categorización |
| `barcode_gtin` | `string` | Código de barras estándar (GTIN/EAN) para indexación comercial |
| `seo_title` | `string` (nullable) | Título optimizado para buscadores (~60-70 caracteres). Fallback: nombre del producto |
| `seo_description` | `string` (nullable) | Meta descripción para Google (~155-160 caracteres). Fallback: extracto de la descripción |
| `canonical_url` | `string` (nullable) | URL canónica para evitar contenido duplicado |
| `og_image_id` | `string` (nullable) | Imagen personalizada para Open Graph / Twitter Cards |
| `noindex` | `boolean` (default `false`) | Bandera para ocultar el producto de motores de búsqueda (`robots: noindex, nofollow`) |
| `allows_cash_on_delivery` | `true` / `false` | Si el producto admite pago contra entrega |

### Precio, IVA y costos de pago (ADR-0015)

Los productos creados o editados con costo de proveedor guardan precio final con IVA incluido, costo del proveedor, objetivo de ganancia y medios permitidos. El administrador puede elegir un margen porcentual sobre la venta sin IVA o una ganancia neta fija en COP (por ejemplo, $20.000). El precio recomendado se calcula en servidor después del costo del proveedor, el IVA y las comisiones estimadas; la tarifa Wompi conservadora es 4,09% + $700 + IVA de la comisión, con el cargo fijo contado una vez por transacción y una unidad en el estimador. Un porcentaje que supere el máximo matemático de Wompi se rechaza con un mensaje, sin bloquear el panel. Para un carrito, `orders` recalcula sobre el monto total una sola vez; contra entrega no estima comisión Wompi.

En pagos Wompi, el checkout agrega una sola línea de $700 por costo fijo de transacción y lo aclara al comprador; contra entrega no tiene este cargo. El precio recomendado absorbe la comisión porcentual estimada. El checkout no desglosa otra línea de IVA para los productos con precio final incluido; presenta envío y, para Wompi, el costo fijo explícito. Facturas y snapshots mantienen el IVA desglosado internamente; pedidos/facturas antiguos conservan su desglose e importes originales. Los productos históricos permanecen en `pricing_version=1` hasta que un administrador ingrese su costo y los recalcule; el checkout mantiene su comportamiento anterior para ellos durante la transición. Mercado Pago no se ofrece mientras no exista integración.

La comisión del pedido queda guardada como estimación. En Pagos, un administrador con permiso `payments:edit` puede registrar el importe y la referencia de la liquidación del portal para un pedido aprobado; se muestra la variación frente a la estimación. El webhook no se trata como fuente de comisión real.
| `shipping_scope` | `national` / `local` | Envío a todo el país o solo a zonas concretas |
| `catalog_product_coverage` | lista de `zone_id` (`TEXT`, sin FK) | Zonas válidas cuando el alcance es `local` (ciudad o municipio) |
| `sale_mode` | `cash` / `credit` / `both` | Campo de política de catálogo; no existe todavía gestión de cuotas ni módulo de crédito (ADR-0009 pendiente) |
| Descuento | vía `promotions` | Los productos con descuento se resuelven por `PromotionsGateway`, no por columnas en `catalog` |

Las reglas de promoción automáticas se recalculan desde servidor. Las reglas sin compra mínima pueden mostrarse en tarjetas/detalle y se descuentan también en carrito, checkout y pedido. Las reglas con compra mínima se evalúan sobre el subtotal base del carrito y no se anuncian en una tarjeta aislada. El texto de envío gratis en un banner o barra de anuncios es contenido informativo: no configura una tarifa gratis; la gratuidad del envío requiere una regla logística implementada/configurada por separado.

### Reglas SEO Profesionales (9 Pilares de eCommerce)

1. **Técnico y Core Web Vitals (LCP, CLS, INP)**:
   - **Formato y optimización**: Imágenes servidas en WebP/AVIF con compresión, atributos de ancho/alto para evitar saltos de diseño (CLS) y `loading="lazy"` nativo.
   - **Renderizado 100% Servidor (SSR)**: Todo el contenido crítico (títulos, precios, descripciones, stock y datos estructurados) se entrega directamente en el HTML inicial para garantizar indexabilidad inmediata por Googlebot sin depender del JS del cliente.
   - **Mobile-first y HTTPS estricto**: Enfoque mobile-first responsivo con encabezados HSTS (`max-age=31536000; preload`) y TLS forzado por Cloudflare.
   - **Sitemaps segmentados y Robots**: `sitemap.xml` como índice principal (`sitemapindex`) dividiendo `sitemap-products.xml` y `sitemap-pages.xml` con directivas claras en `robots.txt`.
   - **Canonicals y Paginación limpia**: Canonicals absolutos para evitar contenido duplicado y manejo consistente de 404 útiles con sugerencias de catálogo.

2. **Navegación Facetada y Filtros**:
   - Parámetros de consulta en catálogo (`?q=`, ordenamientos, filtros de color/talla) marcados automáticamente con directiva `noindex, nofollow` y apuntando al `canonical` de la colección/categoría base para evitar canibalización y miles de URLs duplicadas.

3. **Estructura y Enlazado Interno**:
   - Jerarquía clara: `Home → Categoría → Subcategoría → Producto` con profundidad máxima recomendada de ≤ 3 clics desde el Home.
   - Migas de pan (Breadcrumbs) visuales en cada vista de producto acompañadas por su marcado estructurado `schema.org/BreadcrumbList`.
   - Enlazado interno estratégico con recomendaciones de productos y enlaces cruzados de catálogo.

4. **Datos Estructurados Completos (schema.org)**:
   - `Product` & `Offer`: Precio en enteros (centavos COP formateados), disponibilidad (`InStock` / `OutOfStock`), `priceValidUntil`, condición (`NewCondition`, `UsedCondition`, `RefurbishedCondition`), SKU y marca.
   - `BreadcrumbList`: Posición y jerarquía de navegación exacta.
   - `WebSite` & `Organization`: Nombre de la marca, logotipo y `SearchAction` integrado para habilitar el cuadro de búsqueda directa en las SERPs de Google.
   - `ItemList`: Marcado ordenado en colecciones y catálogo principal.

5. **Contenido Único y Optimización On-Page**:
   - Descripciones de producto únicas (prevención de contenido duplicado de mayoristas).
   - Textos de categorías orientados a intención de búsqueda (introductorio y pie descriptivo).
   - Reseñas de clientes para contenido fresco y palabras clave conversacionales (Long-tail SEO).

6. **Casos Particulares de Comercio Electrónico**:
   - **Productos agotados**: Nunca responder 404; se mantienen indexados con estado `OutOfStock`, aviso visible y alternativas de catálogo.
   - **Variantes de producto**: Consolidación mediante URL canónica al producto principal o URLs indexables específicas cuando existe demanda de búsqueda.
   - **Búsqueda interna**: Excluida de la indexación mediante `noindex, nofollow` y directivas en `robots.txt`.

7. **Internacionalización y Localización (hreflang)**:
   - Inyección de etiquetas `<link rel="alternate" hreflang="es-CO" ...>` y `hreflang="x-default"` preparadas para despliegues multidivisa y por país.

8. **Integraciones Externas**:
   - Compatibilidad directa con Google Search Console, Google Merchant Center (feed estructurado), Google Analytics / Cloudflare Web Analytics y Bing Webmaster Tools.

9. **Estrategia Off-Page**:
   - URLs limpias, amigables y canónicas preparadas para backlinking de autoridad en nichos, prensa y perfiles de Google Business Profile.

### Cómo se evalúa en el carrito / checkout

```text
OrdersCheckoutPolicy (dominio de orders), con DTOs obtenidos por Gateways:
  CatalogGateway    → política de cada producto
  ShippingGateway   → ¿la dirección está cubierta? tarifa y disponibilidad del transportista
  PromotionsGateway → descuentos aplicables

Reglas:
  1. Producto local-only y dirección fuera de su cobertura  → no se puede enviar (se marca en el carrito).
  2. Contra entrega local disponible SOLO si TODOS los productos lo permiten
     y la zona local la admite. En destinos nacionales depende de que MiPaquete esté
     configurado, el producto permita recaudo y el transportista devuelva una cotización COD vigente.
  3. Carritos mixtos: se informa qué producto bloquea cada método; no se dividen pedidos sin decisión explícita.
  4. Envío: la entrega local la administra la tienda por zona; los destinos nacionales se cotizan con la transportadora.
```

El módulo de crédito aún no existe; su alcance está pendiente en ADR-0009. Las reglas activas de checkout viven en `orders` y se validan en servidor.

### Cobertura de envío (`shipping`)

- Las zonas `department`, `city` y `municipality` representan entrega local gestionada por el comercio: tarifa, plazo y disponibilidad de contra entrega configurados en Admin. La zona local activa de Medellín y el Valle de Aburrá admite contra entrega. En destinos nacionales, el recaudo contra entrega depende de MiPaquete activo y de una cotización COD vigente; al crear el pedido se vuelve a validar la cotización. En la operación actual, la entrega local está limitada a Medellín y los diez municipios del Valle de Aburrá; Municipios DANE administra únicamente esa cobertura local.
- Los destinos nacionales se cotizan con MiPaquete; su cobertura, tarifas, transportadoras y disponibilidad de recaudo COD se determinan desde sus cotizaciones, no desde la bandera de una zona local. El catálogo local de búsqueda se completa desde `GET /getLocations` de MiPaquete, sin crear reglas de entrega local ni alterar las zonas del comercio. Cada pedido nuevo guarda `merchant_local` o `carrier`; los pedidos previos conservan `legacy`.
- `catalog` y `orders` guardan únicamente el `zone_id` como texto; resuelven nombres y tarifas vía `ShippingGateway` (§6.1).
- MiPaquete usa el secret de Cloudflare `MI_PAQUETE_TRANSPORTADORA` y la variable explícita `MI_PAQUETE_API_URL` (`https://api-v2.mpr.mipaquete.com` en producción). El secreto no se guarda en D1, frontend, logs ni respuestas. La configuración vive en Admin → Envíos y cobertura → Transportadoras, separada de las zonas locales. Empaques tiene su página propia en Admin → Envíos y cobertura → Empaques. Cada producto guarda peso y medidas de su unidad empacada. Para una sola unidad, se cotizan directamente esas dimensiones y su peso, sin agregar una caja. Para dos o más unidades, el servidor busca la caja activa compatible de menor volumen, usa sus medidas externas y suma el peso de todas las unidades más la tara; si ninguna caja activa las contiene, no ofrece tarifa hasta configurar una. MiPaquete recibe el peso redondeado hacia arriba al kilogramo entero. La cotización conserva si se usó empaque individual o una caja configurada y la instantánea del paquete para la guía. Colombia se identifica con código `170` en la solicitud. En envíos nacionales, el comprador puede incluir el flete en el total o pedir que MiPaquete lo cobre al entregar. La segunda opción queda fuera del pedido/factura: para COD, `valueCollection` suma mercancía y flete; si Wompi ya pagó la mercancía, al entregar se recauda solo el flete. `saleValue` identifica la mercancía, sin flete ni tarifa Wompi; `paymentType` define la liquidación entre el comercio y MiPaquete.

- El envío gratis se configura desde Admin → Marketing → Envío gratis como reglas independientes del módulo `shipping`, con alcance a todo el catálogo, un producto, categoría o colección, mínimo, vigencia, prioridad y estado. No existe un beneficio implícito ni un mínimo fijo: el envío gratis solo aplica cuando un administrador crea y activa una regla. El servidor vuelve a evaluarla en checkout y al crear el pedido/cotización. Si aplica, la tienda cubre el flete tanto local como nacional; el pedido conserva la tarifa real del transportista y registra por separado el descuento de envío. No se ofrece cobrar ese flete al cliente al recibir cuando el envío es gratis.

- Una creación ambigua se concilia consultando `getSendings` por rango de fechas acotado y referencia única del pedido. Una coincidencia exacta recupera guía/estado; varias coincidencias, resultados excesivos o una consulta incompleta mantienen `creation_pending`. El cron reintenta la consulta con pausa, nunca el despacho; si la búsqueda completa no encuentra el envío, se conserva el bloqueo porque MiPaquete no documenta una garantía de consistencia que permita asegurar que un segundo despacho no duplicará el primero.

### Pagos con Wompi (`payments`)

- Moneda **COP**; los montos viajan en centavos.
- Flujo: `orders` crea el pedido → `payments` genera la referencia única y la **firma de integridad** → el cliente paga en el checkout de Wompi → Wompi notifica por **webhook** `POST /api/v1/webhooks/wompi`.
- El webhook **verifica la firma/checksum del evento**, es **idempotente** (`payments_webhook_events` guarda el `eventId`) y publica `payments.payment.confirmed.v1` por outbox; nunca se confía en la redirección del navegador para confirmar un pago.
- Estados soportados: aprobado, rechazado, pendiente, anulado y error; una transacción pendiente se reconsulta por Cron.
- Medios de pago (tarjeta, PSE, Nequi, etc.) según lo habilitado en la cuenta Wompi; el dominio solo conoce `PaymentMethod`.
- Llaves (pública, privada, secreto de integridad, secreto de eventos) solo en **Cloudflare Secrets**; ambientes *sandbox* y producción separados.

### Pago contra entrega

- Es un método de pago más de `payments` (`method = cash_on_delivery`), sin pasar por Wompi.
- En una entrega local, el admin solo puede registrar el recaudo después de que el pedido figure como entregado. El panel lista estos pedidos y rellena el importe y la referencia local; el servidor valida el estado y los importes.
- El recaudo cambia `payment_status` de `pending` a `collected` y el pedido queda `delivered`. La factura comercial interna se emite tras el pago Wompi aprobado o tras registrar este recaudo, no al crear un pedido COD pendiente.
- Pedidos contra entrega pueden exigir verificación (teléfono/dirección) antes de pasar a `confirmed`; configurable en `settings`.

### Venta a crédito (pendiente; ADR-0009)

No existe un módulo `credit` ni tablas/API de cuotas en la implementación actual. El alcance comercial y legal debe definirse antes de implementar esta modalidad.

### Notificaciones de pagos (`realtime`)

El módulo conserva notificaciones en D1. La ruta actual `GET /api/v1/realtime/notifications` deriva canal/propietario desde la sesión validada, pagina hasta 30 elementos y acepta el cursor `since`; marcar como leídas vuelve a validar que las notificaciones pertenezcan al actor autorizado. La vista de pagos del admin consulta cada ocho segundos aproximadamente.

La confirmación financiera sigue dependiendo del webhook de Wompi verificado y reconciliado; las notificaciones no reemplazan ese proceso. El Worker actual no declara Durable Objects ni endpoints WebSocket para realtime. La decisión original de ADR-0011 describe una arquitectura futura y no el transporte implementado.

### Facturación (`invoicing`)

Las facturas internas son documentos inmutables emitidos por el módulo `invoicing`. La factura conserva un snapshot del pedido y del emisor disponible al momento de emisión; las correcciones se tramitan mediante nota crédito. El documento actual es HTML/CSS diseñado para impresión y se almacena de forma privada en R2. No se genera un archivo PDF binario desde el Worker y este documento interno no equivale a facturación electrónica DIAN.

El cliente puede consultar sus documentos autenticándose en su cuenta; el admin tiene la pantalla de Facturación. El BFF verifica autorización/propiedad al servir el documento. Los detalles de numeración y snapshot están en ADR-0012 y ADR-0013; no se deben asumir campos o automatismos que no estén en el esquema y los casos de uso actuales.

### Email con Resend (`notifications`)

El envío transaccional usa el puerto `IEmailPort` y el adaptador configurado para Resend. Las plantillas utilizadas se implementan en código; el correo de acceso al seguimiento incluye alternativa de texto plano y un asunto corto. El dominio del remitente debe estar verificado y alineado con el dominio público de la tienda; SPF, DKIM y DMARC se configuran y revisan en Resend/DNS, y no garantizan por sí solos la llegada a la bandeja principal. No hay webhook de eventos de Resend ni editor general de plantillas en el panel actual; comprobar el flujo de correo y el estado del proveedor antes de afirmar entrega en producción.

## 6. Rutas

### 6.1 Tienda pública (SSR del Worker)

| Ruta | Contenido |
|---|---|
| `/` | Home: carrusel, banners, anuncios, destacados, promociones |
| `/productos` | Listado con filtros, orden y paginación |
| `/productos/:slug` | Detalle de producto |
| `/productos/:slug/opiniones` | Valoraciones y opiniones paginadas del producto |
| `/categorias/:slug`, `/marcas`, `/marcas/:slug` | Listados y directorio de categorías/marcas |
| `/colecciones` | Directorio paginado de colecciones publicadas |
| `/colecciones/:slug` | Productos publicados de una colección |
| `/blog` | Artículos públicos paginados con filtro por categoría |
| `/blog/:slug` | Artículo publicado con metadatos SEO, canonical y JSON-LD |
| `/sobre-nosotros`, `/contacto`, `/preguntas-frecuentes` | Páginas informativas editables desde CMS |
| `/politica-de-envios`, `/devoluciones`, `/garantias` | Información de envíos y posventa editable desde CMS |
| `/terminos-y-condiciones`, `/politica-de-privacidad`, `/politica-de-cookies`, `/tratamiento-de-datos` | Páginas legales editables desde CMS |
| `/p/:slug` | Ruta histórica del CMS; se conserva por compatibilidad |
| `/carrito`, `/checkout` | Compra |
| `/seguimiento-pedido` | Clientes con sesión consultan sus pedidos por propiedad; invitados usan número de pedido y clave enviada al correo; estados y datos logísticos administrables desde Envíos en el panel |
| `/auth/login` | Inicio de sesión SSR; las operaciones de registro y autenticación se exponen por API |
| `/cuenta` | Vista de cuenta protegida, con resumen de pedidos y facturas del cliente |
| `/sitemap.xml`, `/sitemap-blog.xml`, `/robots.txt` | Generados dinámicamente |
| URL desconocida | Página 404 útil con navegación a la tienda; no es un catálogo de rutas CMS |

### 6.2 Panel de administración

El panel actual se sirve desde `/admin` como una aplicación de dashboard con navegación lateral y secciones seleccionadas en la misma pantalla; no se deben interpretar las etiquetas del menú como rutas URL independientes. Incluye Resumen, Pedidos, Inventario, Envíos y cobertura, Municipios DANE, Transportadoras, Empaques, Seguimiento de pedidos, Imprimir guías (guías oficiales de MiPaquete y etiquetas internas para entrega local), Pagos y facturas, Catálogo (Productos, Colecciones, Categorías, Marcas, Proveedores, Atributos, Variantes, Reseñas), Marketing (Banners, Anuncios, Reglas, Cupones y Envío gratis), CMS (Páginas CMS, Menús, Blog), Auditoría y Configuración. El acceso requiere autenticación administrativa y permisos RBAC según operación.

### Dominio público de producción

La tienda y API se publican en `https://vega.jnmtortas.com`, configurado como Custom Domain del Worker. El despliegue deshabilita `workers.dev` y las URLs de preview; los enlaces canónicos, sitemap y enlaces de seguimiento usan el dominio de producción.

### 6.3 API del Worker (rutas principales)

| Ruta | Acceso | Uso |
|---|---|---|
| `/api/v1/auth/*` | Público + rate limit | Registro y autenticación de clientes. |
| `/api/v1/customer/orders`, `/api/v1/customer/invoices` | Cliente autenticado | Consultar pedidos/facturas propios. |
| `/api/v1/cart/*`, `/api/v1/orders` | Invitado o cliente según operación | Carrito y creación de pedido. |
| `/api/v1/admin/*` | Admin autenticado + permiso RBAC | Operaciones administrativas de módulos. |
| `/api/v1/realtime/notifications*` | Sesión admin o cliente autenticada | Lectura incremental y marcado como leído. |
| `/api/v1/invoices/:id/document` | Propietario/admin autorizado | Servir documento HTML con control de acceso. |
| `/api/v1/webhooks/wompi` | Firma/checksum verificado | Eventos de transacciones de Wompi. |
| `/health` | Público/operativo | Salud del Worker y bindings que revisa el controlador. |

Las rutas API son contratos implementados, no una promesa de CRUD uniforme. Consultar controladores BFF y OpenAPI para los métodos concretos, permisos, filtros y paginación de cada recurso.

---

## 7. Seguridad

El detalle normativo (IDs `SEC-*`, modelo de amenaza, checklist de PR y matriz de certificación) está en [`SECURITY_RULES.md`](./SECURITY_RULES.md). Resumen:

- **Contraseñas:** PBKDF2 (Web Crypto) con sal por usuario y parámetros versionados; migrable a otro algoritmo sin romper sesiones.
- **Sesiones:** token opaco aleatorio (32 bytes) cuyo **hash SHA-256** se guarda en `identity_sessions`; cookies `__Host-session` (clientes) y `__Host-admin-session` (admin), `HttpOnly; Secure; SameSite=Lax; Path=/`, sin `Domain`. Expiración absoluta e inactividad (más estrictas para admin), rotación al login y revocación en el servidor.
- **Administradores:** MFA (TOTP) obligatoria antes del lanzamiento, re-autenticación en acciones críticas, auditoría de toda mutación.
- **RBAC:** permisos por recurso y acción (`products:write`, `promotions:publish`…), verificados en el BFF vía `IdentityGateway`; la autorización de negocio vive en el módulo.
- **Protección:** rate limiting configurado, validaciones en controladores, CSP/cabeceras y verificación de firma del webhook de Wompi. Turnstile no está configurado; ver controles normativos y pendientes en `SECURITY_RULES.md`.
- **Datos:** secretos solo en Cloudflare Secrets, PII fuera de logs, subidas a R2 con validación de tipo/tamaño y URLs firmadas para operaciones privadas.
- **Carga de imágenes:** 10 MiB máximo, 16.384 px por lado y 40 MP; formatos JPEG, PNG, WebP y AVIF. El Worker valida firmas, estructura disponible, dimensiones, CRC de chunks PNG y tamaño remoto con `R2.head()` antes de persistir D1. La decodificación completa de píxeles y la eliminación EXIF/GPS siguen pendientes.
- **Admin:** opcionalmente detrás de **Cloudflare Access** como capa adicional.

---

## 8. SEO en el código actual

El Worker renderiza HTML SSR. No existe un panel general de SEO para todas las entidades.

- Producto: metadatos de catálogo, canonical/noindex, JSON-LD `Product`/`Offer`, BreadcrumbList y AggregateRating cuando el resumen elegible contiene reseñas.
- Blog: canonical/noindex, Open Graph, JSON-LD `BlogPosting` y sitemap específico.
- Sitemaps: índice `/sitemap.xml`, páginas estáticas/colecciones, productos y Blog. `robots.txt` es una respuesta estática que apunta al índice; no se edita desde Configuración.
- Las búsquedas y páginas inexistentes emiten noindex donde corresponde. Listados y detalles configuran canonicals en SSR.
- El layout emite `hreflang="es-CO"` y `x-default` con la misma URL canonical; esto no es una configuración multirregional.
- JSON-LD no garantiza resultados enriquecidos en Google. Ver limitaciones y pendientes en [`docs/SEO_ARCHITECTURE.md`](./docs/SEO_ARCHITECTURE.md).

---

## 9. Caché

El binding `CACHE` de Workers KV existe en la configuración de Wrangler, pero no se encontró un uso generalizado de KV o Cache API en los controladores revisados. No se debe asumir que respuestas públicas estén cacheadas ni que haya invalidación por eventos hasta que un handler lo implemente explícitamente.

---

## 10. Eventos de integración (v1)

Contrato común: `eventId`, `eventType`, `eventVersion`, `occurredAt`, `producerModule`, `payload`, `traceId`.

| Evento | Productor | Consumidores típicos |
|---|---|---|
| `identity.customer.registered.v1` | identity | notifications |
| `catalog.product.published.v1` / `.updated.v1` / `.archived.v1` | catalog | seo (sitemap), caché, audit |
| `storefront.content.changed.v1` | storefront | caché |
| `cms.page.published.v1` | cms | seo, caché |
| `promotions.promotion.changed.v1` | promotions | caché |
| `inventory.stock.low.v1` | inventory | notifications |
| `orders.order.placed.v1` | orders | inventory, notifications, audit |
| `payments.payment.confirmed.v1` / `.failed.v1` | payments | orders, invoicing, realtime, notifications, audit |
| `payments.cod.collected.v1` | payments | orders, invoicing, realtime, audit |
| `invoicing.invoice.issued.v1` | invoicing | notifications (email), realtime, audit |
| `invoicing.credit_note.issued.v1` | invoicing | notifications, realtime, audit |
| `shipping.zone.changed.v1` | shipping | caché |

Consumidores idempotentes, `message.ack()` solo tras persistir, `retry({ delaySeconds })` en fallos recuperables y DLQ configurada.

---

## 11. Estructura del repositorio

```text
.
├─ ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md
├─ AGENTS.md                  # punto de entrada para agentes: qué leer antes de implementar
├─ CLAUDE.md                  # importa AGENTS.md (Claude Code)
├─ README.md
├─ ROADMAP.md
├─ SECURITY_RULES.md          # reglas SEC-* (obligatorias)
├─ ROLLBACK_RECOVERY.md       # release, rollback y reconciliación
├─ docs/
│  ├─ adr/                    # ADR-0001 (Worker + D1 únicos), ADR-0002..., 
│  ├─ PROJECT_RULES.md        # decisiones concretas (sección 22 del contrato)
│  └─ migrations/manifest.md  # registro de migraciones por módulo y entorno
├─ apps/
│  ├─ api/                    # EL Worker único
│  │  ├─ wrangler.jsonc
│  │  ├─ scripts/             # build de migraciones por módulo, lint de aislamiento
│  │  └─ src/
│  │     ├─ bff/              # controllers, dto, gateways, middleware, server.ts
│  │     ├─ modules/
│  │     │  └─ <contexto>/    # domain · application · infrastructure
│  │     │                    # module.config.ts · module.public-api.ts
│  │     ├─ shared-kernel/    # Result, UUID, IClock, errores base
│  │     ├─ platform/         # logger JSON, telemetría, manejo de errores
│  │     ├─ composition-root.ts
│  │     └─ index.ts          # fetch · queue · scheduled
│  ├─ storefront/             # paquete del storefront; las vistas SSR actuales viven en el Worker
│  └─ admin/                  # paquete placeholder; la UI efectiva vive en views/admin del Worker
├─ tests/
│  ├─ e2e/
│  └─ load/                   # k6
└─ .github/workflows/         # CI: lint, tipos, tests, aislamiento de tablas, deploy
```

Las migraciones viven en cada módulo (`infrastructure/persistence/d1/migrations/0001_init.sql`) y un script las copia al `migrations_dir` de Wrangler como `<modulo>__0001_init.sql`.

---

## 12. Bindings, Variables de Entorno y Secretos de Cloudflare (`apps/api/wrangler.jsonc`)

### 12.1 Bindings de infraestructura (`apps/api/wrangler.jsonc`)

| Binding/configuración | Recurso configurado | Nota de uso |
|---|---|---|
| `DB` | D1 `ecommerce-vega-production` | Base de datos única con prefijos por módulo. |
| `MEDIA_BUCKET` | R2 `ecommerce-vega-production` | Objetos de media y documentos. |
| `CACHE` | KV (ID en Wrangler) | Binding configurado; verificar uso antes de atribuirle caché de un recurso concreto. |
| `EVENTS_QUEUE` | Queue `ecommerce-vega-events-production` | Consumidor configurado con DLQ `ecommerce-vega-events-dlq-production`; DLQ no es un binding independiente. |
| `ANALYTICS` | Dataset `ecommerce_vega_analytics_production` | Binding configurado; ver instrumentación antes de asumir métricas específicas. |
| `IMAGES` | Cloudflare Images | Binding para operaciones de medios. |
| `AUTH_LIMITER`, `CHECKOUT_LIMITER`, `API_WRITE_LIMITER` | Rate limiting bindings | Límites configurados en Wrangler. |
| Cron | `*/5 * * * *` | Ejecuta los handlers programados del Worker. |

La configuración versionada apunta al entorno de producción. No hay entorno de staging aislado documentado como operativo.

### 12.2 Variables de Entorno Públicas / Configurables (`vars` en `wrangler.jsonc`)

Estas variables no son sensibles y pueden definirse en el archivo `apps/api/wrangler.jsonc` o directamente en el panel de Cloudflare (Workers & Pages > Settings > Variables and Secrets):

| Variable | Tipo | Valor / Ejemplo | Propósito |
|---|---|---|---|
| `ENVIRONMENT` | String | `production` | Valor versionado actualmente en Wrangler. |
| `ADMIN_EMAIL` | String | `admin@tudominio.com` | Correo de inicio de sesión del único Superadmin activo. No es un canal de entrega para TOTP. |
| `RESEND_FROM_EMAIL` | String | Remitente configurado en `wrangler.jsonc` | Remitente del adaptador Resend; validar que el dominio esté verificado en el entorno. |
| `WOMPI_PUBLIC_KEY` | String | Se configura por entorno | Llave pública que utiliza el checkout de Wompi. |

### 12.3 Secretos Encriptados (`wrangler secret put` o Dashboard de Cloudflare)

> [!CAUTION]
> **NUNCA** subas estas claves al repositorio ni las incluyas en texto plano en archivos `json` o `ts`. Se configuran exclusivamente con `wrangler secret put <NOMBRE>` o en el panel de Cloudflare en la sección de secretos encriptados.

| Secreto | Proveedor / Servicio | Cómo obtenerlo | Propósito |
|---|---|---|---|
| `RESEND_API_KEY` | [Resend](https://resend.com) | Panel de Resend > API Keys (`re_...`) | Autenticación en el adaptador de correo transaccional. |
| `ADMIN_PASSWORD` | Cloudflare Workers | Workers & Pages > Settings > Variables and Secrets > Add secret | Contraseña de inicio de sesión del Superadmin configurado por `ADMIN_EMAIL`. Configurar como secret; nunca enviarla por correo ni guardarla en el repositorio. |
| `WOMPI_PRIVATE_KEY` | [Wompi Colombia](https://wompi.co) | Panel Comercios Wompi > Desarrolladores (`prv_prod_...` o `prv_test_...`) | Reconciliación de transacciones en servidor y consultas directas a la API de Wompi. |
| `WOMPI_INTEGRITY_SECRET` | [Wompi Colombia](https://wompi.co) | Panel Comercios Wompi > Desarrolladores (`prod_integrity_...` o `test_integrity_...`) | Cálculo del hash SHA-256 de integridad para validar pagos. |
| `WOMPI_EVENTS_SECRET` | [Wompi Colombia](https://wompi.co) | Panel Comercios Wompi > Desarrolladores (`prod_events_...` o `test_events_...`) | Validación SHA-256 del checksum Wompi (`properties` + `timestamp` + secreto), no HMAC. |

Cuando existen ambos valores, el login del Worker los valida y los sincroniza con la única cuenta Superadmin activa de `identity`; así se conserva el `adminId`, el rol y el estado MFA, y la base solo conserva el hash PBKDF2 de la contraseña. Si aún no existen ambos valores, se mantiene temporalmente el login D1 para evitar bloquear el acceso durante la configuración. El titular debe configurar ambos antes de usar las credenciales nuevas. El enrolamiento MFA muestra un secreto/URI TOTP después de reautenticar la contraseña; el código se genera en la app autenticadora y **no se envía por email**.

En producción, define `ADMIN_EMAIL` como variable de texto en **Workers & Pages > ecommerce-basic-cloudflare > Settings > Variables and Secrets**. El correo real no se guarda en Git. Añade `ADMIN_PASSWORD` como secret desde el mismo panel o con el comando interactivo de abajo. No compartas la contraseña por chat ni la incluyas en archivos versionados.

#### Comandos para configurar los secretos en producción:
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put WOMPI_PRIVATE_KEY
npx wrangler secret put WOMPI_INTEGRITY_SECRET
npx wrangler secret put WOMPI_EVENTS_SECRET
pnpm exec wrangler secret put ADMIN_PASSWORD --config wrangler.jsonc
```

---

## 13. Desarrollo local (comandos previstos)

```bash
pnpm install
pnpm db:migrate:local          # copia migraciones por módulo y aplica a D1 local
pnpm dev:api                   # wrangler dev (Worker + bindings locales)
pnpm dev:storefront
pnpm dev:admin
pnpm test                      # pruebas unitarias
pnpm test:workers              # integración Worker + D1 local/Miniflare
pnpm db:test-wrangler-migrations # migración desde D1 Wrangler vacía + segunda pasada
pnpm db:migrate:remote         # requiere ALLOW_REMOTE_D1_MIGRATIONS=1; revisar antes de aplicar
pnpm test:isolation            # aislamiento de tablas entre módulos
pnpm lint && pnpm typecheck
```

Los límites de abuso se configuran con los bindings `AUTH_LIMITER`, `CHECKOUT_LIMITER` y `WRITE_LIMITER` en `apps/api/wrangler.jsonc`. Rate Limiting de Workers es aproximado y regional, no debe usarse como control contable. Antes de desplegar, confirme que los identificadores de namespace de esos bindings sean únicos en la cuenta Cloudflare destino.

---

## 14. Calidad y Definition of Done

Una funcionalidad está terminada solo si cumple la lista de la sección 19 del contrato, entre otras:

- [ ] Contexto delimitado en `src/modules/<contexto>`, sin imports cruzados.
- [ ] Dominio puro, sin tipos de Cloudflare.
- [ ] Ningún archivo supera 200 líneas.
- [ ] Tablas con prefijo propio, sin FKs/JOINs hacia otros prefijos y test de aislamiento en verde.
- [ ] Migraciones versionadas por módulo.
- [ ] `module.public-api.ts` con DTOs planos serializables.
- [ ] Gateways cableados solo en `composition-root.ts`.
- [ ] Queues con ack manual y DLQ.
- [ ] Endpoints documentados con Zod/OpenAPI.
- [ ] Tests unitarios, de integración y de contrato en verde.
- [ ] Logs JSON con `trace_id`.

Además, para este proyecto:

- Cada módulo con CRUD admin tiene permisos RBAC definidos, registro en `audit` y metadatos SEO cuando la entidad tenga URL pública.
- Cumple el **checklist de PR de [`SECURITY_RULES.md`](./SECURITY_RULES.md)**, incluida al menos una prueba de acceso cruzado entre clientes.
- Es **compatible con rollback** según [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md) (migraciones expand/contract, eventos versionados, caché con clave versionada).

---

## 15. Decisiones abiertas y límites conocidos

Las decisiones ya aceptadas están en [`docs/adr/`](./docs/adr/); no se vuelven a presentar aquí como propuestas pendientes.

| Tema | Estado actual |
|---|---|
| Venta a crédito (ADR-0009) | El alcance comercial, financiero y legal sigue pendiente de confirmación antes de habilitar ventas a crédito. |
| MiPaquete: creación ambigua sin coincidencia en consulta | El sistema mantiene bloqueado el segundo despacho automático para prevenir duplicados. Se requiere conciliación operativa o aclaración contractual del proveedor. |
| Medidas de empaque | Los datos iniciales son estimaciones; deben reemplazarse por mediciones de los productos y cajas reales antes de tomar sus costos como definitivos. |
| Release y seguridad | La existencia de funcionalidad o una migración aplicada no equivale a certificación completa. Revisar la evidencia por entorno y el checklist vigente antes de afirmar un estado certificado. |

---

## 16. Documentos relacionados

- [`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md): **contrato de arquitectura, de lectura obligatoria y con prioridad sobre este documento.**
- [`SECURITY_RULES.md`](./SECURITY_RULES.md): reglas de seguridad `SEC-*`, checklist de PR y matriz de certificación (estado: PENDIENTE).
- [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md): estrategia de release, rollback de Worker, D1, R2, Queues, caché y reconciliación de pagos (estado: PENDIENTE).
- [`ROADMAP.md`](./ROADMAP.md): fases, entregables y criterios de salida (cada fase indica las secciones del contrato y las reglas de seguridad/recuperación que aplican).
- `docs/PROJECT_RULES.md` (se crea en la Fase 0): nombres reales de Worker, D1, Queues, buckets y contextos.

## Operación de seguridad: MFA y medios

- Tras el despliegue, el admin existente inicia sesión con su contraseña y es redirigido a `/admin/mfa-setup`. Debe reingresar la contraseña, importar el URI/secreto TOTP en su autenticador, guardar una copia del secreto en un gestor seguro y confirmar un código de seis dígitos. Hasta completar esa confirmación, la sesión solo puede realizar el enrolamiento.
- En logins siguientes, ingresar el código TOTP en el formulario. Las sesiones administrativas sin MFA no pueden consultar ni mutar recursos protegidos.
- Las imágenes de entrada aceptadas (JPEG, PNG, WebP y AVIF, hasta 10 MiB, 16.384 px por lado y 40 MP) se decodifican por completo y se convierten a WebP antes de guardarse en R2. La recodificación descarta EXIF/GPS. El Worker requiere el binding `IMAGES` declarado en los dos `wrangler.jsonc`; el procesamiento de salida usa Cloudflare Images y sus transformaciones únicas son facturables según el plan de Cloudflare.
- El cron revisa diariamente hasta 1.000 claves de `media/` y solo borra las mayores de siete días sin fila referencial en `media_assets`. Excluye medios privados y documentos. No se ejecuta una limpieza de producción manual como parte del despliegue.
