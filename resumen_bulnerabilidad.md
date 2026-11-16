# Informe de auditoría de seguridad — ecommerce-basic-cloudflare2 (Vega Store)

**Alcance:** revisión estática del código del Worker (`apps/api`, ~40 k líneas TS), `wrangler.jsonc`, migraciones, CI y el historial git. Contrastado contra las reglas `SEC-*` del propio `SECURITY_RULES.md`.
**Método:** lectura de código + búsqueda dirigida (SQL, XSS, secretos, rutas sin auth) + una prueba de concepto ejecutada en Chromium (H-01).
**No cubierto en la revisión inicial:** no se ejecutó la aplicación ni la suite de tests, no se probó contra staging/producción, no se auditaron `apps/storefront` y `apps/admin` (solo contienen `package.json`), ni los adaptadores Factus/MiPaquete/Resend en profundidad. En esa revisión no hubo acceso a red; `pnpm audit` se ejecutó después como parte de H-11.10.

---

## Resumen ejecutivo

La base es **notablemente sólida** para un proyecto de este tipo: SQL 100 % parametrizado, sesiones opacas con hash SHA-256, PBKDF2, comparaciones en tiempo constante, webhook de Wompi firmado y reconciliado contra la API, reserva de stock atómica, sanitización de HTML con lista blanca, CSRF por Origin, auditoría con bloqueo si falla. No encontré secretos en el árbol ni en el historial git.

Los problemas reales están en **los bordes de la autorización del admin, el panel admin (XSS) y la lógica de cupones**:

| ID | Sev. | Hallazgo |
|---|---|---|
| H-01 | **Alta** | XSS almacenado en el panel admin (escalada Editor → Superadmin). **Verificado con PoC.** |
| H-02 | **Alta** | Sesión de admin sin MFA completado puede leer pedidos, facturas y notificaciones (bypass de la compuerta MFA). |
| H-03 | **Alta** | Los cupones nunca registran su uso: límites global/por cliente inoperantes. (Remediado y verificado localmente.) |
| H-04 | Media | Cualquiera puede bloquear la cuenta Superadmin (DoS) con intentos fallidos. (Remediado y verificado localmente.) |
| H-05 | Media | Sin timeout por inactividad en sesiones (admin 30 min / cliente 7 d no se aplican). (Remediado y verificado localmente.) |
| H-06 | Media | CSP con `'unsafe-inline'` en `script-src`: anula la defensa en profundidad contra XSS. |
| H-07 | Media | Checkout de invitado sin Turnstile: acaparamiento de stock y abuso de correo. (Remediado localmente; pruebas focalizadas aprobadas, producción pendiente.) |
| H-08 | Media | TOTP reutilizable y enrolamiento sin límite de intentos. (Anti-replay, bloqueo y cifrado remediados localmente; aprovisionamiento y despliegue pendientes.) |
| H-09 | Media | Enumeración de cuentas, password spraying y falta de verificación/recuperación. (Remediado localmente; suite unitaria 84/287 y Workers 24/62 aprobadas, typecheck/lint/aislamiento aprobados; despliegue y migración de producción pendientes.) |
| H-10 | Baja | Acciones críticas sin re-autenticación (SEC-ADM-04). |
| H-11 | Baja | Varias deficiencias menores (ver sección final). |

---

## H-01 — XSS almacenado en el panel admin (Alta) ✔ verificado

**Dónde:** `bff/views/admin/renderCmsPageRows.ts`, `renderStorefrontBannerRows.ts`, `renderStorefrontAnnouncementRows.ts`, `renderCmsManagementSection.ts`, `renderStorefrontManagementSection.ts`; función `js()` / `escapeJs` / `escapeAdminJavaScriptString`.

**Causa:** los datos se meten en atributos `onclick="editCmsPage('…','${js(title)}',…)"`. `js()` escapa `\`, `'`, `"` y saltos de línea para **JavaScript**, pero el valor va dentro de un **atributo HTML**, y el navegador decodifica entidades (`&#39;`) *antes* de ejecutar el JS. Un título como:

```
x&#39;);window.__pwned=1;//
```

