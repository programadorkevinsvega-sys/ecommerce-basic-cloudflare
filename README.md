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
- Las notificaciones en tiempo real se emiten **solo tras un pago verificado**; las salas las decide el servidor según la sesión, nunca el cliente.
- Prohibido emitir, editar o borrar facturas desde el frontend o con datos del cliente; una factura emitida es inmutable y se corrige con nota crédito. La numeración es consecutiva, atómica e idempotente.
- Prohibido registrar secretos, datos de tarjeta o PII en logs, y guardarlos en el repositorio.
- No marcar como "probado", "certificado" o "COMPLETE" nada que no tenga evidencia reproducible (tests o verificación documentada). Los estados de seguridad y rollback están **PENDIENTES** hasta entonces.
- Si una petición contradice una regla, **señalarlo antes de generar código** y, si hace falta una excepción, documentarla en un ADR/PR.
- Ante duda entre dos documentos, gana el de mayor prioridad de la tabla.

---

## 1. Alcance funcional

| Requerimiento | Módulo responsable | Admin | Tienda pública |
|---|---|:---:|:---:|
| Panel y rutas de administración de todo el ecommerce | `identity` + todos | ✅ | — |
| Login y registro de clientes | `identity` | — | ✅ |
| Home | `storefront` + `catalog` + `cms` | — | ✅ |
| Listado de productos, filtros, búsqueda | `catalog` | ✅ CRUD | ✅ |
| Detalle de producto | `catalog` + `seo` + `promotions` + `reviews` | ✅ CRUD | ✅ |
| Reseñas y valoraciones | `reviews` + `orders` | ✅ Moderación, edición y reseñas editoriales; el método de pago se consulta solo para compras entregadas y pagadas | ✅ Compradores verificados y opiniones editoriales identificadas como tales |
| Carrusel y su gestión | `storefront` | ✅ CRUD | ✅ |
| Gestión de banners | `storefront` | ✅ CRUD | ✅ |
| Anuncios (home, clientes, productos) | `storefront` | ✅ CRUD | ✅ |
| Gestión de promociones y cupones | `promotions` | ✅ CRUD | ✅ |
| CMS (páginas, bloques, menús) y Blog (artículos, autores, categorías) | `cms` | ✅ CRUD en pantallas separadas | ✅ SSR público |
| SEO completo por página | `seo` | ✅ CRUD | ✅ |
| Biblioteca de medios | `media` | ✅ CRUD | — |
| Carrito, checkout, pedidos | `cart`, `orders`, `inventory` | ✅ | ✅ |
| Pagos en línea con **Wompi** | `payments` | ✅ | ✅ |
| **Notificaciones en tiempo real** al recibir un pago, con todos los detalles | `realtime` | ✅ | ✅ (solo su pago) |
| **Facturas** generadas y almacenadas con todos los detalles | `invoicing` | ✅ | ✅ (solo las suyas) |
| **Pago contra entrega** configurable por producto | `catalog` + `orders` + `payments` | ✅ | ✅ |
| **Envío nacional o solo local** (ciudad / municipio) por producto | `catalog` + `shipping` | ✅ | ✅ |
| Productos **con descuento** y productos **a crédito** | `promotions`, `credit`, `catalog` | ✅ | ✅ |
| Cuenta del cliente (pedidos, direcciones) | `identity`, `orders` | — | ✅ |
| Configuración de la tienda | `settings` | ✅ | — |
| Auditoría de acciones | `audit` | ✅ lectura | — |
| Notificaciones por email con **Resend** | `notifications` | ✅ plantillas | — |

**CRUD completo** (crear, leer, actualizar, eliminar/archivar) para toda entidad administrable. El borrado es lógico (`deleted_at`) salvo en datos sin valor histórico.

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
| Caché | **Workers KV** (con TTL) + **Cache API** para respuestas HTTP públicas |
| Eventos | **Cloudflare Queues** + DLQ, outbox por módulo |
| Tareas programadas | **Cron Triggers** (outbox relay, publicación programada, limpieza) |
| Consistencia fuerte (si hace falta) | **Durable Objects** (reservas de stock bajo alta concurrencia) |
| Rate limiting / bots | Rate Limiting binding + **Turnstile** en login/registro |
| Observabilidad | Logs JSON, **Workers Analytics Engine**, OpenTelemetry OTLP |
| Frontend tienda | **Cloudflare Pages** con SSR (propuesta: Astro + islas React) |
| Frontend admin | **Cloudflare Pages** SPA (propuesta: React + Vite + TanStack Query) |
| Cliente de API | Generado desde OpenAPI (los frontends no comparten código con el backend) |
| Tests | Vitest, `@cloudflare/vitest-pool-workers` (Miniflare), k6 |
| Despliegue | Cloudflare Workers Builds (push a `main` despliega automáticamente); GitHub Actions ejecuta CI |

