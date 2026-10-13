# Reglas de seguridad del Ecommerce

Estas reglas son **obligatorias** para cada implementación, tanto humana como de agentes de IA. Cada regla tiene un ID (`SEC-XXX-NN`) que el [`ROADMAP.md`](./ROADMAP.md) referencia en cada fase.

> **Jerarquía de documentos:** la separación de módulos, capas y comunicación se rige por el contrato [`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md). Este documento **añade** requisitos de seguridad y no relaja ninguna regla de ese contrato. La recuperación ante fallos se rige por [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md). Contexto general: [`README.md`](./README.md).

Si una tarea no puede cumplir una regla, la excepción se documenta en el PR (y en un ADR si es estructural) y se aprueba explícitamente. Nunca se omite en silencio.

## Modelo de amenaza resumido

Es una tienda pública con clientes anónimos y registrados, un panel de administración y dinero de por medio. Los atacantes principales son:

1. **Otro cliente autenticado** que intenta ver o modificar pedidos, direcciones, carritos o cuentas de crédito ajenos (IDOR/BOLA).
2. **Bots y fraude:** fuerza bruta y *credential stuffing*, abuso del registro, *card testing* (pruebas de tarjetas robadas en el checkout), abuso de cupones, acaparamiento de stock, *scraping*.
3. **Manipulación de compra:** alterar precios, descuentos, envío o método de pago desde el cliente; webhooks de pago falsificados o repetidos.
4. **Cuenta de administrador comprometida** (phishing, contraseña reutilizada) o permisos excesivos.
5. **Contenido inyectado:** XSS desde el CMS, anuncios, banners o campos de producto; redirecciones abiertas.
6. **Errores propios:** secretos filtrados, caché que mezcla datos privados con públicos, configuraciones laxas, PII en logs.

---

## 1. Aislamiento entre clientes (ISO)

`GET /api/v1/settings` expone configuración privada de la tienda (incluidos datos legales) y debe exigir una sesión administrativa válida con `settings:read`. El storefront público debe usar únicamente los endpoints públicos de contenido; no debe reutilizar este endpoint administrativo.

- **SEC-ISO-01** El `customerId` / `adminId` se obtiene **únicamente de la sesión validada en el servidor**. Nunca de la URL, el body, headers ni cookies no firmadas.
- **SEC-ISO-02** Toda consulta sobre datos propiedad de un cliente (direcciones, carritos, pedidos, pagos, cuentas y cuotas de crédito) se limita al actor de la sesión usando la columna de propiedad del módulo (`customer_id`). Las búsquedas por ID **siempre** combinan el identificador del recurso con el filtro de propiedad; un ID recibido del cliente nunca basta. Cada repositorio vive en su módulo y solo accede a tablas de su prefijo; está prohibido SQL suelto en rutas, gateways o módulos ajenos.
- **SEC-ISO-03** Un recurso ajeno responde **404** (no 403) para no revelar su existencia.
- **SEC-ISO-04** Los identificadores públicos de pedidos y recursos sensibles no son secuenciales ni adivinables (UUID/ULID o número de pedido + comprobación de propiedad). El número secuencial, si existe, es solo de presentación.
- **SEC-ISO-05** Carritos e invitados: el carrito de invitado se identifica con un token aleatorio (≥ 32 bytes, guardado con hash) en cookie `__Host-cart`; el seguimiento de pedidos de invitado exige un token no adivinable (y expira). Al iniciar sesión el carrito se fusiona en el servidor.
- **SEC-ISO-06** Toda funcionalidad nueva incluye al menos una **prueba automatizada de acceso cruzado** (cliente A intenta leer/modificar/cancelar recursos de cliente B y falla).
- **SEC-ISO-07** Los administradores **no** son clientes: sesiones, cookies, audiencias y tablas separadas (`identity_admins` vs `identity_customers`). Un token de cliente jamás abre rutas `/admin`.

## 2. Autenticación y contraseñas (AUTH)

- **SEC-AUTH-01** Contraseñas con PBKDF2-SHA-256 (Web Crypto) a **100.000 iteraciones** (máximo permitido en Workers), sal aleatoria de 16 bytes por usuario y parámetros versionados para poder migrar.
- **SEC-AUTH-02** Comparación de hashes/tokens en tiempo constante.
- **SEC-AUTH-03** Política: mínimo 12 caracteres, rechazar contraseñas triviales o filtradas conocidas, máximo razonable (p. ej. 128) para evitar abuso de CPU.
- **SEC-AUTH-04** Mensajes genéricos en login y recuperación ("credenciales inválidas", "si el correo existe, te enviamos instrucciones"). No revelar si un correo existe.
- **SEC-AUTH-05** Correo normalizado (minúsculas, recortado) y único.
- **SEC-AUTH-06** Registro de clientes abierto, pero con Turnstile, rate limiting y verificación de correo antes de operaciones sensibles (p. ej. compra a crédito).
- **SEC-AUTH-07** Turnstile obligatorio en registro, login, recuperación de contraseña y formularios públicos, verificado en el servidor.
- **SEC-AUTH-08** Recuperación de contraseña: token aleatorio de un solo uso, guardado con hash, expiración corta (≤ 1 h); al usarlo se invalidan las sesiones del usuario.
- **SEC-AUTH-09** **Administradores:** autenticación multifactor (TOTP) obligatoria antes del lanzamiento. Bloqueo progresivo por intentos fallidos.

## 3. Sesiones (SES)

- **SEC-SES-01** Token de sesión opaco y aleatorio de 32 bytes (`crypto.getRandomValues`). En D1 se guarda **solo su hash SHA-256**, nunca el token.
- **SEC-SES-02** Cookies: clientes `__Host-session`, administradores `__Host-admin-session`; ambas `HttpOnly; Secure; SameSite=Lax; Path=/` y **sin `Domain`**. Tienda y panel se sirven en orígenes distintos, por lo que no comparten cookies.
- **SEC-SES-03** Expiración absoluta e inactividad: clientes (p. ej. 14 días / 7 días), **administradores más estrictas** (p. ej. 8 h / 30 min). Logout invalida la sesión en el servidor.
- **SEC-SES-04** Rotar la sesión al iniciar sesión y al cambiar contraseña/correo; esas acciones cierran las demás sesiones.
- **SEC-SES-05** Peticiones que modifican datos: verificar `Origin` contra los orígenes propios como defensa CSRF, además de `SameSite`.
- **SEC-SES-06** Re-autenticación para acciones críticas de administración (ver SEC-ADM-04).

## 4. Entrada y validación (VAL)

- **SEC-VAL-01** Validar con Zod **todo** body, query y parámetro; rechazar campos desconocidos (`.strict()`).
- **SEC-VAL-02** SQL siempre con parámetros enlazados (`.bind()`); prohibido concatenar strings, incluidos filtros, orden y búsqueda (FTS5 con consulta saneada).
- **SEC-VAL-03** Slugs, nombres y SKU: longitud máxima, sin caracteres de control, sin `/`, `\` ni `..`.
- **SEC-VAL-04** Límites de tamaño en cuerpos JSON y de cantidad/profundidad en listados; **paginación obligatoria** con tope máximo.
- **SEC-VAL-05** Salida HTML siempre escapada; prohibido `innerHTML`/`set:html` con datos no confiables (ver SEC-CMS).
- **SEC-VAL-06** Importes en enteros (centavos COP), nunca `float`; cantidades enteras positivas con tope.

## 5. Integridad de pedidos y precios (ORD)

- **SEC-ORD-01** El servidor **recalcula** precios, descuentos, cupones, impuestos, envío y elegibilidad de método de pago en cada paso del checkout. Los totales enviados por el cliente se ignoran.
- **SEC-ORD-02** El checkout usa una **clave de idempotencia**: un doble envío no crea dos pedidos ni dos cobros.
- **SEC-ORD-03** Los *snapshots* de productos y precios en `orders_items` son inmutables tras crear el pedido.
- **SEC-ORD-04** Las transiciones de estado (`placed → confirmed → shipped → …`) se validan en el **dominio** (máquina de estados) y solo por actores autorizados.
- **SEC-ORD-05** El canje de cupones es **atómico** (límite global y por cliente verificados en una operación) y está protegido contra fuerza bruta (rate limit + respuestas indistinguibles).
- **SEC-ORD-06** La reserva de stock usa actualización condicional atómica (`UPDATE … WHERE stock >= ?`) o Durable Object; las reservas expiran por Cron.
- **SEC-ORD-07** Las reglas de contra entrega, cobertura de envío y crédito (README §5.1) se evalúan en el dominio de `orders`, nunca en el BFF ni en el frontend.

## 6. Pagos: Wompi y contra entrega (PAY)

- **SEC-PAY-01** Los datos de tarjeta **nunca** tocan nuestro Worker ni nuestros logs: el pago se hace en el checkout/widget de Wompi. Prohibido almacenar o registrar PAN, CVV o equivalentes.
- **SEC-PAY-02** Monto, moneda y referencia se generan **en el servidor** a partir del pedido; la firma de integridad se calcula en el servidor con el secreto de integridad.
- **SEC-PAY-03** Webhook `POST /api/v1/webhooks/wompi`: verificar el SHA-256 checksum según las propiedades firmadas, timestamp y secreto Wompi (comparación en tiempo constante); validar tiempo, consultar la transacción autenticadamente en la API Wompi y comparar id, referencia, monto y moneda. Como Wompi no garantiza un id de evento estable, deduplicar por checksum y hacer idempotentes también el estado/outbox financiero.
- **SEC-PAY-04** Antes de una transición financiera (pedido pagado), **reconciliar con la API de Wompi** y verificar que estado, monto en centavos, moneda y referencia coinciden con el pedido. Si no coinciden, no se transiciona y se marca para revisión.
- **SEC-PAY-05** Nunca se confirma un pago por la redirección del navegador; la página de retorno solo muestra el estado leído del servidor.
- **SEC-PAY-06** Credenciales de **sandbox y producción separadas**; secretos solo en Cloudflare Secrets; rotación periódica.
- **SEC-PAY-07** Reembolsos y anulaciones: solo administradores con permiso, re-autenticación y registro de auditoría.
- **SEC-PAY-08** Contra entrega: el recaudo solo lo registra un rol autorizado, el monto debe coincidir con el pedido y queda auditado.
- **SEC-PAY-09** Anti *card testing*: rate limit por IP, cliente y pedido en la creación de pagos; límite de intentos por pedido; Turnstile para invitados; alerta ante rachas de rechazos.
- **SEC-PAY-10** Crédito: calendario de cuotas, intereses y mora se calculan solo en el servidor; los abonos se validan contra la cuota (`installment_id`) y su saldo.

## 7. Administración (ADM)

- **SEC-ADM-01** **Denegar por defecto:** cada ruta `/api/v1/admin/*` exige autenticación de administrador **y** un permiso RBAC concreto (`recurso:acción`), verificado en el servidor. Ocultar un botón no es autorización.
- **SEC-ADM-02** Roles con privilegios mínimos (Superadmin, Editor, Ventas, Soporte, …); la asignación de roles es una acción crítica. No se puede eliminar ni degradar al último Superadmin.
- **SEC-ADM-03** Toda mutación administrativa se registra en `audit` (quién, qué, cuándo, IP, antes/después sin datos sensibles).
- **SEC-ADM-04** Acciones críticas con **re-autenticación**: reembolsos, cambio de roles, cambio de credenciales de pago o de plantillas de email, borrados masivos, exportaciones de clientes.
- **SEC-ADM-05** El panel puede protegerse con **Cloudflare Access** como capa adicional; no sustituye los controles de la aplicación.
- **SEC-ADM-06** Las exportaciones (CSV de clientes/pedidos) requieren permiso específico, se auditan y no incluyen más PII de la necesaria.

## 8. Contenido, CMS y SEO (CMS)

- **SEC-CMS-01** El texto enriquecido y HTML del CMS, banners, anuncios y descripciones de producto se **sanitizan con lista blanca** al guardar y se tratan como no confiables al renderizar. Prohibidos bloques de `<script>` o HTML arbitrario.
- **SEC-CMS-02** Los scripts de analítica/píxeles no se pegan como código libre: se configuran por **proveedor permitido + ID**, y la CSP solo autoriza esos dominios.
- **SEC-CMS-03** El JSON-LD se serializa de forma segura (escapar `<`, `>`, `&` y `U+2028/2029`) para que ningún dato rompa el `<script type="application/ld+json">`.
- **SEC-CMS-04** Las redirecciones gestionables (301/302) solo aceptan destinos **relativos o de dominios propios**; prohibidas las redirecciones abiertas.
- **SEC-CMS-05** Las URLs de enlaces y CTA aceptan solo esquemas `https`, `mailto` y `tel` (nunca `javascript:` ni `data:`).
- **SEC-CMS-06** Slugs únicos y validados; cambiar un slug crea una redirección, no deja enlaces rotos ni colisiones con rutas reservadas (`/admin`, `/api`, `/cuenta`…).

## 9. Almacenamiento y medios en R2 (R2)

- **SEC-R2-01** Bucket **privado**: sin dominio público ni `r2.dev` habilitado. Los medios de producto se sirven **a través del Worker** (ruta `/media/*`, cacheada), no por acceso directo a R2.
- **SEC-R2-02** Permisos mínimos del binding limitados a este bucket; solo `infrastructure/storage/r2` del módulo `media` lo usa. Rotación de credenciales si se usan tokens S3.
- **SEC-R2-03** Las claves las genera el servidor (`media/{uuid}`; `private/u/{customerId}/{uuid}` para documentos privados). El nombre original del archivo vive en D1, **nunca** en la clave.
- **SEC-R2-04** Solo administradores con permiso suben medios. Validar por **firma real del archivo** (magic bytes), tipo permitido (JPEG, PNG, WebP, AVIF), tamaño máximo y dimensiones. El límite configurado es 10 MiB, 16.384 px por lado y 40 MP; el cuerpo multipart se limita a 11 MiB incluso en streaming. **SVG excluido** salvo sanitización explícita. Eliminar metadatos EXIF/GPS.
- **SEC-R2-05** Prefijos privados (documentos de clientes, p. ej. para crédito) **nunca** se sirven por la ruta pública; cada acceso verifica propiedad en D1 y responde con `Content-Disposition: attachment`.
- **SEC-R2-06** Respuestas de archivos con `X-Content-Type-Options: nosniff`; sin listado de objetos; sin CORS hacia el navegador.
- **SEC-R2-07** Verificar el tamaño real con `HEAD` tras subir; si excede el límite, borrar y rechazar. Limpieza por Cron de subidas huérfanas.
- **SEC-R2-08** Verificar consistencia entre metadatos D1 y objetos R2 antes de reanudar operaciones críticas tras un incidente.

Estado de implementación: el Worker verifica estructura de contenedores/cabeceras y CRC de chunks PNG, además de extraer dimensiones; no ejecuta decodificación completa de píxeles ni elimina EXIF/GPS todavía. Esos dos controles permanecen pendientes de certificación y no deben marcarse como cumplidos.

## 10. Frontend (FE)

- **SEC-FE-01** Tienda y panel no contienen lógica de negocio ni autorización: presentan y llaman a la API. El servidor es la fuente de verdad (precios, stock, cupones, elegibilidad).
- **SEC-FE-02** Los bundles no incluyen secretos, claves privadas, SDKs de R2/S3 ni configuración de infraestructura. Solo se exponen claves públicas imprescindibles (p. ej. llave pública de Wompi, *site key* de Turnstile).
- **SEC-FE-03** La tienda con SSR no filtra datos privados en el HTML ni en el estado serializado de hidratación.
- **SEC-FE-04** Los frontends consumen la API desde el **mismo origen** (`/api` en cada host); sin CORS abierto.

## 11. Fronteras modulares y D1 única (MOD)

Complementa el contrato de arquitectura (§0, §3, §6.1, §10, §20).

- **SEC-MOD-01** Un módulo solo se comunica con otro mediante su `module.public-api.ts` a través de un **Gateway**, o por **Queues**. Prohibidos imports de `domain`, `application`, `infrastructure` o repositorios de otro módulo.
- **SEC-MOD-02** `env.DB` es única, pero cada módulo solo lee y escribe tablas de su prefijo. Prohibidos JOINs, subconsultas, vistas, triggers, FKs y `db.batch()` entre prefijos; una referencia entre módulos es un valor (`TEXT`), no una FK.
- **SEC-MOD-03** CI ejecuta el lint/test de arquitectura que bloquea imports internos y SQL que mencione el prefijo de otro módulo.
- **SEC-MOD-04** Controladores y gateways del BFF no contienen reglas de negocio ni acceden a D1, R2 o KV. El actor se deriva de la sesión del backend, nunca de `customerId`, rol o permisos enviados por el cliente.

## 12. Cabeceras, CORS y transporte (WEB)

- **SEC-WEB-01** Frontend y API desde el **mismo origen** por host; sin CORS abierto. Si hiciera falta, lista blanca exacta, nunca `*` con credenciales.
- **SEC-WEB-02** Cabeceras en todas las respuestas (Worker y Pages): `Content-Security-Policy` estricta, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `Permissions-Policy` mínima.
- **SEC-WEB-03** Solo HTTPS; "Always Use HTTPS" activo y redirección forzada.
- **SEC-WEB-04** Respuestas con datos autenticados o privados: `Cache-Control: no-store`.
- **SEC-WEB-05** **Caché pública sin datos personales:** las respuestas cacheables (Cache API/KV) no dependen de cookies ni incluyen datos del cliente; la clave de caché ignora cookies; las rutas personalizadas nunca se cachean.
- **SEC-WEB-06** La CSP solo autoriza los dominios estrictamente necesarios (Turnstile, el widget/checkout de Wompi según el modo elegido, proveedores de analítica permitidos). Registrar cada excepción y su justificación.

## 13. Límite de peticiones y abuso (RATE)

- **SEC-RATE-01** Rate limiting por IP y por actor en: login, registro, recuperación de contraseña, validación de cupones, creación de pedidos/pagos, búsqueda y formularios públicos.
- **SEC-RATE-02** Bloqueo temporal progresivo tras intentos fallidos de login.
- **SEC-RATE-03** Límites en operaciones costosas (exportaciones, subidas, reportes) y en envío de emails por destinatario.
- **SEC-RATE-04** Reglas WAF y *bot management* de Cloudflare activos sobre el dominio y las rutas sensibles.

## 14. Email con Resend (MAIL)

- **SEC-MAIL-01** Dominio de envío verificado con SPF, DKIM y DMARC.
- **SEC-MAIL-02** El webhook de Resend se verifica criptográficamente; los eventos se procesan de forma idempotente.
- **SEC-MAIL-03** Las variables de las plantillas se escapan; el cliente nunca controla `From`, `Reply-To`, destinatarios adicionales ni cabeceras (anti inyección de cabeceras).
- **SEC-MAIL-04** Los emails no contienen contraseñas, tokens de larga vida ni datos sensibles innecesarios; los enlaces de verificación/recuperación son de un solo uso y expiran.
- **SEC-MAIL-05** Envío mediante Queue con idempotencia: los reintentos no duplican correos transaccionales.
- **SEC-MAIL-06** Correos de marketing solo con consentimiento y enlace de baja funcional.

## 15. Privacidad y datos personales (PRIV)

- **SEC-PRIV-01** Recoger solo la PII necesaria; los datos especialmente sensibles (documento de identidad, teléfono, dirección) se tratan como sensibles: no aparecen en URLs ni logs y se limitan en exportaciones.
- **SEC-PRIV-02** Política de retención y flujo de **acceso, rectificación y eliminación/anonimización** de datos del cliente, respetando obligaciones contables y fiscales sobre pedidos.
- **SEC-PRIV-03** Consentimiento registrado para marketing y, cuando aplique, cookies/analítica; páginas de políticas de privacidad y términos gestionadas en el CMS.
- **SEC-PRIV-04** Revisión legal de la normativa de protección de datos aplicable (por ejemplo, la Ley 1581 de 2012 si se opera en Colombia) y de las condiciones de venta a crédito antes del lanzamiento.

## 16. Secretos y configuración (SEC)

- **SEC-SEC-01** Ningún secreto en el repositorio, `wrangler.jsonc`, logs ni frontend. Se usan Cloudflare Secrets / variables de entorno: claves JWT/HMAC, Wompi (privada, integridad, eventos), Resend, Turnstile.
- **SEC-SEC-02** `.gitignore` incluye `.dev.vars`, `.env*`, `node_modules`, `.wrangler`.
- **SEC-SEC-03** Escaneo de secretos en CI (p. ej. gitleaks) y protección de la rama `main` con revisión obligatoria.
- **SEC-SEC-04** Si un secreto se filtra: rotarlo de inmediato, revisar logs de acceso y, si es de pagos, reconciliar transacciones.
- **SEC-SEC-05** Entornos aislados (dev, staging, production) con recursos y secretos independientes; Wompi sandbox y Resend de prueba fuera de producción.

## 17. Registro, auditoría y observabilidad (LOG)

- **SEC-LOG-01** Registrar eventos de seguridad (login correcto/fallido, registro, cambios de contraseña, acciones admin, pagos, reembolsos, cambios de roles) con actor, IP y fecha, en logs JSON estructurados con `trace_id`.
- **SEC-LOG-02** Nunca registrar contraseñas, tokens, datos de tarjeta, secretos, cuerpos de petición sensibles ni PII innecesaria (§12 del contrato).
- **SEC-LOG-03** Los errores al cliente son genéricos; el detalle va solo a logs internos.
- **SEC-LOG-04** Alertas sobre: rachas de login fallido, rechazos de pago anómalos, firmas de webhook inválidas, DLQ con mensajes y picos de 5xx.

## 18. Dependencias y cadena de suministro (DEP)

- **SEC-DEP-01** Mínimo de dependencias; versiones fijadas con lockfile.
- **SEC-DEP-02** Auditoría (`pnpm audit`/Dependabot) activa; revisar antes de actualizar.
- **SEC-DEP-03** Preferir APIs nativas de Workers y Web Crypto antes que librerías de terceros.
- **SEC-DEP-04** Scripts de terceros en el navegador solo si son imprescindibles, con versión fija y permitidos explícitamente en la CSP.

---

## Checklist de Pull Request

Marca cada punto (si no aplica, indica "N/A" y por qué):

- [ ] Leí el contrato de arquitectura y el cambio lo respeta (módulos, capas, 200 líneas, Gateways).
- [ ] El `customerId`/`adminId` proviene solo de la sesión y las consultas filtran por propiedad (SEC-ISO-01, SEC-ISO-02).
- [ ] Añadí pruebas de acceso cruzado (SEC-ISO-06).
- [ ] Toda entrada nueva está validada con Zod y el SQL usa parámetros (SEC-VAL-01, SEC-VAL-02).
- [ ] Los importes se calculan en el servidor y en enteros (SEC-ORD-01, SEC-VAL-06).
- [ ] Los endpoints admin exigen permiso RBAC y registran auditoría (SEC-ADM-01, SEC-ADM-03).
- [ ] Los webhooks verifican firma, son idempotentes y se reconcilian (SEC-PAY-03, SEC-PAY-04).
- [ ] El frontend no contiene lógica de negocio ni secretos (SEC-FE-01, SEC-FE-02).
- [ ] El BFF usa Gateways; no importa internals, SQL, D1, R2 ni KV (SEC-MOD-01, SEC-MOD-04).
- [ ] Solo uso tablas de mi prefijo, sin JOIN, FK ni batch cruzado, y pasa el lint de fronteras (SEC-MOD-02, SEC-MOD-03).
- [ ] El contenido editable se sanitiza y las URLs/redirecciones se validan (SEC-CMS-01, SEC-CMS-04, SEC-CMS-05).
- [ ] Los endpoints nuevos tienen rate limiting (SEC-RATE-01).
- [ ] No hay secretos, tokens, datos de tarjeta ni PII en código, logs ni respuestas (SEC-SEC-01, SEC-LOG-02).
- [ ] Las respuestas cacheables no contienen datos personales (SEC-WEB-05).
- [ ] Cabeceras y CORS siguen cumpliéndose (SEC-WEB-01, SEC-WEB-02).
- [ ] Errores genéricos hacia el cliente (SEC-LOG-03, SEC-AUTH-04).
- [ ] Dependencias nuevas justificadas y auditadas (SEC-DEP-01, SEC-DEP-02).
- [ ] Si el cambio toca D1, colas o R2, es compatible con un rollback según [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md).

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad, no abras un issue público: contacta directamente al propietario del repositorio.

---

## 19. Certificación y matriz de regresión

**Estado de certificación: PENDIENTE.** Que el Worker se despliegue, que D1 coincida con las migraciones y que `/health` responda no demuestra que los controles estén implementados ni que hayan superado pruebas negativas. Un punto solo se marca como completado cuando existe una prueba automatizada reproducible o evidencia documentada; una casilla marcada a mano no ejecuta ni demuestra el control.

Los controles de módulos que aún no existen (por ejemplo, `credit` antes de su fase) son **requisitos futuros**, no controles aprobados.

#### Arquitectura y entradas

- [ ] Las rutas no pueden saltarse Gateways, APIs públicas o casos de uso ni acceder directamente a D1/R2/KV.
- [ ] Entradas malformadas, IDs inválidos, campos desconocidos y valores fuera de límites se rechazan en el servidor.
- [ ] Los errores públicos no revelan secretos, tokens, consultas, trazas ni detalles internos.

#### Autenticación, sesiones y administración

- [ ] Sesiones ausentes, inválidas, vencidas y revocadas se rechazan; logout invalida la sesión en el servidor.
- [ ] Un token de cliente no abre rutas de administración y viceversa.
- [ ] Cada ruta admin verifica permiso RBAC; las pruebas de escalada de privilegios fallan como se espera.
- [ ] MFA de administradores y re-autenticación en acciones críticas funcionan.
- [ ] Fijación de sesión: la sesión se rota al login y al cambiar contraseña.

#### Aislamiento de clientes

- [ ] Pruebas IDOR/BOLA: un cliente no lee, modifica ni cancela pedidos, direcciones, carritos, pagos o cuentas de crédito de otro.
- [ ] Un carrito o pedido de invitado no es accesible sin su token.
- [ ] Las pruebas concurrentes demuestran que solicitudes paralelas no eluden propiedad, cupos o límites.

#### Pedidos y pagos

- [ ] Alterar precio, descuento, envío o método de pago desde el cliente no cambia el total cobrado.
- [ ] Un doble envío del checkout no crea dos pedidos ni dos cobros.
- [ ] Un webhook de Wompi con firma inválida, repetido, desordenado o con monto/referencia distintos no cambia el estado del pedido.
- [ ] La confirmación de pago exige reconciliación con Wompi; la redirección del navegador no confirma nada.
- [ ] Un cupón no se puede canjear por encima de su límite ni por fuerza bruta.
- [ ] Peticiones concurrentes no producen sobreventa de stock.
- [ ] Contra entrega solo se ofrece cuando todos los productos y la zona lo permiten; los productos locales se rechazan fuera de su cobertura.
- [ ] Los límites anti *card testing* se activan con solicitudes reales.

#### Contenido y medios

- [ ] Un payload XSS en CMS, banners, anuncios y productos no se ejecuta en tienda ni en panel.
- [ ] Las redirecciones no admiten destinos externos ni esquemas peligrosos.
- [ ] Subidas con extensión/tipo falsificado, SVG o archivos sobredimensionados se rechazan; no hay acceso a prefijos privados por la ruta pública.
- [ ] El JSON-LD no puede romper su etiqueta con datos hostiles.

#### Abuso, privacidad y despliegue

- [ ] El rate limiting se prueba con solicitudes reales (auth, cupones, pagos, formularios).
- [ ] Se valida `Origin` y las defensas CSRF en operaciones con cookies que modifican estado.
- [ ] Ninguna respuesta cacheable contiene datos personales; las rutas privadas usan `no-store`.
- [ ] Tokens, secretos, datos de tarjeta y PII no aparecen en URLs, respuestas públicas ni logs.
- [ ] Las cabeceras de seguridad están presentes en Worker y Pages y la CSP no rompe flujos legítimos (Turnstile, Wompi).
- [ ] Escaneo de secretos y auditoría de dependencias se ejecutan en CI.
- [ ] Los webhooks de Wompi y Resend funcionan en staging con sandbox y se verifican en producción.
- [ ] La verificación de producción comprueba salud y flujos críticos; el endpoint de salud por sí solo no certifica seguridad.

### Evidencia y cierre

Para cada punto certificado, registrar la prueba o comando, el resultado, el commit revisado y, en verificaciones productivas, la fecha y el entorno. No incluir tokens, datos privados ni secretos en la evidencia. Los fallos permanecen como pendientes hasta corregirlos y volver a ejecutar las pruebas.

La certificación global solo se declara completa cuando todos los controles aplicables han pasado, las excepciones están justificadas y las pruebas se ejecutaron contra el commit que se va a desplegar.

## Hallazgos de auditoría (2026-10-12)

Se añadieron comprobaciones server-side a las rutas CRUD de storefront, mutación de settings y creación de redirecciones SEO. `AuthMiddleware` y `Role.hasPermission` interpretan `recurso:*` como permisos del recurso, además de conservar `*` global y la denegación por defecto. La consulta de pedidos aplica ownership de sesión o permiso de lectura de pedidos. Las rutas de notificaciones limitan canal/recipiente al actor autenticado y restringen el marcado de lectura a notificaciones que ya puede consultar.

El catálogo público fuerza el estado `published`; el estado enviado por query ya no habilita borradores. Las rutas públicas de estado de pedido no muestran datos de contacto o dirección. La inicialización de Wompi falla cerrada si faltan llaves; el webhook comprueba el checksum y reconcilia contra la API Wompi antes de aplicar el estado. El recaudo COD requiere permiso, método COD, estado no recaudado y monto entero igual al total. La ruta de factura ahora requiere sesión y ownership o permiso administrativo; inventario, auditoría y notas crédito aplican permisos en el servidor.

La sesión de login ya no se devuelve en JSON ni se inyecta en el HTML/localStorage; el panel usa las cookies `HttpOnly`. El resultado y el inicio de pago de pedidos invitados requieren posesión del cookie de carrito validado, comparando un hash almacenado; el resultado se marca `private, no-store`. La carga del panel precarga datos según los permisos del administrador. Los errores BFF y logs evitan propagar texto interno, payloads o PII; `JsonLogger` conserva correlación por `trace_id` y redacciona campos sensibles.

Se implementó CSRF por Origin/Sec-Fetch-Site en mutaciones con sesión y rate limits por IP para autenticación, inicio de pago/checkout y otras escrituras. El limiter es defensa contra abuso aproximada; faltan límites por actor/pedido, Turnstile donde aplique y prueba de carga/despliegue. Las pruebas verifican el webhook con firma estándar y API simulada dentro del Worker local, pero no reemplazan el evento real de sandbox de Wompi. MFA/reautenticación, auditoría completa de toda mutación y validación de bindings contra la cuenta de producción siguen pendientes de certificación.


### Auditoría de checkout (2026-10-12)
El endpoint de creación de pedidos calcula importes en servidor con catálogo publicado, promociones/cupones, zona de envío activa e impuesto configurado; no utiliza precios ni totales recibidos del navegador. Se rechazan cantidades fuera de rango, productos no publicados y stock insuficiente. La reserva fallida cancela el pedido. La cobertura automatizada de cálculo se ejecuta con `node_modules/.bin/vitest run` desde `apps/api`.
