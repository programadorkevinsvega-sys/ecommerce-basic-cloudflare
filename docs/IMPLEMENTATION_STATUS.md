# Estado de implementación y sincronización documental

**Corte documental:** 2026-10-15. **Rama revisada:** `main`.

Este archivo es un índice para distinguir estado del código, operación y evidencia. No reemplaza contratos normativos, ADRs ni registros de migración. Las funciones marcadas presentes describen el repositorio revisado; solo las notas con verificación explícita prueban un comportamiento de un entorno concreto.

## Capacidades visibles en el repositorio

| Área | Estado documentado |
|---|---|
| Administración | Dashboard en `/admin`, con navegación lateral para Operación, Catálogo, Marketing, CMS y Sistema. Las secciones del menú son vistas de la aplicación, no rutas `/admin/<sección>` independientes. |
| Catálogo | Productos, categorías, marcas, proveedores, atributos, variantes, colecciones, etiquetas de producto y reseñas tienen pantallas administrativas separadas. Etiquetas administra el nombre, descripción y estado; la asignación se hace desde crear/editar producto y se conserva en `catalog_products.tags`. El catálogo público tiene paginación del lado servidor. |
| CMS y Blog | Páginas CMS, Menús y Blog son pantallas separadas dentro del grupo CMS. Blog administra artículos, autores y categorías; el storefront tiene `/blog` y `/blog/:slug`. |
| Reseñas | El producto y su página de opiniones muestran puntuaciones/conteos. Las reseñas verificadas dependen de una compra elegible consultada por Gateway. La fuente de la migración `reviews__0002_demo_reviews.sql` ya no inserta opiniones ficticias en una instalación nueva; las bases previas pueden conservar las filas históricas hasta que se reemplacen o limpien. |
| Seguimiento | `/seguimiento-pedido`: el cliente autenticado accede a sus pedidos por sesión; un invitado requiere el número de pedido y la clave enviada al correo. La administración tiene gestión de seguimiento y una vista separada para imprimir guías listas. |
| Notificaciones | La ruta REST autenticada consulta D1 con cursor `since`; el panel de pagos hace polling. No existen Durable Objects/WebSockets en la configuración actual. ADR-0011 conserva la propuesta original como diseño futuro. |
| Facturas | El adaptador actual almacena y sirve HTML/CSS de impresión desde R2. No genera un PDF binario en el Worker. |
| Envíos | La zona local del comercio es Medellín y los diez municipios del Valle de Aburrá. Los destinos nacionales, cobertura y tarifas se consultan a MiPaquete. Configuración de transportadora, empaques, seguimiento e impresión son secciones administrativas distintas. |
| Guías MiPaquete | El código contempla cotización, creación idempotente, consulta/sincronización y captura de impresión. Una respuesta ambigua sin coincidencia confirmada bloquea el segundo despacho. La documentación disponible no acredita aquí una guía de producción procesada de punta a punta. |
| Flujo tras mutación del admin | La navegación actual se conserva tras guardar/refrescar mediante estado de sesión; ver `AUDIT_PROGRESS.md` y commit `9dfb476`. |

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
