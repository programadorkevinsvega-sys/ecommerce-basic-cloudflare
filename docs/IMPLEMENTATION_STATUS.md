# Estado de implementación y sincronización documental

**Corte documental:** 2026-10-22. **Rama revisada:** `main`.

Este archivo es un índice para distinguir estado del código, operación y evidencia. No reemplaza contratos normativos, ADRs ni registros de migración. Las funciones marcadas presentes describen el repositorio revisado; solo las notas con verificación explícita prueban un comportamiento de un entorno concreto.

## Capacidades visibles en el repositorio

| Área | Estado documentado |
|---|---|
| Administración | Dashboard en `/admin`, con navegación lateral para Operación, Catálogo, Marketing, CMS y Sistema. Las secciones del menú son vistas de la aplicación, no rutas `/admin/<sección>` independientes. |
| Catálogo | Productos, categorías, marcas, proveedores, atributos, variantes, colecciones, etiquetas de producto y reseñas tienen pantallas administrativas separadas. Etiquetas administra el nombre, descripción y estado; la asignación se hace desde crear/editar producto y se conserva en `catalog_products.tags`. El catálogo público usa paginación, filtros de marca/precio base/pago contra entrega y ordenamiento en servidor antes de paginar. Los filtros y el ordenamiento se desplegaron y el propietario los validó funcionalmente el 2026-10-22. |
| Inventario | `inventory_stocks` es la fuente de verdad del stock operativo; `catalog_products.stock_quantity` es un espejo del catálogo, no autoriza por sí solo a reponer existencias. Al crear un producto se inicializa su registro de inventario. La sincronización de arranque solo crea registros ausentes, sin sobrescribir los existentes. La edición de stock desde Productos requiere confirmación explícita y usa una actualización D1 atómica que preserva `reserved_quantity` y rechaza un stock objetivo inferior a las reservas. La implementación está integrada en `main` y pasó validación local el 2026-10-22: typecheck, lint, 202 pruebas unitarias y 25 pruebas de Workers. Falta el despliegue y la comprobación funcional final con el stock discrepante y el checkout en producción. |
| Ficha de producto | Muestra productos relacionados según señales compartidas del catálogo (etiquetas, marca, tipo y categorías); no completa la sección con productos sin relación. Cada producto admite una guía textual administrada en su formulario y enlaces a artículos publicados del blog, que se resuelven mediante `CmsGateway`. |
| CMS y Blog | Páginas CMS, Menús y Blog son pantallas separadas dentro del grupo CMS. Blog administra artículos, autores y categorías; el storefront tiene `/blog` y `/blog/:slug`. |
| Lista de deseos | Módulo integrado en `main`, con API privada, `/cuenta/favoritos`, botón en producto, persistencia D1 e aislamiento por cliente. La migración D1 fue aplicada en producción y el propietario validó manualmente el ciclo completo de añadir/listar/quitar favoritos en el frontend el 2026-10-22. Hay pruebas unitarias, de controlador y de persistencia/aislamiento en Workers. |
| Reseñas | La ficha y la página pública paginada exponen reseñas y agregados; la elegibilidad comprueba una compra pagada/entregada y propiedad del cliente. La administración permite listar, buscar/paginar, crear, ver, editar, publicar/ocultar y eliminar. Pruebas automatizadas cubren elegibilidad, acceso entre clientes, duplicados/validación y persistencia/agregados D1; el roadmap marca las capacidades públicas y administrativas como implementadas. La fuente de `reviews__0002_demo_reviews.sql` no inserta opiniones ficticias en instalaciones nuevas; bases previas pueden conservar filas históricas. |
| Seguimiento | `/seguimiento-pedido`: el cliente autenticado accede solo a sus pedidos por sesión; un invitado requiere el número de pedido y la clave privada enviada al correo. La administración dispone de gestión de estados/tracking y una vista para imprimir guías. Hay pruebas de autorización, aislamiento de pedidos, permisos administrativos y persistencia D1; aún está pendiente certificar un pedido real con guía real, correo recibido y tracking de transportadora de principio a fin. |
| Perfil y seguridad de cuenta | `/cuenta/perfil` permite editar nombre/teléfono con contraseña actual; `/cuenta/seguridad` cambia contraseña, rota la sesión, cierra las sesiones anteriores y permite listar/revocar sesiones del propio cliente. El correo aún no se puede cambiar porque falta el flujo de verificación de la nueva dirección. |
| Registro y autenticación | `/auth/register`, `/auth/login` y `/admin/login` incluyen Turnstile. Los tres endpoints verifican token y hostname en servidor con `TURNSTILE_HOSTNAMES` antes de registrar o autenticar; fallos de verificación no crean cuentas ni sesiones. |
| Sesión del cliente | El login normal redirige a `/cuenta`; el encabezado ofrece «Mi cuenta». En `/cuenta` el botón de cierre revoca la sesión y expira la cookie antes de regresar al inicio. |
| Tarjetas de catálogo | Las imágenes de tarjetas usan relación 4:3 en escritorio y una relación más panorámica en móvil; el precio queda junto a reseñas, sin empujarse al fondo de la tarjeta. |
| Notificaciones | La ruta REST autenticada consulta D1 con cursor `since`; el panel de pagos hace polling. No existen Durable Objects/WebSockets en la configuración actual. ADR-0011 conserva la propuesta original como diseño futuro. |
| Facturas | El adaptador actual almacena y sirve HTML/CSS de impresión desde R2. No genera un PDF binario en el Worker. |
| Envíos | La zona local del comercio es Medellín y los diez municipios del Valle de Aburrá. Los destinos nacionales, cobertura y tarifas se consultan a MiPaquete. Configuración de transportadora, empaques, seguimiento e impresión son secciones administrativas distintas. |
| Guías MiPaquete | El código contempla cotización, creación idempotente, consulta/sincronización y captura de impresión. Una respuesta ambigua sin coincidencia confirmada bloquea un segundo despacho. La existencia de los flujos y sus pruebas no acredita por sí sola una guía real procesada de punta a punta; esa aceptación sigue pendiente en Fase 12/Fase 13. |
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