se convierte en `x');window.__pwned=1;//` dentro del handler y ejecuta código arbitrario al hacer clic en «Editar». Reproducido en Chromium (`XSS ejecutado: True`).

**Impacto:** un admin con permiso `cms:*`, `storefront:*` (rol **Editor**) planta código que se ejecuta en el navegador del **Superadmin**, con su sesión (las cookies son HttpOnly, pero el script hace `fetch` same-origin y actúa como él: cambiar credenciales de Factus/MiPaquete, exportar datos, crear notas crédito, etc.). Escalada de privilegios horizontal-a-vertical. Combinado con H-06, no hay mitigación de CSP.

**Corrección:** no construir handlers con interpolación. Usar `data-*` con `escapeHtml()` y `addEventListener` (delegación de eventos), p. ej. `<button data-action="edit" data-id="…" data-title="${e(title)}">` y leer `button.dataset.title`. Eliminar `js()`/`escapeJs`. Añadir un test que inyecte `&#39;`, `"`, `</script>` en cada campo.

**Estado de remediación (2026-11-15):** corregido en filas CMS y storefront, tanto en el render inicial como en las páginas cargadas por API. Las acciones usan atributos `data-*` escapados y delegación de eventos. Regresión verificada con `pnpm --filter @ecommerce/api test -- tests/admin-row-xss.test.ts` (2 pruebas); typecheck y lint de arquitectura también pasan.

---

## H-02 — Bypass de la compuerta MFA por rutas fuera de `/api/v1/admin/*` (Alta)

**Dónde:** `AdminMfaGateMiddleware` solo se aplica a `/api/v1/admin/*`. Estas rutas aceptan sesiones de admin pero **no comprueban `mfaEnabled`**:

- `GET /api/v1/orders/:orderId` (`OrdersController.ts`) → nombre, correo, teléfono, documento tributario y dirección de cualquier pedido.
- `GET /api/v1/invoices/:id/document` (`InvoicingController.ts`) → PDF de cualquier factura.
- `GET /api/v1/realtime/notifications` y `POST …/read` (`RealtimeController.ts`) → feed del canal `admin` (nombres, totales).

Un login solo con contraseña crea una sesión de 8 h «pendiente de MFA». `SEC-AUTH-09` dice que esa sesión **no puede leer ni mutar datos administrativos**; aquí sí puede leer PII.

**Impacto:** quien tenga solo la contraseña del admin (phishing, reutilización) exfiltra PII de clientes sin segundo factor. Los IDs de pedido no son secuenciales, pero el listado `/api/v1/admin/orders` está tras la compuerta; los IDs pueden obtenerse por el canal realtime (que sí está abierto).

**Corrección:** centralizar: en `validateSession` o en un helper común, devolver error si `actorType==='admin' && !mfaEnabled` salvo en las rutas de enrolamiento; o aplicar el middleware MFA a toda ruta que acepte sesión admin. Mejor aún: usar siempre `createAuthMiddleware` en vez de validaciones ad-hoc repetidas (hay al menos 8 variantes de `getSessionToken`/`hasPermission`, con semánticas de comodín ligeramente distintas).

**Estado de remediación (2026-11-15):** corregida la compuerta en lectura de pedidos, descarga de facturas y lectura/marcado de notificaciones. El criterio compartido falla cerrado si una sesión de admin no confirma MFA y se ejecuta antes de consultar los datos protegidos. Clientes conservan el acceso a sus propios recursos. Pruebas: `pnpm --filter @ecommerce/api test -- tests/admin-mfa-sensitive-routes.test.ts tests/admin-mfa-gate.test.ts` (9 pruebas); typecheck y lint de arquitectura pasan. La consolidación de todos los validadores ad-hoc mencionada en la corrección sugerida no forma parte de este arreglo puntual.

---

## H-03 — Cupones: el canje nunca se registra (Alta, lógica de negocio)

**Dónde:** `D1CouponRepository.recordRedemption()` existe y está en el puerto, pero **no se invoca en ningún punto del código de producción** (solo definición). No existe caso de uso de canje; el pedido solo llama `validateCoupon`.

