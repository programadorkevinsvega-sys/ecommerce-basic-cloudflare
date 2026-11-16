# ADR-0034: Protección del checkout invitado

## Estado

Aceptada — 2026-11-15. Pruebas unitarias/Workers y migraciones D1 locales aprobadas; migración y secreto de producción no aplicados ni aprovisionados.

## Contexto

El checkout público podía crear pedidos sin Turnstile y usaba un identificador de carrito que podía elegir el navegador. Los pedidos reservan inventario y pueden generar varios correos transaccionales.

## Decisión

- Exigir Turnstile para crear pedidos invitados. El Worker valida el token y el hostname antes de calcular precios o reservar recursos. Las sesiones de clientes autenticadas no necesitan Turnstile.
- Emitir una capacidad de carrito con ID aleatorio de 256 bits y firma HMAC-SHA-256 en `__Host-cart`. El secreto `GUEST_CART_HMAC_SECRET` debe tener al menos 32 bytes UTF-8 y ser único por entorno. Nunca adoptar un valor recibido solo en `vega_cart_id`.
- No emitir ni leer `vega_cart_id`: la capacidad firmada `__Host-cart` es la única autoridad. Una versión anterior puede depender del espejo, por lo que un rollback requiere deshabilitar el checkout invitado y advertir que los carritos abiertos pueden necesitar reconstruirse.
- Los tokens privados de seguimiento de pedidos se guardan como hash y vencen a los 90 días desde la creación del pedido. La migración `orders__0014_guest_tracking_expiration.sql` agrega el vencimiento y actualiza de forma aditiva los pedidos existentes.
- Aplicar límites atómicos en el módulo `orders`: 3 pedidos pendientes por IP, 2 por correo normalizado y 2 por carrito en 30 minutos; máximo 3 correos de pedido por destinatario durante una hora. El checkout invitado falla cerrado si falta la IP o el secreto.
- Persistir únicamente fingerprints HMAC en tablas `orders_*`; no almacenar IP, correo o ID de carrito en claro en estas tablas. Crear pedido, intentos y reservas de correo dentro del mismo batch D1; una reserva denegada no crea artefactos del pedido.
- Conservar las reservas de correo hasta que venza la ventana, incluso si un pedido se cancela antes de enviar el correo. Esto prioriza el límite de salida sobre liberar capacidad de forma optimista.

## Consecuencias y recuperación

La migración `orders__0013_guest_checkout_protection.sql` es aditiva y pertenece solo a `orders`. No se elimina en rollback. Las capacidades firmadas de `__Host-cart` dependen del secreto; su pérdida o rotación invalida carritos vigentes. El cookie dura 30 días. Una versión anterior del Worker no aplica estos controles ni entiende la capacidad firmada: antes de reactivarla, deshabilitar temporalmente el checkout invitado; los carritos guest abiertos pueden necesitar reconstruirse. Los tokens guest de seguimiento vencen a los 90 días; si se revierte a una versión que no aplica ese vencimiento, bloquear temporalmente el endpoint de tracking guest en el borde hasta desplegar una versión compatible. La migración D1 y el despliegue de producción permanecen pendientes.

## Validación requerida

Probar rechazo de Turnstile ausente, inválido y no disponible; omisión del challenge para clientes autenticados; rechazo concurrente sin artefactos D1; límites por IP/correo/carrito y destinatario; verificación de cookie; migración desde D1 vacía y prueba de aislamiento de tablas. La remediación local no acredita el secreto, la migración ni el Worker de producción.

La suite unitaria completa pasó (264 pruebas) y las pruebas focalizadas de Workers pasaron (4 pruebas). La suite completa de Workers conserva tres fallos en pruebas de health/blog (HTTP 503); no forman parte de estas pruebas focalizadas y requieren seguimiento independiente.
