# Estado de implementación y sincronización documental

**Corte documental:** 2026-10-15. **Rama revisada:** `main`.

Este archivo es un índice para distinguir estado del código, operación y evidencia. No reemplaza contratos normativos, ADRs ni registros de migración. Las funciones marcadas presentes describen el repositorio revisado; solo las notas con verificación explícita prueban un comportamiento de un entorno concreto.

## Capacidades visibles en el repositorio

| Área | Estado documentado |
|---|---|
| Administración | Dashboard en `/admin`, con navegación lateral para Operación, Catálogo, Marketing, CMS y Sistema. Las secciones del menú son vistas de la aplicación, no rutas `/admin/<sección>` independientes. |
| Catálogo | Productos, categorías, marcas, proveedores, atributos, variantes, colecciones, etiquetas de producto y reseñas tienen pantallas administrativas separadas. Etiquetas administra el nombre, descripción y estado; la asignación se hace desde crear/editar producto y se conserva en `catalog_products.tags`. El catálogo público tiene paginación del lado servidor. |
| Ficha de producto | Muestra productos relacionados según señales compartidas del catálogo (etiquetas, marca, tipo y categorías); no completa la sección con productos sin relación. Cada producto admite una guía textual administrada en su formulario y enlaces a artículos publicados del blog, que se resuelven mediante `CmsGateway`. |
| CMS y Blog | Páginas CMS, Menús y Blog son pantallas separadas dentro del grupo CMS. Blog administra artículos, autores y categorías; el storefront tiene `/blog` y `/blog/:slug`. |
| Reseñas | El producto y su página de opiniones muestran puntuaciones/conteos. Las reseñas verificadas dependen de una compra elegible consultada por Gateway. La fuente de la migración `reviews__0002_demo_reviews.sql` ya no inserta opiniones ficticias en una instalación nueva; las bases previas pueden conservar las filas históricas hasta que se reemplacen o limpien. |
| Seguimiento | `/seguimiento-pedido`: el cliente autenticado accede a sus pedidos por sesión; un invitado requiere el número de pedido y la clave enviada al correo. La administración tiene gestión de seguimiento y una vista separada para imprimir guías listas. |
| Perfil y seguridad de cuenta | `/cuenta/perfil` permite editar nombre/teléfono con contraseña actual; `/cuenta/seguridad` cambia contraseña, rota la sesión, cierra las sesiones anteriores y permite listar/revocar sesiones del propio cliente. El correo aún no se puede cambiar porque falta el flujo de verificación de la nueva dirección. |
| Notificaciones | La ruta REST autenticada consulta D1 con cursor `since`; el panel de pagos hace polling. No existen Durable Objects/WebSockets en la configuración actual. ADR-0011 conserva la propuesta original como diseño futuro. |
| Facturas | El adaptador actual almacena y sirve HTML/CSS de impresión desde R2. No genera un PDF binario en el Worker. |
| Envíos | La zona local del comercio es Medellín y los diez municipios del Valle de Aburrá. Los destinos nacionales, cobertura y tarifas se consultan a MiPaquete. Configuración de transportadora, empaques, seguimiento e impresión son secciones administrativas distintas. |
| Guías MiPaquete | El código contempla cotización, creación idempotente, consulta/sincronización y captura de impresión. Una respuesta ambigua sin coincidencia confirmada bloquea el segundo despacho. La documentación disponible no acredita aquí una guía de producción procesada de punta a punta. |
| Flujo tras mutación del admin | La navegación actual se conserva tras guardar/refrescar mediante estado de sesión; ver `AUDIT_PROGRESS.md` y commit `9dfb476`. |
| Caché pública | Workers Cache cubre HTML SSR anónimo de catálogo, fichas, colecciones, marcas, blog y páginas institucionales; TTL 30 s y etiqueta `storefront-public-html`. El BFF la purga tras escrituras exitosas relevantes y el Cron tras publicar artículos programados. `Vary: Cookie`, `private, no-store` para sesión y rutas transaccionales. Workers KV no almacena respuestas HTML. |

### Verificación de caché en producción

El commit `028304b` se desplegó el 2026-10-15 como Worker `5e170392-bcba-488b-8072-d6300987d39f`. Dos solicitudes GET consecutivas a `/productos` devolvieron `CF-Cache-Status: MISS` y luego `HIT`. Una solicitud con cookie devolvió `BYPASS` y `Cache-Control: private, no-store`; `/checkout` también devolvió `BYPASS`. Esto confirma la activación del caché en las rutas verificadas, no una prueba de carga ni cobertura de todas las ubicaciones.

La invalidación por etiqueta se desplegó el 2026-10-15 en Worker `658dcbcb-44b9-45c0-9e08-b1d74a519eed`. El endpoint de detalle de producto respondió `MISS` y luego `HIT` tras el despliegue. Typecheck, lint de arquitectura, `git diff --check` y `wrangler deploy --dry-run` pasaron. La ejecución real de una mutación autenticada para observar el `purge` no se realizó; queda pendiente observar el log/evento en la primera escritura operativa. Si el purge falla, `cache.public_html_invalidation_failed` queda registrado y el TTL sigue limitando obsolescencia a 30 segundos.

## Migraciones y datos

- Las migraciones fuente están en `apps/api/src/modules/<módulo>/infrastructure/persistence/d1/migrations/`; el manifiesto registra su historial conocido en [`migrations/manifest.md`](./migrations/manifest.md).
- Las migraciones no equivalen a datos desplegados en todos los entornos. No ejecutar migraciones durante una actualización solo documental.
- La migración `shipping__0006_medellin_metropolitan_local_delivery.sql` limita la zona local activa; sus asociaciones sustituidas no se restauran con rollback de aplicación.
- Las dimensiones iniciales de productos y perfiles de caja son estimaciones que deben medirse contra embalajes físicos.
- El historial de `reviews` tiene una particularidad: el manifiesto existente registra `reviews__0002_demo_reviews.sql` en producción el 2026-10-14 y `reviews__0001_init.sql` el 2026-10-15. Esa secuencia temporal requiere reconciliación con el ledger remoto antes de usarla como prueba; no se debe ocultar ni inferir un estado distinto sin consultar D1.
- Preparación de prelanzamiento: la fuente `reviews__0002_demo_reviews.sql` ya no inserta reseñas ficticias y `inventory__0001_init.sql` ya no asigna stock de muestra. Esto solo afecta una D1 nueva; no cambia datos de la base existente.

## Estado operativo que sigue pendiente

- Certificación integral de seguridad y ensayo formal de rollback/restauración: permanecen pendientes según `SECURITY_RULES.md` y `ROLLBACK_RECOVERY.md`.
- Prueba controlada completa de MiPaquete con envío real, guía, impresión, tracking, correo al cliente, cobros y conciliación.
- Resolver con el proveedor una respuesta ambigua de creación de envío cuando `getSendings` no encuentra coincidencia; mientras tanto no se reintenta el despacho automáticamente.
- Ratificar el alcance legal/comercial de venta a crédito (ADR-0009).

## Documentos fuente

- Contratos: `AGENTS.md`, arquitectura, `SECURITY_RULES.md`, `ROLLBACK_RECOVERY.md`.
- Alcance y rutas: `README.md`.
- Fases y tareas: `ROADMAP.md`.
- Historial de trabajo: `AUDIT_PROGRESS.md`.
- Decisiones: `docs/adr/`.
- Esquema D1: `docs/migrations/schema-audit.md`; aplicación por entorno: `docs/migrations/manifest.md`.