**Impacto:** `maxUsesGlobal`, `maxUsesPerCustomer` y el contador `current_uses_count` nunca avanzan. Un cupón «de un solo uso» o con tope global se puede usar sin límite → pérdida económica directa. Incumple `SEC-ORD-05` (canje atómico). Además, para invitados `customerId` es `undefined`, por lo que el límite por cliente tampoco aplicaría aunque se registrara.

También: los mensajes de `validateCoupon` distinguen «no existe» de otras razones → enumeración de códigos (SEC-ORD-05 pide respuestas indistinguibles).

**Corrección:** reservar el cupo con una actualización condicional y registrar la redención atómicamente dentro de `promotions_*`, antes de crear el pedido con el mismo ID generado por servidor. Como el contrato prohíbe una transacción D1 entre `orders_*` y `promotions_*`, compensar liberando la reserva si falla la creación o se cancela el pedido; exigir sesión para límites por cliente y unificar el mensaje de error.

**Estado de remediación (2026-11-15; verificada localmente):** el diseño respeta el aislamiento de módulos: Promotions reserva el cupo con una actualización condicional y su registro de redención dentro de una transacción D1 únicamente de `promotions_*`; el pedido recibe el mismo ID generado por el servidor. No existe una transacción D1 entre `orders_*` y `promotions_*`: si falla la creación del pedido se compensa liberando la reserva; también se libera al cancelar durante checkout, por fallo de Wompi o desde administración. Las operaciones de reserva y liberación están vinculadas al ID del pedido y son idempotentes. Se eligió exigir sesión de cliente para cualquier cupón que tenga `maxUsesPerCustomer`; los cupones sin límite por cliente siguen disponibles para invitados. Todos los rechazos de validación usan un mensaje público indistinguible. La migración aditiva preserva la tabla anterior y los datos para rollback; no se ha aplicado en producción.

**Evidencia local:** pruebas D1 Worker de límite global concurrente, límite por cliente, guest, idempotencia, liberación/cancelación y rollback de cada sentencia; regresiones del checkout y Wompi; typecheck, lint de arquitectura, aislamiento de tablas y migraciones D1 desde esquema vacío (85 migraciones, segunda pasada idempotente). Comandos ejecutados:

- `pnpm --filter @ecommerce/api exec vitest run --config vitest.workers.config.ts tests/workers/coupon-order-checkout.test.ts tests/workers/promotions-redemptions.test.ts tests/workers/orders-aggregate-atomicity.test.ts tests/workers/runtime.test.ts`
- `pnpm --filter @ecommerce/api exec vitest run tests/guest-payment-ownership.test.ts tests/wompi-webhook.test.ts`
- `pnpm --filter @ecommerce/api typecheck`
- `pnpm --filter @ecommerce/api lint`
- `pnpm --filter @ecommerce/api test:isolation`
- `pnpm --filter @ecommerce/api db:test-wrangler-migrations`

---

## H-04 — Bloqueo de la cuenta Superadmin por cualquier atacante (Media)

**Dónde:** `LoginAdminUseCase`. Con credenciales configuradas por entorno (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) el usuario se resuelve con `findSoleActiveSuperadmin()` **ignorando el correo enviado**. Cada contraseña errónea llama `registerFailedAttempt()` sobre esa cuenta; a los 5 fallos se bloquea 15 min, y como el contador no se reinicia al bloquear, cada intento posterior vuelve a bloquear.

**Impacto:** sin conocer el correo del admin, un atacante con Turnstile resuelto (o un bot de resolución) mantiene al único Superadmin bloqueado de forma indefinida. Limitador actual: 20 req/min por IP.

**Corrección:** contar fallos por (IP, cuenta) además de por cuenta, bloquear solo por IP/dispositivo o usar retardo progresivo sin denegar al titular legítimo; exigir que el correo enviado coincida con `ADMIN_EMAIL` **antes** de registrar el fallo; alertar por correo ante bloqueos.