| Pasarela de pago | **Wompi** (adaptador de `IPaymentPort`) |
| Email transaccional | **Resend** (adaptador de `IEmailPort`) |
| Tiempo real | **Durable Objects** con WebSockets (Hibernation API); el historial persiste en D1 |
| PDF de facturas | Generación dentro del Worker con una librería JS pura, detrás de `IInvoicePdfPort` (ADR-0013) |

> Wompi y Resend se integran por **HTTP desde el Worker** mediante puertos (`IPaymentPort`, `IEmailPort`) implementados en `infrastructure/` de `payments` y `notifications`. El dominio y la aplicación **no conocen** a ningún proveedor (D de SOLID, §1 y §2); cambiar de proveedor es cambiar un adaptador. Son servicios SaaS externos consumidos por HTTPS, no módulos no-serverless, por lo que la regla de consulta sobre Containers (§0) no se activa.

---

## 4. Arquitectura

```text
 Clientes / Administradores
        │
        ▼
 Cloudflare Pages
   ├─ storefront (SSR, SEO)        dominio.com
   └─ admin (SPA)                  admin.dominio.com   (opcional: Cloudflare Access)
        │  REST  (/api/* en cada host → mismo origen, sin CORS)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  UN SOLO WORKER                                                   │
│                                                                   │
│  BFF (Hono) ── sin lógica de negocio                              │
│     │  Gateways (en proceso hoy → Service Binding si se separa)   │
│     ▼                                                             │
│  identity · catalog · media · inventory · cart · orders ·         │
│  payments · shipping · credit · invoicing · promotions · reviews · │
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
  BFF une los DTOs y responde (cacheable en Cache API/KV)
```

---

## 5. Bounded contexts

Cada carpeta `src/modules/<contexto>` es un "servicio en potencia" con dominio, aplicación, infraestructura, tablas y puertos propios.

| Módulo | Responsabilidad | Tablas principales (D1) |
|---|---|---|
| `identity` | Clientes, administradores, roles/permisos (RBAC), sesiones, recuperación de contraseña, direcciones | `identity_customers`, `identity_admins`, `identity_roles`, `identity_role_permissions`, `identity_sessions`, `identity_password_resets`, `identity_addresses` |
| `catalog` | Productos, variantes, categorías, marcas, proveedores, atributos, búsqueda | `catalog_products`, `catalog_product_variants`, `catalog_categories`, `catalog_brands`, `catalog_suppliers`, `catalog_product_categories`, `catalog_product_images`, `catalog_attributes`, `catalog_product_coverage`, `catalog_products_fts` |
| `media` | Biblioteca de archivos en R2, carpetas, metadatos y alt text | `media_assets`, `media_folders` |
| `inventory` | Stock, movimientos, reservas | `inventory_stock`, `inventory_movements`, `inventory_reservations` |
| `cart` | Carritos de invitado y de cliente | `cart_carts`, `cart_items` |
| `orders` | Pedidos, estados, historial | `orders_orders`, `orders_lines`, `orders_history`, `orders_outbox_events` |
| `reviews` | Opiniones de productos, puntuaciones y agregados | `reviews_product_reviews` |
| `payments` | Pagos con Wompi y contra entrega, webhooks idempotentes, recaudos | `payments_transactions`, `payments_webhook_events`, `payments_cod_collections`, `payments_outbox_events` |
| `shipping` | Zonas de cobertura (nacional, ciudad, municipio), tarifas, reglas de contra entrega por zona | `shipping_zones`, `shipping_coverage`, `shipping_rates` |
| `credit` | Venta a crédito: planes, cuentas, cuotas y abonos *(alcance por confirmar, ADR-0009)* | `credit_plans`, `credit_accounts`, `credit_installments`, `credit_payments` |
| `invoicing` | Facturas: numeración, emisión, líneas, impuestos, notas crédito, PDF y snapshot inmutable | `invoicing_invoices`, `invoicing_invoice_lines`, `invoicing_invoice_taxes`, `invoicing_sequences`, `invoicing_credit_notes`, `invoicing_outbox_events` |
| `realtime` | Notificaciones en vivo (admin y cliente), historial y estado de lectura | `realtime_notifications`, `realtime_notification_reads` |
| `promotions` | Promociones, reglas, cupones, canjes | `promotions_promotions`, `promotions_rules`, `promotions_coupons`, `promotions_redemptions` |
| `storefront` | Carruseles, slides, banners, anuncios (ubicación, vigencia, audiencia) | `storefront_carousels`, `storefront_slides`, `storefront_banners`, `storefront_announcements` |
| `cms` | Páginas, bloques, versiones, menús | `cms_pages`, `cms_page_versions`, `cms_blocks`, `cms_menus`, `cms_menu_items` |
| `seo` | Metadatos por entidad/página, redirecciones 301/302, sitemap, robots | `seo_metadata`, `seo_redirects`, `seo_sitemap_entries` |
| `settings` | Datos de la tienda, moneda, impuestos, envíos, redes, scripts | `settings_store` |
| `notifications` | Plantillas y envío de emails transaccionales | `notifications_templates`, `notifications_log` |
| `audit` | Registro inmutable de acciones administrativas | `audit_logs` |