### Verificación de autenticación desplegada (2026-10-16)

El titular configuró `TURNSTILE_SITE_KEY`, `TURNSTILE_HOSTNAMES` y el secreto `TURNSTILE_SECRET_KEY` en Cloudflare para `vega.jnmtortas.com`. El Worker presenta el widget y comprueba `siteverify`; acepta la URL configurada normalizándola a hostname y la compara con la respuesta firmada de Cloudflare. Pruebas automatizadas cubren token correcto, token rechazado y hostname; las tres rutas desplegadas fueron consultadas con token inválido y respondieron HTTP 400 antes de registrar o iniciar sesión. Esto no cierra la certificación de seguridad global.

La cuenta de correo usada en el intento de alta ya existía en D1 de producción, por lo que el registro duplicado fue rechazado; se mejoró la respuesta para dirigir al cliente al login. No se creó otra cuenta ni se repitió el registro con una dirección nueva. El logout de cliente quedó desplegado con `ed0b898`: POST al endpoint de logout, revocación en servidor y expiración de cookie. No hubo cambios D1 ni migración.


## Fase 12 — estado consolidado (2026-10-22)

### Implementado y probado
- **Reseñas:** elegibilidad por compra, separación entre clientes, validación/duplicados y persistencia/agregados tienen pruebas automatizadas; el roadmap registra también la gestión administrativa como implementada.
- **Lista de deseos:** pruebas unitarias, de controlador y de persistencia/aislamiento; el propietario comprobó manualmente en producción el flujo añadir/listar/quitar y confirmó que la migración D1 estaba aplicada.
- **Productos relacionados y guías textuales:** las capacidades están implementadas en la ficha del producto; las guías pueden enlazar artículos publicados del blog.
- **Seguimiento de pedidos:** las pruebas cubren autorización/privacidad y persistencia; las pantallas de cliente y administración están implementadas.
- **Búsqueda del catálogo:** autocompletado accesible, filtros y ordenamiento de servidor están integrados y desplegados. El propietario confirmó en producción que los filtros funcionan. En la PR #5 pasaron localmente typecheck, lint, 193 pruebas unitarias y 24 pruebas de Workers.
- **Inventario operativo:** stock desde Productos sincronizado con confirmación explícita, preservación de reservas y protección contra reducir el stock por debajo de las unidades reservadas; cubierto por pruebas unitarias y de Workers. Integrado en `main` mediante PR #6; falta despliegue y aceptación funcional en producción.

### Pendiente; no marcar como validado todavía
- **Aceptación E2E con pedido y guía reales:** comprobar en conjunto pago/estado de pedido, creación e impresión de la guía, email recibido, tracking real de transportadora y control de acceso.
- **Multidioma y `hreflang`.**
- **Recuperación de carritos abandonados y campañas comerciales por email** (los correos transaccionales de pedido/guía no equivalen a campañas ni a recuperación de carrito).
- **Fidelización y gift cards.**
- **Extracción de módulos a Workers propios:** diferida hasta que exista una necesidad real que la justifique.

### Estado de CI
La validación local de la PR #5 pasó, pero GitHub Actions reportó fallo en los jobs de Gitleaks y lint/arquitectura sin pasos ni logs accesibles. No se debe describir la CI remota como aprobada. El despliegue de Cloudflare sí finalizó correctamente y el propietario confirmó el funcionamiento de los filtros en producción.

## Documentos fuente

- Contratos: `AGENTS.md`, arquitectura, `SECURITY_RULES.md`, `ROLLBACK_RECOVERY.md`.
- Alcance y rutas: `README.md`.
- Fases y tareas: `ROADMAP.md`.
- Historial de trabajo: `AUDIT_PROGRESS.md`.
- Decisiones: `docs/adr/`.
- Esquema D1: `docs/migrations/schema-audit.md`; aplicación por entorno: `docs/migrations/manifest.md`.