**Estado de remediación (2026-11-15):** el correo configurado se valida antes de buscar la cuenta; los fallos ya no bloquean el registro global del Superadmin y el límite temporal se aplica a la combinación de administrador y hash de `CF-Connecting-IP`. Al quinto fallo se registra el evento de seguridad y se envía una alerta idempotente por Resend. Evidencia local: `configured-admin-credentials.test.ts` (7 pruebas), `admin-login-ip-lockout.test.ts` (3 pruebas), typecheck, lint, aislamiento D1 y `db:test-wrangler-migrations` (86 migraciones, segunda pasada idempotente). No se verificó entrega de correo ni aplicación de v2 en producción.

---

## H-05 — Sesiones sin expiración por inactividad (Media)

`Session.isExpired()` solo mira `expiresAt`; `lastActiveAt` se actualiza (con una escritura en D1 **en cada petición autenticada**) pero nunca se usa para expirar. `SEC-SES-03` exige 30 min de inactividad para admin y 7 días para clientes. Un token robado sigue valiendo 8 h (admin) / 14 días (cliente) aunque la víctima esté inactiva.

**Corrección:** en `ValidateSessionUseCase`, rechazar si `now - lastActiveAt` supera el umbral por tipo de actor; actualizar `lastActiveAt` con granularidad (p. ej. solo si pasaron >60 s) para no escribir en cada request.

**Estado de remediación (2026-11-15):** `Session.isExpired()` ahora verifica expiración absoluta y por inactividad (admin: 30 minutos; cliente: 7 días). `ValidateSessionUseCase` actualiza `lastActiveAt` y persiste solo cuando han transcurrido más de 60 segundos. Regresión local: cinco pruebas unitarias cubren umbrales, actividad, granularidad y expiración absoluta; typecheck y lint de arquitectura aprobados.

---

## H-06 — CSP permite scripts en línea (Media)

**Estado de remediación local (2026-11-15):** se migraron los scripts inline para usar nonce criptográfico por respuesta (`script-src 'nonce-…' 'strict-dynamic'`), se estableció `script-src-attr 'none'` y se retiraron atributos de eventos HTML de las vistas para usar listeners. `img-src` quedó limitado a `'self' data:`. Las respuestas HTML llevan `Cache-Control: private, no-store` y no conservan `Cache-Tag`, evitando reutilizar un nonce en caché. Los banners aceptan rutas de imágenes locales. La prueba CSP verifica que no se reintroduzcan atributos de eventos en las vistas.

**Verificación reproducible local:** 261 pruebas de API pasaron (77 archivos); `typecheck`, lint de arquitectura (`200 líneas`, capas limpias e imports) y `git diff --check` pasaron. No se verificó despliegue ni comportamiento en producción. La caché SSR pública queda desactivada mientras HTML use nonces; ver [ADR-0033](./docs/adr/ADR-0033-csp-nonce-y-cache-html.md).

---

## H-07 — Checkout de invitado sin Turnstile (Media)

**Estado de remediación local (2026-11-15):** se exige Turnstile validado en el Worker para invitados antes de reservar recursos; los clientes autenticados no necesitan challenge. El carrito usa un ID aleatorio emitido por el servidor y una capacidad HMAC en `__Host-cart`; el `vega_cart_id` recibido no se adopta. Se aplican límites atómicos en D1 de 3 pedidos pendientes/IP, 2/correo y 2/carrito en 30 minutos, y 3 correos de pedido por destinatario en una hora. Los fingerprints guardados en D1 son HMAC, no IP/correo/carrito en claro.

**Verificación reproducible local:** suite API completa: 264 pruebas; pruebas focalizadas Workers para cuotas y checkout: 4 pruebas; `typecheck`, lint de arquitectura, aislamiento de tablas, migraciones desde D1 vacía (87 migraciones, segunda pasada idempotente), consistencia de copias y `git diff --check` aprobados. La suite completa de Workers tiene tres fallos en pruebas de health/blog con HTTP 503; no se atribuyen a H-07 y siguen pendientes. No se aplicó la migración en producción ni se aprovisionó `GUEST_CART_HMAC_SECRET`; despliegue y validación de producción siguen pendientes. Ver [ADR-0034](./docs/adr/ADR-0034-guest-checkout-protection.md).

---

## H-08 — Debilidades en TOTP (Media)