Cada módulo con escrituras relevantes incluye también `<modulo>_outbox_events`.

### Reglas de datos entre módulos (ejemplos concretos)

- `catalog_product_images.media_id` es un `TEXT` sin FK hacia `media_assets`; la URL se resuelve vía `MediaGateway`.
- `orders_items` guarda un **snapshot** (nombre, SKU, precio) del producto; no depende del catálogo después de la compra.
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
| `sale_mode` | `cash` / `credit` / `both` | Venta de contado, a crédito o ambas *(ADR-0009)* |
| Descuento | vía `promotions` | Los productos con descuento se resuelven por `PromotionsGateway`, no por columnas en `catalog` |

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
  ShippingGateway   → ¿la dirección está cubierta? tarifa, ¿la zona admite contra entrega?
  PromotionsGateway → descuentos aplicables
  CreditGateway     → ¿el cliente puede comprar a crédito? planes disponibles

Reglas:
  1. Producto local-only y dirección fuera de su cobertura  → no se puede enviar (se marca en el carrito).
  2. Contra entrega disponible SOLO si TODOS los productos del carrito lo permiten
     y la zona de destino admite contra entrega.
  3. Crédito disponible SOLO si todos los productos admiten crédito y el cliente es elegible.
  4. Carritos mixtos: se informa qué producto bloquea cada método; no se dividen pedidos sin decisión explícita.
  5. Envío: la tarifa se calcula por zona; si hay productos nacionales y locales se calcula por envío.
```

Las reglas 2–5 son la propuesta inicial; se confirman en ADR-0010.

### Cobertura de envío (`shipping`)

- Zonas de tipo `national`, `department`, `city` y `municipality`, basadas en el catálogo oficial de divisiones político-administrativas (códigos DANE/DIVIPOLA) cargado como *seed* del módulo.
- Cada zona define tarifas, plazo estimado y si **admite contra entrega**.
- `catalog` y `orders` guardan únicamente el `zone_id` como texto; resuelven nombres y tarifas vía `ShippingGateway` (§6.1).
- La integración MiPaquete usa el secret de Cloudflare `MI_PAQUETE_TRANSPORTADORA` y la variable explícita `MI_PAQUETE_API_URL` (`https://api-v2.mpr.mipaquete.com` en producción). No se guarda el secreto en D1, frontend, logs ni respuestas. Su configuración está en Admin → Envíos y cobertura → Transportadoras, separada de zonas y municipios para permitir que cada proveedor futuro tenga sus propios ajustes. La gestión de cajas y sobres tiene su página independiente en Admin → Envíos y cobertura → Empaques; incluye operaciones para ver, crear, editar, activar/desactivar y eliminar, medidas internas/externas, tara y peso máximo. Cada producto conserva dimensiones y peso de su unidad empacada. Las migraciones `catalog__0012_initial_shipping_package_estimates.sql` y `shipping__0004_enable_initial_carrier_profiles.sql` sembraron medidas y cajas iniciales estimadas para ocho SKU y tres perfiles. Sustituye esas estimaciones por medidas físicas antes de depender de tarifas finales. En cada cotización, el servidor acomoda las unidades en la caja activa más pequeña que admite el pedido, incluye la tara y guarda esa instantánea para que la guía use el mismo paquete. Colombia se identifica con código `170` en la solicitud a MiPaquete. El comprador puede incluir el flete en el total del pedido o pedir que MiPaquete lo cobre al entregar. En el segundo caso el pedido/factura no lo suma: para COD, `valueCollection` suma mercancía y flete; si Wompi ya pagó la mercancía, el recaudo en entrega corresponde solo al flete. `saleValue` identifica la mercancía, sin flete ni tarifa Wompi. La preferencia del comprador es independiente de `paymentType`, que define la liquidación del comercio con MiPaquete.

### Pagos con Wompi (`payments`)

- Moneda **COP**; los montos viajan en centavos.
- Flujo: `orders` crea el pedido → `payments` genera la referencia única y la **firma de integridad** → el cliente paga en el checkout de Wompi → Wompi notifica por **webhook** `POST /api/v1/webhooks/wompi`.
- El webhook **verifica la firma/checksum del evento**, es **idempotente** (`payments_webhook_events` guarda el `eventId`) y publica `payments.payment.confirmed.v1` por outbox; nunca se confía en la redirección del navegador para confirmar un pago.
- Estados soportados: aprobado, rechazado, pendiente, anulado y error; una transacción pendiente se reconsulta por Cron.
- Medios de pago (tarjeta, PSE, Nequi, etc.) según lo habilitado en la cuenta Wompi; el dominio solo conoce `PaymentMethod`.
- Llaves (pública, privada, secreto de integridad, secreto de eventos) solo en **Cloudflare Secrets**; ambientes *sandbox* y producción separados.

### Pago contra entrega

