# ADR-0011: Transporte de Notificaciones en Tiempo Real

- **Estado:** Reemplazada para la implementación actual; propuesta original conservada como histórico
- **Fecha:** Fase 0

## Contexto
El frontend (administradores y clientes en checkout) debe recibir notificaciones instantáneas con todos los detalles cuando se confirme un pago, sin recargar la página y 100% serverless en Cloudflare (sin Containers).

## Decisión
1. Implementar WebSockets sobre **Cloudflare Durable Objects** con la **Hibernation API** (`REALTIME_HUB`).
2. Salas decididas en el servidor: `admin:payments` para administradores con RBAC; `customer:{id}` para el cliente dueño del pago.
3. Resiliencia: Si la conexión cae, el cliente reconecta con backoff y consulta eventos no recibidos por HTTP (`?since=<notificationId>`), deduplicando por `notificationId`.

## Estado de implementación (2026-10-15)

La solución descrita arriba no está implementada: `wrangler.jsonc` no declara Durable Objects y el código no implementa WebSockets. Actualmente `GET /api/v1/realtime/notifications` lee notificaciones de D1 con sesión validada; el panel de pagos hace polling aproximadamente cada ocho segundos y el cliente de API deriva el canal/propietario desde la sesión. Por tanto, la decisión de este ADR queda como diseño futuro y no debe describirse como funcionalidad desplegada. Una decisión de adopción posterior requiere ADR de reemplazo y pruebas de aislamiento/carga.