- **Anti-replay y límite de enrolamiento remediados localmente:** el Worker consume de forma atómica el contador TOTP al confirmar el enrolamiento y al iniciar sesión; después de cinco fallos la confirmación se bloquea por 15 minutos. Reiniciar el enrolamiento no borra el contador ni el bloqueo.
- `identity_admins.mfa_secret` ahora se cifra en la persistencia con AES-256-GCM y `TOTP_ENCRYPTION_KEY`. Los secretos heredados se re-cifran gradualmente en el primer acceso; claves ausentes o incorrectas impiden usar secretos MFA. La clave debe ser distinta por entorno, respaldarse de forma segura y no rotarse sin un proceso de re-cifrado.
- La migración aditiva `identity__0003_admin_totp_replay_protection.sql` se aplicó en la D1 de prueba; pasaron 269 pruebas unitarias, cuatro pruebas MFA de Workers y typecheck/arquitectura/aislamiento. La suite completa de Workers conserva tres errores HTTP 503 en `cms-blog` y `runtime.test`; no se resuelven aquí. **No se aplicó ninguna migración en producción ni se desplegó el Worker**. Antes del despliegue, aprovisionar `TOTP_ENCRYPTION_KEY`. No es compatible revertir a versiones que esperan secretos en claro.

---

## H-09 — Autenticación de clientes (Media)

- **Enumeración por registro:** respondía 409 por correo existente y exponía detalles de validación.
- **Enumeración por tiempo:** las rutas de login cliente/admin podían omitir PBKDF2 si no existía la cuenta.
- **Sin demora por cuenta para clientes:** el límite era solo por IP.
- **Política de contraseña insuficiente** y sin verificación de correo ni recuperación.

**Remediación local (2026-11-15):** registro y recuperación tienen respuestas genéricas; el inicio de sesión usa PBKDF2 ficticio para cuentas ausentes y demora progresiva por hash normalizado de correo (máximo 4 s, sin bloqueo duro); se rechazan claves comunes/repetitivas/secuenciales y se consulta HIBP Pwned Passwords con k-anonimato al registrar/cambiar/restablecer contraseñas de clientes. La consulta envía solo el prefijo SHA-1 de cinco caracteres (sin API key); el sufijo se compara localmente y la respuesta no se almacena. Los flujos fallan cerrados si HIBP no está disponible. Se añadieron tokens de verificación/restablecimiento de un solo uso, vigencia de una hora, envío idempotente por Queue/outbox y cierre de sesiones al restablecer. El login continúa permitido antes de verificar; solo se bloquea el checkout autenticado. Pasaron la suite unitaria (84 archivos/287 tests), la suite Workers (24 archivos/62 tests), typecheck, lint de arquitectura y aislamiento de tablas. La respuesta del proveedor se verificó con pruebas simuladas; no se ha probado una operación real desde el Worker ni en staging/producción. `ADMIN_PASSWORD` se configura fuera de estos flujos y no se consulta automáticamente. El despliegue y la migración remota de identity v4 siguen pendientes.

---

## H-10 — Controles previstos que no encontré implementados (Baja/Media)

- **Re-autenticación en acciones críticas** (`SEC-ADM-04`/`SEC-SES-06`): no hay ningún mecanismo de re-auth; cambiar credenciales Factus/MiPaquete (`PATCH /api/v1/settings`), emitir notas crédito o registrar recaudos se hacen solo con la sesión. Esto agrava H-01.
- `SEC-ISO-05`: cookie de carrito `vega_cart_id` (no `__Host-`), sin hash en servidor ni caducidad de seguimiento de invitado más allá del token.
- `SEC-ORD-08`: `calculateOrderPricing` suma 70 000 centavos (`transactionFeeCents`) al total del cliente cuando paga con Wompi; la regla dice que el checkout no agrega cargos de procesamiento. (Es cuestión de cumplimiento/negocio, no explotación.)
- `SEC-CMS-01`: `renderCmsBlocks` imprime `rawHtml` **sin volver a sanitizar** al renderizar. Hoy se sanitiza al guardar, pero cualquier fila antigua, importación o escritura directa a D1 queda como XSS almacenado en el storefront. Sanitizar también al renderizar.
- `SEC-CMS-03`: el JSON-LD escapa `<` y `>` pero no `&` ni U+2028/2029 (riesgo bajo en `<script type="application/ld+json">`).
- Redirecciones SEO (`Redirect.ts`): acepta `https://` a **cualquier** dominio, no solo dominios propios (`SEC-CMS-04`) → redirección abierta si un editor es comprometido.

