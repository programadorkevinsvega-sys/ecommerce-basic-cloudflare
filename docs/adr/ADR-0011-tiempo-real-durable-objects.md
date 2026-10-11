# ADR-0011: Transporte de Notificaciones en Tiempo Real

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
El frontend (administradores y clientes en checkout) debe recibir notificaciones instantáneas con todos los detalles cuando se confirme un pago, sin recargar la página y 100% serverless en Cloudflare (sin Containers).

## Decisión
1. Implementar WebSockets sobre **Cloudflare Durable Objects** con la **Hibernation API** (`REALTIME_HUB`).
2. Salas decididas en el servidor: `admin:payments` para administradores con RBAC; `customer:{id}` para el cliente dueño del pago.
3. Resiliencia: Si la conexión cae, el cliente reconecta con backoff y consulta eventos no recibidos por HTTP (`?since=<notificationId>`), deduplicando por `notificationId`.
