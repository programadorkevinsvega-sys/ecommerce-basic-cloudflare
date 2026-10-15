# SEO_ARCHITECTURE.md — Manual Maestro de SEO para Ecommerce Cloudflare

Este documento consolida la arquitectura, implementación y directivas técnicas de **Search Engine Optimization (SEO)** para el ecommerce 100% Cloudflare Serverless, sin Cloudflare Containers.

---

## 1. Estado en el repositorio (corte 2026-10-15)

Este apartado describe capacidades encontradas en el código actual. No certifica que la versión esté desplegada en todos los entornos, que el sitemap esté registrado en herramientas externas ni que Google muestre resultados enriquecidos. Para producción se requiere evidencia de despliegue y smoke test; para seguridad, consultar la matriz de [`SECURITY_RULES.md`](../SECURITY_RULES.md).

### 1.1 Módulo Autónomo `seo` y Base de Datos D1
- **Tabla `seo_redirects`**:
  - Manejo de redirecciones `301` (permanentes) y `302` (temporales).
  - Columnas: `id`, `from_path`, `to_path`, `status_code`, `created_at`.
  - Middleware en el BFF que intercepta rutas antes de arrojar 404 para resolver y ejecutar la redirección.
- **Tabla `seo_metadata`**:
  - Almacena metadatos desacoplados por entidad (`entity_type`, `entity_id`, `title`, `description`, `canonical_url`, `noindex`, `structured_data`).
- **Tabla `seo_outbox_events`**:
  - Patrón Transactional Outbox para comunicar eventos de indexación mediante Cloudflare Queues sin imports entre módulos.

### 1.2 Atributos y Dominio de Catálogo (`catalog_products`)
El agregador `Product` incluye campos nativos para SEO y fichas técnicas:
- `slug`: Handle semántico único e indexado, editable y autogenerado vía normalización Unicode.
- `condition`: Estado del producto (`new`, `used`, `refurbished`), mapeado a Schema.org (`NewCondition`, `UsedCondition`, `RefurbishedCondition`).
- `specifications`: JSON con atributos técnicos y fichas de producto renderizadas en HTML.
- `brand`: Fabricante/marca vinculado a la entidad Schema `Brand`.
- `product_type`: Categorización del producto.
- `tags`: Etiquetas en array JSON para filtros y metadatos.
- `barcode_gtin`: Código de barras internacional (GTIN/EAN) para reconocimiento en Google Shopping.
- `seo_title`: Título optimizado (~60-70 caracteres) con fallback dinámico al nombre del producto.
- `seo_description`: Meta descripción (~155-160 caracteres) con fallback dinámico a los primeros 160 caracteres limpios de HTML.
- `canonical_url`: URL canónica explícita para evitar duplicación.
- `og_image_id`: Identificador de imagen para OpenGraph y Twitter Cards.
- `noindex`: Flag booleana que emite `<meta name="robots" content="noindex, nofollow">` y excluye el producto del sitemap.

### 1.3 Sitemap Index Segmentado y Robots.txt
- **`GET /robots.txt`**:
  - `Allow: /`
  - `Disallow: /admin`
  - `Disallow: /api/`
  - Enlace al Sitemap Index oficial.
- **`GET /sitemap.xml`**:
  - Estructura `sitemapindex` que divide el sitemap en archivos específicos:
    - `/sitemap-pages.xml`: URLs estáticas del home y colecciones.
    - `/sitemap-products.xml`: URLs dinámicas de productos publicados, filtrando automáticamente aquellos con `noindex = true`.

### 1.4 Datos Estructurados JSON-LD (`schema.org`)
Inyectados en el `<head>` del HTML con sanitización de caracteres para prevenir ataques XSS:
- **`Product` & `Offer`**: Nombre, descripción, SKU, imagen, marca, condición, `price` (formateado en centavos COP), `priceCurrency: COP`, `priceValidUntil` (+1 año) y `availability` (`InStock` vs `OutOfStock`).
- **`BreadcrumbList`**: Lista de migas de pan con posición jerárquica (Inicio → Catálogo → Producto).
- **`WebSite`**: Entidad del sitio con `SearchAction` (`potentialAction`) para el buscador de Google.
- **`Organization`**: Nombre comercial y logotipo.
- **`ItemList`**: Marcado de colección para el listado de productos en `/productos`.

### 1.5 Migas de pan y hreflang
- Breadcrumbs visuales HTML (`nav[aria-label="Breadcrumb"]`) en la cabecera de la ficha de producto.
- El layout actual emite etiquetas estáticas `hreflang` `es-CO` y `x-default`, ambas con la canonical de la página. Esto no constituye una configuración internacional por país:
  - `<link rel="alternate" hreflang="es-CO" href="...">`
  - `<link rel="alternate" hreflang="x-default" href="...">`