- Es un método de pago más de `payments` (`method = cash_on_delivery`), sin pasar por Wompi.
- Estados del pedido: `placed → confirmed → shipped → delivered → cash_collected`; el admin (o repartidor) registra el recaudo en `payments_cod_collections`.
- Pedidos contra entrega pueden exigir verificación (teléfono/dirección) antes de pasar a `confirmed`; configurable en `settings`.

### Venta a crédito (`credit`)

- Interpretado como **venta con financiación propia en cuotas**: plan (número de cuotas, interés, frecuencia), cuenta del cliente, calendario de cuotas y abonos.
- Cada abono en línea se paga con **Wompi** como un pago independiente que referencia la cuota (`installment_id` como `TEXT`).
- Recordatorios de cuotas por Cron + **Resend**.
- **Pendiente de confirmar** el alcance exacto (ver sección 15, ADR-0009).

### Notificaciones en tiempo real de pagos (`realtime`)

Cuando se recibe un pago, el frontend lo ve **al instante y con todos los detalles**, sin recargar la página.

- **Transporte:** WebSockets sobre **Durable Objects** (Hibernation API) en el mismo Worker. Es un primitivo nativo de Cloudflare permitido por el contrato (§0.2, §4.4); **no usa Containers**. Si el socket cae, el frontend se reconecta con *backoff* y recupera lo perdido por HTTP (`?since=<notificationId>`).
- **Quién recibe qué:** el panel admin recibe todos los pagos (sala `admin:payments`); el cliente recibe **solo** los de su propio pedido (sala `customer:{id}`, derivada de su sesión).
- **Solo tras verificar:** se notifica únicamente cuando el pago ya fue **verificado y reconciliado** con Wompi; nunca por la redirección del navegador.

```text
Wompi ─webhook─► payments (verifica checksum + reconcilia con la API de Wompi)
   └─ outbox ─► Queue: payments.payment.confirmed.v1
        ├─► realtime (consumer, idempotente)
        │     1. PaymentsGateway / OrdersGateway → detalle del pago y del pedido (ACL)
        │     2. guarda `realtime_notifications` en D1 (historial y no leídas)
        │     3. publica al Durable Object REALTIME_HUB
        │          ├─ admin:payments  → panel de administración
        │          └─ customer:{id}   → solo el cliente dueño del pago
        └─► invoicing (consumer) → emite la factura
              └─ invoicing.invoice.issued.v1 → realtime actualiza la notificación con el número de factura
```

**Detalles que lleva la notificación** (según el rol; nunca datos de tarjeta):

| Grupo | Campos |
|---|---|
| Pago | `paymentId`, referencia, ID de transacción de Wompi, estado, método (tarjeta, PSE, Nequi, contra entrega…), monto, moneda, fecha/hora, IVA/impuestos |
| Pedido | número de pedido, estado, resumen de productos (nombre, cantidad, precio), descuentos/cupón aplicado, costo y tipo de envío |
| Cliente | nombre, correo y teléfono (el admin ve el detalle operativo; datos sensibles como el documento solo en el detalle del pedido, con permiso) |
| Entrega | ciudad/municipio, dirección, tipo (nacional/local), contra entrega sí/no |
| Factura | número y enlace de descarga (llega en una segunda actualización cuando se emite) |

**Eventos que se notifican:** pago aprobado, rechazado, pendiente, anulado/reembolsado, recaudo contra entrega, abono de crédito y factura emitida.

**Frontend:** *toast* con sonido opcional, contador de no leídas, centro de notificaciones (`/admin/notifications`), feed en vivo en `/admin/payments` y, para el cliente, actualización automática en `/checkout/resultado` y `/cuenta/pedidos/:id`. El cliente **deduplica por `notificationId`** (entrega al menos una vez).

### Facturación (`invoicing`)

Cada pago genera su **factura**, que se **guarda completa** y no se puede alterar.

- **Cuándo se emite:** pago Wompi aprobado → factura; contra entrega → al registrar el recaudo (`payments.cod.collected.v1`); crédito → según ADR-0009/ADR-0012.
- **Qué guarda (todos los detalles):**

| Grupo | Campos |
|---|---|
| Encabezado | número consecutivo, prefijo/resolución, fecha y hora de emisión, estado (emitida / anulada), moneda |
| Emisor | razón social, NIT/identificación fiscal, dirección, contacto (desde `settings`) |
| Cliente | nombre o razón social, tipo y número de documento, correo, teléfono, dirección de facturación |
| Pedido y envío | número de pedido, dirección y ciudad/municipio de entrega, método y costo de envío |
| Líneas | por producto: nombre, SKU, cantidad, precio unitario, descuento, base, tarifa e importe de impuesto, total de la línea (todo del *snapshot* del pedido) |
| Totales | subtotal, descuentos y cupones, impuestos desglosados, envío, **total** |
| Pago | método, ID de transacción de Wompi, referencia, fecha, estado (o recaudo contra entrega) |
| Trazabilidad | `eventId`/`paymentId` de origen, usuario/sistema que emitió, fecha de generación del PDF |

