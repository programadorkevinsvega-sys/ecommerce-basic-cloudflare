# ADR-0014: Módulo SEO, Metadatos, Redirecciones 301 y Sitemap

## Estado
Aceptado (2026-10-11)

## Contexto
El ecommerce requiere posicionamiento orgánico en motores de búsqueda (Google), prevención de enlaces rotos al modificar handles/slugs de productos o categorías, metadatos enriquecidos (OpenGraph, Twitter Cards, JSON-LD) y control estricto de indexación (`noindex`, `canonical`). Además, debe cumplirse la regla de aislamiento modular: ningún módulo accede a tablas de otro módulo ni realiza imports prohibidos.

## Decisiones

1. **Módulo autónomo `seo`**:
   - Tablas propias en D1 con prefijo estricto: `seo_redirects`, `seo_metadata`, `seo_outbox_events`.
   - `SeoGateway` expuesto al BFF para resolución de redirecciones (`resolveRedirect`) y creación de reglas (`createRedirect`).
   - El BFF intercepta rutas públicas para evaluar redirecciones registradas antes de retornar 404, aplicando códigos HTTP `301` permanentes.

2. **Atributos de producto y SEO en `catalog`**:
   - Columnas nativas en `catalog_products`: `slug`, `condition` (`new`, `used`, `refurbished`), `specifications` (JSON), `brand`, `product_type`, `tags` (JSON), `barcode_gtin`, `seo_title`, `seo_description`, `canonical_url`, `og_image_id`, `noindex`.
   - Servicio de dominio `ProductSeoHelper`:
     - Fallback de título: si `seo_title` está vacío, utiliza el nombre del producto.
     - Fallback de descripción: si `seo_description` está vacía, limpia etiquetas HTML y toma hasta 160 caracteres.
     - Slugs autogenerados mediante normalización unicode y regex.
     - Generación de datos estructurados JSON-LD (`schema.org/Product`) con sanitización contra inyecciones `<script>`.

3. **SERP Preview en Admin UI**:
   - Vista previa dinámica en tiempo real del snippet de Google con título azul, URL verde y descripción gris.
   - Contadores de caracteres con alerta visual: límite recomendado de ~70 caracteres para título y ~160 para descripción.

4. **Sitemap y Robots**:
   - `GET /robots.txt` servido con directivas claras protegiendo `/admin` y `/api/`.
   - `GET /sitemap.xml` autogenerado dinámicamente mediante `CatalogGateway`, excluyendo estrictamente productos marcados con `noindex = true`.

## Consecuencias
- Excelente rendimiento de indexación y experiencia SEO comparable a plataformas empresariales.
- Respeto del contrato de arquitectura modular 100% Cloudflare (máximo 200 líneas por archivo, cero dependencias cruzadas entre módulos).