### 1.6 Control de Navegación Facetada y Búsquedas Internas
- Cualquier consulta con filtros o búsqueda interna (`/productos?q=...`) emite automáticamente:
  - `<meta name="robots" content="noindex, nofollow">`
  - `<link rel="canonical" href="https://.../productos">`
- Esto evita la creación de miles de páginas basura de poco valor o contenido duplicado en los índices de Google.

### 1.7 Panel de Administración con SERP Preview
- Vista previa interactiva estilo Google Search (título azul, URL verde y snippet gris).
- Contadores de caracteres en tiempo real:
  - Título SEO (alerta superados los 70 caracteres).
  - Meta descripción SEO (alerta superados los 160 caracteres).
- Generación automática reactiva del slug al escribir el nombre del producto.

---

## 2. Capacidades actuales y pendientes

### 2.1 CMS, Blog y reseñas

- CMS publica páginas institucionales mediante rutas limpias y conserva `/p/:slug` para compatibilidad.
- Blog tiene listado y detalle SSR, categorías, perfil editorial, metadatos SEO y sitemap propio.
- Las reseñas se muestran en la ficha y en `/productos/:slug/opiniones`; la elegibilidad de reseñas verificadas se consulta mediante el Gateway de pedidos. Las opiniones sembradas quedan identificadas internamente como no verificadas y se excluyen del JSON-LD.
- `AggregateRating` en el HTML no garantiza que Google lo muestre como resultado enriquecido. Validar los datos estructurados y las políticas vigentes antes de comunicar elegibilidad o resultados en SERP.

### 2.2 Mejoras SEO pendientes

- Crear contenido introductorio útil para categorías y colecciones, evitando páginas duplicadas o texto genérico.
- Agregar marcado FAQ solo cuando coincida con contenido visible y se valide contra las directrices de buscadores.
- Auditar periódicamente canonicals, códigos HTTP, enlaces rotos, Open Graph, JSON-LD y sitemaps sobre URLs desplegadas.

### 2.3 Variantes y Gestión de Stock Agotado
- [ ] **Estrategia de Variantes**:
  - Variantes con URL propia mediante hash/query (`/productos/camiseta?color=rojo`) con canonical hacia la versión principal, o URLs individuales si existe volumen de búsqueda diferenciado.
- [ ] **Tratamiento de Descontinuados**:
  - Cuando un producto se descontinúa permanentemente, generar redirección `301` hacia la categoría correspondiente o producto sustituto directo.

### 2.4 Integraciones con Plataformas de Búsqueda y Shopping
- [ ] **Feed XML de Google Merchant Center**:
  - Endpoint `GET /api/v1/feeds/google-merchant.xml` para sincronización automática con Google Shopping (productos gratuitos y de pago).
- [ ] **Google Search Console & Bing Webmaster**:
  - Verificación por meta tag o archivo HTML servido desde el Worker.
  - Ping automático al sitemap al publicar productos mediante webhook/cron.
- [ ] **Cloudflare Web Analytics**:
  - Baliza de telemetría ligera de Cloudflare sin cookies para medición de Core Web Vitals (LCP, CLS, INP) en tiempo real sin impacto en rendimiento.

### 2.5 Internacionalización multipaís (futura)
- [ ] **Rutas por País / Región**:
  - Subdirectorios por país (ej. `/co/`, `/mx/`) o dominios separados gestionados por Workers Routes.
  - Mapeo dinámico de etiquetas `hreflang` en base al catálogo territorial.

---

## 3. Checklist de Auditoría SEO Pre-Lanzamiento

Antes de pasar a producción cualquier módulo que afecte URLs o contenido:

1. [ ] **HTML Server-Rendered**: El contenido es visible desactivando JavaScript (`curl -s <url> | grep <contenido>`).
2. [ ] **Etiquetas Canónicas**: Toda página contiene un `<link rel="canonical">` absoluto y canónico.
3. [ ] **Robots y Noindex**: Filtros y búsquedas tienen `noindex`. Páginas de producto tienen `index, follow`.
4. [ ] **Datos Estructurados Validados**: El código JSON-LD pasa sin errores en la herramienta de prueba de resultados enriquecidos de Google (*Rich Results Test*).
5. [ ] **Redirecciones 301**: Todo cambio de slug tiene su fila en `seo_redirects` y responde código HTTP `301`.
6. [ ] **Imágenes con Alt Text**: Toda etiqueta `<img>` cuenta con atributo `alt` descriptivo.
7. [ ] **Sitemap Actualizado**: La nueva entidad aparece en `/sitemap.xml` (o en su sub-sitemap correspondiente).