- **Dónde se guarda:** datos estructurados y *snapshot* JSON inmutable en D1 (`invoicing_*`); PDF en **R2** bajo un prefijo privado (`private/invoices/{invoiceId}.pdf`), servido solo por el Worker con verificación de propiedad.
- **Numeración:** consecutiva, sin huecos ni duplicados, asignada de forma **atómica** dentro del módulo, e **idempotente** (un solo documento por pago/pedido aunque el evento se repita).
- **Correcciones:** una factura emitida **no se edita ni se borra**; se corrige con **nota crédito** (o anulación trazable).
- **Cuadre obligatorio:** líneas + impuestos + envío − descuentos debe igualar el monto confirmado por Wompi; si no cuadra, **no se emite** y se genera una alerta.
- **Acceso:** el cliente ve y descarga sus facturas en `/cuenta/facturas` (404 si no son suyas); el admin las gestiona en `/admin/invoices` (búsqueda, descarga, reenvío por email, notas crédito).
- **PDF:** `IInvoicePdfPort` con una librería JS pura que corra en Workers (ADR-0013). No requiere navegador ni Containers.
- **Factura electrónica con validez legal:** la emisión inicial es el documento interno completo. Si la operación exige **facturación electrónica ante la autoridad tributaria** (en Colombia, la DIAN, mediante un proveedor tecnológico), se integra detrás de `IElectronicInvoicingPort` y se guardan los identificadores y acuses que devuelva (por ejemplo, el CUFE). **Alcance por confirmar en ADR-0012.**

### Email con Resend (`notifications`)

- Adaptador HTTP de `IEmailPort`; dominio de envío verificado (SPF/DKIM/DMARC).
- Envíos desde un consumer de **Cloudflare Queues** (reintentos con backoff, DLQ, `Idempotency-Key` para evitar duplicados).
- Webhook `POST /api/v1/webhooks/resend` (firma verificada) para registrar entregas, rebotes y quejas en `notifications_log`.
- Plantillas versionadas y editables desde el admin; la clave de API vive en Cloudflare Secrets.
- Al emitirse una factura (`invoicing.invoice.issued.v1`) se envía al cliente por email con el PDF adjunto o un enlace seguro que exige sesión.

---

## 6. Rutas

### 6.1 Tienda pública (Pages SSR)

| Ruta | Contenido |
|---|---|
| `/` | Home: carrusel, banners, anuncios, destacados, promociones |
| `/productos` | Listado con filtros, orden y paginación |
| `/productos/:slug` | Detalle de producto |
| `/productos/:slug/opiniones` | Valoraciones y opiniones paginadas del producto |
| `/categorias/:slug`, `/marcas/:slug` | Listados por categoría / marca |
| `/colecciones` | Directorio paginado de colecciones publicadas |
| `/colecciones/:slug` | Productos publicados de una colección |
| `/blog` | Artículos públicos paginados con filtro por categoría |
| `/blog/:slug` | Artículo publicado con metadatos SEO, canonical y JSON-LD |
| `/buscar?q=` | Búsqueda |
| `/promociones` | Promociones vigentes |
| `/sobre-nosotros`, `/contacto`, `/preguntas-frecuentes` | Páginas informativas editables desde CMS |
| `/politica-de-envios`, `/devoluciones`, `/garantias` | Información de envíos y posventa editable desde CMS |
| `/terminos-y-condiciones`, `/politica-de-privacidad`, `/politica-de-cookies`, `/tratamiento-de-datos` | Páginas legales editables desde CMS |
| `/p/:slug` | Ruta histórica del CMS; se conserva por compatibilidad |
| `/carrito`, `/checkout` | Compra |
| `/seguimiento-pedido` | Clientes con sesión consultan sus pedidos por propiedad; invitados usan número de pedido y clave enviada al correo; estados y datos logísticos administrables desde Envíos en el panel |
| `/login`, `/registro`, `/recuperar` | Acceso de clientes |
| `/cuenta`, `/cuenta/pedidos`, `/cuenta/direcciones`, `/cuenta/facturas` | Área del cliente |
| `/sitemap.xml`, `/sitemap-blog.xml`, `/robots.txt` | Generados dinámicamente |

### 6.2 Panel de administración (Pages SPA)

`/admin/login` · `/admin` (dashboard; grupo CMS con pantallas independientes de Páginas CMS, Menús y Blog) · `/admin/products` · `/admin/categories` · `/admin/brands` · `/admin/media` · `/admin/carousel` · `/admin/banners` · `/admin/announcements` · `/admin/promotions` · `/admin/coupons` · `/admin/seo` · `/admin/seo/redirects` · `/admin/inventory` · `/admin/shipping` · `/admin/credit` · `/admin/payments` · `/admin/invoices` · `/admin/notifications` · `/admin/orders` · `/admin/customers` · `/admin/users` · `/admin/roles` · `/admin/settings` · `/admin/audit`

### 6.3 API (Worker, versionada)