**Remediación H-10 local (2026-11-15; sin certificar en staging/producción):** las acciones críticas de configuración, rangos Factus, MiPaquete, notas crédito y recaudos COD exigen contraseña actual y TOTP por operación; el contador TOTP se consume para impedir replay. El carrito usa exclusivamente la capacidad firmada `__Host-cart` (30 días) y elimina el cookie legacy; los tokens de seguimiento guest vencen a los 90 días mediante la migración aditiva `orders__0014_guest_tracking_expiration.sql`, que backfillea pedidos existentes. Se actualizó el plan de rollback. Los pedidos nuevos ya no agregan tarifa de procesamiento Wompi al total del comprador, y el costo estimado se mantiene como dato interno del comercio; pedidos históricos conservan su snapshot. CMS sanitiza rich HTML al renderizar; los productores JSON-LD escapan `<`, `>`, `&`, U+2028 y U+2029. Los redirects solo aceptan rutas relativas same-origin y filas legacy externas se omiten en resolución/listado. Pasaron 87 archivos/293 pruebas unitarias, 24 archivos/64 pruebas Workers, aplicación/idempotencia de 90 migraciones D1 desde esquema vacío, typecheck, lint de arquitectura, aislamiento de tablas y `git diff --check`. **Pendiente:** verificar en staging, aplicar migración remota y desplegar con aprobación; nada se ha aplicado en producción.

---

## H-11

1. **Autenticación por `Bearer`** aceptada en todas las rutas además de la cookie: amplía la superficie de robo de tokens (un token en JS/log/URL es utilizable en cualquier origen). Si no es necesario fuera de pruebas, restringir a no-producción.
2. **Regex de cookie sin anclar** en `CustomerAuthController` (`/__Host-session=([^;]+)/` en `/logout` y `/me`) y `AdminAuthController./logout`: coincide con subcadenas (`x__Host-session=…`). Las demás rutas sí anclan; unificar.
3. **Rate limiting solo en métodos de escritura y por IP.** Los `GET` públicos (búsqueda, sugerencias, `shipping/locations`, `cart`) no tienen límite (scraping / coste de D1). Todo `POST` comparte 90/min por IP salvo auth/checkout; NAT corporativo/móvil puede bloquear usuarios legítimos.
4. **Entradas sin validar/limitar:** `POST /orders/checkout/evaluate`, `cart/items`, `realtime/notifications/read`, `credit-notes` hacen `await c.req.json()` sin `try/catch` (→ 500 en JSON inválido) y `evaluate` itera `items` sin tope (hasta 1 MiB). Falta Zod `.strict()` en varias rutas públicas (`SEC-VAL-01`).
5. **`calculateOrderPricing` usa `listProducts({limit:100})`** (se llama hasta 3 veces por pedido): productos fuera de los primeros 100 no se pueden comprar y cada pedido carga 100 productos → problema funcional y de coste/DoS.
6. **Admin `LIKE` sin escapar** `%`/`_` en `D1OrderTrackingRepository.listForAdmin` (solo admin; efecto menor).
7. **`ipAddress`** de sesión usa `x-forwarded-for` como alternativa (falsificable); en Cloudflare usar solo `cf-connecting-ip`.
8. **`/api/v1/payments/wompi/init`** lee `body.orderId` sin validación Zod y sin Turnstile (SEC-PAY-09 lo pide para invitados); sí valida propiedad del pedido y es idempotente.
9. **Superficie administrativa expuesta públicamente:** `/admin/login` en el mismo dominio que la tienda; considerar Cloudflare Access (`SEC-ADM-05`) o restricción por IP/país.
10. **CI/cadena de suministro:** al momento del hallazgo no había `pnpm audit`/Dependabot/Renovate ni fijación por SHA de las Actions (`@v7`, `@v6`, `gitleaks-action@v3`). Verificar que esas versiones existen y fijarlas por commit SHA. Versiones principales antes de remediar en el lockfile: `hono 4.13.13`, `xss 1.0.17`, `wrangler 4.149.0`, `qrcode-svg 1.1.0`, `pdf-lib 1.17.1` (sin mantenimiento activo): revisar avisos con `pnpm audit` en un entorno con red.
11. **Higiene del repositorio:** los `*:Zone.Identifier` (metadatos de descarga de Windows) están en el zip; el `wrangler.jsonc` contiene IDs reales de D1/KV (no son secretos, pero evita publicarlos si el repo es público).