| Prefijo | Acceso | Uso |
|---|---|---|
| `/api/v1/store/*` | Público (cacheable) | Datos para la tienda: home, productos, CMS, anuncios, SEO |
| `/api/v1/auth/*` | Público + rate limit + Turnstile | Registro, login, logout, refresh, recuperación (clientes) |
| `/api/v1/account/*` | Cliente autenticado | Perfil, direcciones, pedidos |
| `/api/v1/cart/*`, `/api/v1/checkout/*` | Invitado o cliente | Carrito y compra |
| `/api/v1/admin/auth/*` | Público + rate limit | Login de administradores |
| `/api/v1/admin/*` | Admin autenticado + permiso RBAC | CRUD de todos los módulos |
| `/api/v1/admin/realtime` | Admin con permiso | WebSocket de notificaciones en vivo |
| `/api/v1/account/realtime` | Cliente autenticado | WebSocket con el estado de sus propios pagos y facturas |
| `/api/v1/account/invoices/*` | Cliente autenticado | Listado y descarga de sus facturas |
| `/api/v1/webhooks/wompi` | Firma/checksum verificado | Eventos de transacciones de Wompi |
| `/api/v1/webhooks/resend` | Firma verificada | Entregas, rebotes y quejas de Resend |
| `/health` | Interno | Estado de bindings críticos |
| `/api/docs` | Admin / entorno dev | OpenAPI (Scalar/Swagger UI) |

Convención CRUD admin por recurso: `GET /` (lista paginada) · `GET /:id` · `POST /` · `PATCH /:id` · `DELETE /:id`, más acciones de negocio explícitas (`POST /:id/publish`, `/archive`, `/reorder`, etc.).

---

## 7. Seguridad

El detalle normativo (IDs `SEC-*`, modelo de amenaza, checklist de PR y matriz de certificación) está en [`SECURITY_RULES.md`](./SECURITY_RULES.md). Resumen:

- **Contraseñas:** PBKDF2 (Web Crypto) con sal por usuario y parámetros versionados; migrable a otro algoritmo sin romper sesiones.
- **Sesiones:** token opaco aleatorio (32 bytes) cuyo **hash SHA-256** se guarda en `identity_sessions`; cookies `__Host-session` (clientes) y `__Host-admin-session` (admin), `HttpOnly; Secure; SameSite=Lax; Path=/`, sin `Domain`. Expiración absoluta e inactividad (más estrictas para admin), rotación al login y revocación en el servidor.
- **Administradores:** MFA (TOTP) obligatoria antes del lanzamiento, re-autenticación en acciones críticas, auditoría de toda mutación.
- **RBAC:** permisos por recurso y acción (`products:write`, `promotions:publish`…), verificados en el BFF vía `IdentityGateway`; la autorización de negocio vive en el módulo.
- **Protección:** rate limiting por IP/usuario, Turnstile en formularios públicos, validación Zod en toda entrada, CSP estricta, cabeceras de seguridad, verificación de firma en webhooks, idempotencia en pagos y eventos.
- **Datos:** secretos solo en Cloudflare Secrets, PII fuera de logs, subidas a R2 con validación de tipo/tamaño y URLs firmadas para operaciones privadas.
- **Carga de imágenes:** 10 MiB máximo, 16.384 px por lado y 40 MP; formatos JPEG, PNG, WebP y AVIF. El Worker valida firmas, estructura disponible, dimensiones, CRC de chunks PNG y tamaño remoto con `R2.head()` antes de persistir D1. La decodificación completa de píxeles y la eliminación EXIF/GPS siguen pendientes.
- **Admin:** opcionalmente detrás de **Cloudflare Access** como capa adicional.

---

## 8. SEO completo

Gestionado por el módulo `seo` y renderizado en el servidor (SSR) para que los crawlers reciban HTML completo.

- **Metadatos por página y por entidad** (producto, categoría, marca, página CMS, home): `title`, `description`, `canonical`, `robots` (index/noindex, follow/nofollow), Open Graph, Twitter Cards. Valores por defecto con plantillas (`{nombre} | {tienda}`) y sobrescritura manual desde el admin.
- **Datos estructurados JSON-LD:** `Organization`, `WebSite` (con SearchAction), `Product` + `Offer` + `AggregateRating` (cuando existan reseñas), `BreadcrumbList`, `FAQPage` (CMS).
- **`sitemap.xml`** dinámico (índice + sitemaps por tipo) con `lastmod`, mantenido por eventos.
- **`robots.txt`** configurable desde el admin (con referencia al sitemap).
- **Redirecciones** 301/302 gestionables, y redirección automática al cambiar un `slug`.
- **URLs limpias** y slugs únicos; canonical para filtros y paginación.
- **Imágenes:** `alt` obligatorio en la biblioteca de medios, formatos modernos (AVIF/WebP), `srcset`, `width/height` y carga diferida.
- **Rendimiento (Core Web Vitals):** HTML cacheado en el edge, assets inmutables, mínimo JS en la tienda.
- **Preparado para i18n:** estructura compatible con `hreflang` si se añaden idiomas.