**Remediación local H-11, puntos 1–3 (pendiente de validar en Cloudflare):** `Bearer` se acepta solo con `ENVIRONMENT` explícito `development`, `test`, `preview` o `staging`; en producción y cuando falta el entorno solo se admite la cookie. Los lectores de sesión usan un parser común que compara el nombre completo de cookie. El rate limit ahora cubre búsqueda/sugerencias (60 solicitudes/min/IP), ubicaciones/carrito (120/min/IP), escrituras generales (300/min/IP/ruta y método) y escrituras con sesión válida (90/min/actor/ruta y método); se conservan los límites más estrictos existentes para autenticación y checkout. Verificación local: suite unitaria (88 archivos/297 pruebas), Workers (24 archivos/64 pruebas), typecheck, lint de arquitectura, `git diff --check` y `wrangler deploy --dry-run` pasaron. El dry-run valida el bundle y muestra los bindings configurados, pero no verifica la existencia de sus namespaces en Cloudflare ni despliega el Worker. Los puntos 4–10 se documentan a continuación; el punto 11 sigue pendiente.

**Remediación local H-11, puntos 4–6 (sin desplegar):** las rutas de evaluación de checkout, escritura de carrito, lectura de notificaciones y emisión de notas crédito limitan el tamaño del cuerpo y validan JSON con esquemas Zod estrictos; checkout limita a 50 líneas y el carrito a 50 productos distintos. El cliente ya no envía precios al agregar productos. El cálculo de pedidos y las rutas de checkout/carrito obtienen los productos solicitados por ID mediante una consulta por lote del módulo `catalog`, limitada a 50 IDs por llamada, en lugar de cargar las primeras 100 filas; productos publicados fuera de esa primera página se pueden evaluar. La búsqueda administrativa de pedidos escapa `%`, `_` y `\\` y usa `ESCAPE char(92)`. Verificación local: 89 archivos/302 pruebas unitarias, 24 archivos/65 pruebas Workers, typecheck, lint de arquitectura, aislamiento de tablas y `git diff --check` aprobados. No se verificó en Cloudflare ni se desplegó.

**Remediación local H-11, puntos 7–9 (sin desplegar):** el inicio de sesión de clientes registra como IP únicamente `cf-connecting-ip`, sin confiar en `x-forwarded-for`; se añadieron pruebas con ambos encabezados y sin el encabezado confiable. La inicialización de Wompi limita el JSON a 8 KiB, valida `orderId` y el token Turnstile con un esquema Zod estricto y exige una verificación Turnstile nueva para pedidos invitados después de comprobar la propiedad del carrito; el checkout solicita esa segunda verificación antes de redirigir a Wompi. Las sesiones de clientes mantienen su flujo sin Turnstile adicional. La política administrativa se aplica en middleware del Worker usando el país provisto por Cloudflare (`request.cf.country`): `ADMIN_EMAIL` solo desde CO, `ADMIN_DEMO_EMAIL` desde cualquier país y otros correos no pueden iniciar sesión; las sesiones administrativas se vuelven a verificar en UI, APIs prefijadas y APIs fuera de `/api/v1/admin/`. El formulario de login se presenta para permitir identificar la cuenta demo, pero los endpoints protegidos rechazan sesiones fuera de la política. `ADMIN_DEMO_EMAIL` requiere configurarse como variable y una cuenta admin activa en D1; no se añadió ningún correo real al repositorio. Verificación local: suite unitaria completa (91 archivos/309 pruebas), Workers (24 archivos/65 pruebas), typecheck, lint de arquitectura, aislamiento de tablas y `git diff --check` aprobados. No se modificó configuración remota; falta configurar `ADMIN_DEMO_EMAIL` por entorno y desplegar el Worker. No se ha configurado una allowlist adicional de IP/CIDR.

**Remediación local H-11, punto 10 (sin desplegar):** se fijaron por SHA `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` y `gitleaks/gitleaks-action`; se añadió Dependabot semanal para npm (workspace raíz y `apps/api`) y GitHub Actions, agrupando solo cambios menores/parche; y el CI ahora ejecuta `pnpm audit` sobre dependencias de producción y desarrollo. La auditoría inicial encontró 17 avisos (6 altos, 10 moderados y 1 bajo) en Zod, Hono, Undici y `@vitest/mocker`. Se actualizó Hono, las integraciones de Hono/Zod, Wrangler, Vitest y Workers Types; se migraron los `z.record` afectados a Zod 4, porque el aviso alto no tenía corrección para la rama Zod 3. La auditoría posterior no reportó vulnerabilidades. `pdf-lib` no apareció en el reporte de avisos; su falta de mantenimiento activo queda como riesgo de mantenimiento, no se sustituyó en este punto. Verificación local: `pnpm audit`, typecheck, 91 archivos/309 pruebas unitarias, 24 archivos/65 pruebas Workers, lint de arquitectura, aislamiento de tablas, consistencia y pruebas de migraciones aprobados. No se desplegó ni se modificó GitHub/Cloudflare remoto. El punto 11 permanece pendiente.

---

## Lo que está bien (verificado)

- **SQL:** todo con `.bind()`; los fragmentos interpolados son listas blancas fijas (`productOrderBy`) o placeholders generados. FTS5 con consulta saneada. Sin inyección SQL encontrada.
- **Pagos Wompi:** firma SHA-256 en tiempo constante, ventana de timestamp, entorno test/prod coherente con la llave, reconciliación contra la API de Wompi (id, referencia, monto, moneda) y contra la transacción guardada, deduplicación e idempotencia. El navegador nunca confirma pagos. Es la parte mejor resuelta.
- **Precios:** el servidor recalcula todo (SEC-ORD-01); cantidad entera 1–99; impuestos y totales en enteros.
- **Inventario:** reserva con `UPDATE … WHERE quantity - reserved >= ?` y consumo idempotente.
- **IDOR:** pedidos, tracking, sesiones y facturas combinan ID + propietario y responden 404; tracking invitado con token de 256 bits guardado con hash.
- **Sesiones/cookies:** token de 32 bytes aleatorios, hash SHA-256 en D1, `__Host-` + HttpOnly + Secure + SameSite=Lax; rotación al cambiar contraseña.
- **CSRF:** comprobación de `Origin` y `Sec-Fetch-Site`, con excepción solo del webhook.
- **Sanitización CMS:** lista blanca con `xss`, bloqueo de `javascript:`/`data:`, imágenes solo `/media/<uuid>`.
- **Medios:** subida solo admin con permiso, límites de tamaño, `nosniff`, re-encode (según documentación).
- **Auditoría:** antes/después de cada mutación admin; si falla, se bloquea la operación.
- **Secretos:** ninguno en el árbol ni en el historial git; `.dev.vars`/`.env` ignorados; Gitleaks en CI.

---

## Plan de remediación sugerido

1. **Ya:** H-01 (XSS panel), H-02 (MFA en rutas sueltas), H-03 (canje de cupones).
2. **Esta semana:** H-04, H-05, H-07 (Turnstile + tope en checkout), H-08 (anti-replay TOTP + contador en confirm).
3. **Siguiente:** H-06 (CSP con nonces; es la mitigación que contendría futuros XSS), re-autenticación (H-10).
4. **Continuo:** tests de regresión (por cada hallazgo, un test automatizado como exige `SEC-ISO-06`), `pnpm audit` y Dependabot, fijar Actions por SHA.