---

## 9. Caché e invalidación

- Lecturas públicas: **Cache API** (respuesta completa) + **KV** (fragmentos y configuración), siempre tras un `ICachePort`.
- Keys en KV: `<modulo>:<entidad>:<id>:<subrecurso>`, con TTL explícito.
- **Invalidación por eventos:** un consumer de Queue purga las entradas afectadas cuando cambia un producto, banner, anuncio o página.
- KV nunca es fuente de verdad de datos críticos.
- Degradación elegante: si un módulo secundario falla, se sirve la última versión en caché.

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
| `payments.payment.confirmed.v1` / `.failed.v1` | payments | orders, credit, invoicing, realtime, notifications, audit |
| `payments.cod.collected.v1` | payments | orders, invoicing, realtime, audit |
| `invoicing.invoice.issued.v1` | invoicing | notifications (email), realtime, audit |
| `invoicing.credit_note.issued.v1` | invoicing | notifications, realtime, audit |
| `shipping.zone.changed.v1` | shipping | caché |
| `credit.installment.due.v1` | credit | notifications |
| `credit.installment.paid.v1` | credit | audit, notifications |

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
│  ├─ storefront/             # Pages SSR (tienda)
│  └─ admin/                  # Pages SPA (panel)
├─ tests/
│  ├─ e2e/
│  └─ load/                   # k6
└─ .github/workflows/         # CI: lint, tipos, tests, aislamiento de tablas, deploy
```

Las migraciones viven en cada módulo (`infrastructure/persistence/d1/migrations/0001_init.sql`) y un script las copia al `migrations_dir` de Wrangler como `<modulo>__0001_init.sql`.

---

## 12. Bindings, Variables de Entorno y Secretos de Cloudflare (`apps/api/wrangler.jsonc`)

### 12.1 Bindings de Infraestructura Cloudflare

| Binding | Tipo | Nombre del Recurso en Cloudflare | Uso en la Plataforma |
|---|---|---|---|
| `DB` | Cloudflare D1 | `ecommerce-vega-production` | Base de datos SQLite distribuida única (tablas prefijadas `<modulo>_*`) |
| `MEDIA_BUCKET` | Cloudflare R2 | `ecommerce-vega-production` | Almacenamiento de imágenes de productos, banners, adjuntos de medios |
| `CACHE` | Workers KV | `ecommerce-vega-cache-production` | Almacenamiento clave-valor de alta velocidad, caché de catálogo y settings |
| `EVENTS_QUEUE` | Cloudflare Queues | `ecommerce-vega-events-production` | Bus de eventos asíncronos y transaccionales (outbox, emails, auditoría) |
| `EVENTS_DLQ` | Cloudflare Queues | `ecommerce-vega-events-dlq-production` | Dead Letter Queue para reintentos y tolerancia a fallos |
| `ANALYTICS` | Analytics Engine | `ecommerce_vega_analytics_production` | Métricas y telemetría de eventos en tiempo real |
| `crons` | Cron Triggers | `["*/5 * * * *"]` | Tarea programada cada 5 minutos para outbox relay y tareas de mantenimiento |

### 12.2 Variables de Entorno Públicas / Configurables (`vars` en `wrangler.jsonc`)

Estas variables no son sensibles y pueden definirse en el archivo `apps/api/wrangler.jsonc` o directamente en el panel de Cloudflare (Workers & Pages > Settings > Variables and Secrets):

| Variable | Tipo | Valor / Ejemplo | Propósito |
|---|---|---|---|
| `ENVIRONMENT` | String | `production` \| `staging` \| `development` | Identifica el entorno de ejecución activo. |
| `ADMIN_EMAIL` | String | `admin@tudominio.com` | Correo de inicio de sesión del único Superadmin activo. No es un canal de entrega para TOTP. |
| `RESEND_FROM_EMAIL` | String | `Vega Store <envio@tudominio.com>` | Remitente verificado en Resend para todos los correos transaccionales (confirmación de compra, notificaciones al admin, cambios de estado del pedido). En pruebas se puede usar `Vega Store <onboarding@resend.dev>`. |
| `WOMPI_PUBLIC_KEY` | String | `pub_prod_...` \| `pub_test_...` | Llave pública de Wompi Colombia para inicializar el widget de checkout en frontend y validaciones. |

### 12.3 Secretos Encriptados (`wrangler secret put` o Dashboard de Cloudflare)

> [!CAUTION]
> **NUNCA** subas estas claves al repositorio ni las incluyas en texto plano en archivos `json` o `ts`. Se configuran exclusivamente con `wrangler secret put <NOMBRE>` o en el panel de Cloudflare en la sección de secretos encriptados.

| Secreto | Proveedor / Servicio | Cómo obtenerlo | Propósito |
|---|---|---|---|
| `RESEND_API_KEY` | [Resend](https://resend.com) | Panel de Resend > API Keys (`re_...`) | Autenticación en la API de Resend para el envío de correos transaccionales con plantillas HTML. |
| `ADMIN_PASSWORD` | Cloudflare Workers | Workers & Pages > Settings > Variables and Secrets > Add secret | Contraseña de inicio de sesión del Superadmin configurado por `ADMIN_EMAIL`. Configurar como secret; nunca enviarla por correo ni guardarla en el repositorio. |
| `RESEND_WEBHOOK_SECRET` | [Resend](https://resend.com) | Panel de Resend > Webhooks (opcional) | Validación de firmas de eventos de entrega/rebote de correo. |
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
# Opcional si usas webhook de Resend:
npx wrangler secret put RESEND_WEBHOOK_SECRET
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

## 15. Decisiones abiertas

Se resolverán como ADR antes de la fase que las necesite:

| # | Decisión | Propuesta inicial |
|---|---|---|
| ADR-0002 | Framework del storefront con SSR | Astro + islas React (alternativa: SvelteKit / Next vía OpenNext) |
| ADR-0003 | Estrategia de autenticación | Sesiones opacas con hash en D1, cookies `__Host-`, PBKDF2 (100.000 iteraciones), MFA para admin (ver `SECURITY_RULES.md`) |
| ADR-0004 | Proveedor de pagos (puerto `IPaymentPort`) | ✅ **Decidido: Wompi** |
| ADR-0005 | Proveedor de email transaccional (`IEmailPort`) | ✅ **Decidido: Resend** |
| ADR-0006 | Búsqueda de productos | D1 FTS5 dentro de `catalog`; evaluar alternativas si crece |
| ADR-0007 | Dominio y rutas | El Worker sirve `/api/*` en cada host (tienda y `admin.`), así cada frontend usa su mismo origen y no hay CORS |
| ADR-0008 | Moneda, impuestos y envíos | COP (por Wompi); IVA configurable en `settings`; envíos en el módulo `shipping` |
| ADR-0009 | Alcance de "productos a crédito" | **Por confirmar.** Supuesto actual: venta financiada en cuotas con módulo `credit` (alternativa: créditos/saldo a favor del cliente) |
| ADR-0010 | Reglas de combinación en carritos mixtos (contra entrega, local/nacional, crédito) | Propuesta de la sección 5.1 |
| ADR-0011 | Transporte de tiempo real | ✅ **Decidido y operativo:** Polling atómico HTTP `?since=` con persistencia de eventos en D1 y broadcast a paneles admin y checkout. |
| ADR-0012 | Alcance de la facturación | ✅ **Decidido y certificado:** Documento soporte interno inmutable con resolución y consecutivos atómicos en D1 y R2; puerto `IElectronicInvoicingPort` listo para futura conexión DIAN. |
| ADR-0013 | Generación del documento de facturas | ✅ **Decidido y operativo:** Adaptador HTML formal inmutable almacenado en R2 (`HtmlInvoicePdfAdapter`) servible y descargable de forma segura desde el Worker. |

---

## 16. Documentos relacionados

- [`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md): **contrato de arquitectura, de lectura obligatoria y con prioridad sobre este documento.**
- [`SECURITY_RULES.md`](./SECURITY_RULES.md): reglas de seguridad `SEC-*`, checklist de PR y matriz de certificación (estado: PENDIENTE).
- [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md): estrategia de release, rollback de Worker/Pages, D1, R2, Queues, caché y reconciliación de pagos (estado: PENDIENTE).
- [`ROADMAP.md`](./ROADMAP.md): fases, entregables y criterios de salida (cada fase indica las secciones del contrato y las reglas de seguridad/recuperación que aplican).
- `docs/PROJECT_RULES.md` (se crea en la Fase 0): nombres reales de Worker, D1, Queues, buckets y contextos.

## Operación de seguridad: MFA y medios

- Tras el despliegue, el admin existente inicia sesión con su contraseña y es redirigido a `/admin/mfa-setup`. Debe reingresar la contraseña, importar el URI/secreto TOTP en su autenticador, guardar una copia del secreto en un gestor seguro y confirmar un código de seis dígitos. Hasta completar esa confirmación, la sesión solo puede realizar el enrolamiento.
- En logins siguientes, ingresar el código TOTP en el formulario. Las sesiones administrativas sin MFA no pueden consultar ni mutar recursos protegidos.
- Las imágenes de entrada aceptadas (JPEG, PNG, WebP y AVIF, hasta 10 MiB, 16.384 px por lado y 40 MP) se decodifican por completo y se convierten a WebP antes de guardarse en R2. La recodificación descarta EXIF/GPS. El Worker requiere el binding `IMAGES` declarado en los dos `wrangler.jsonc`; el procesamiento de salida usa Cloudflare Images y sus transformaciones únicas son facturables según el plan de Cloudflare.
- El cron revisa diariamente hasta 1.000 claves de `media/` y solo borra las mayores de siete días sin fila referencial en `media_assets`. Excluye medios privados y documentos. No se ejecuta una limpieza de producción manual como parte del despliegue.
