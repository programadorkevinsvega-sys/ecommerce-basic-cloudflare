# ADR-0005: Proveedor de Email Transaccional Resend

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
El sistema requiere enviar correos de bienvenida, verificación, confirmación de compra y facturas adjuntas con alta entregabilidad y firma criptográfica.

## Decisión
1. Adoptar **Resend** como proveedor detrás de la interfaz `IEmailPort` en el módulo `notifications`.
2. Encolamiento y despacho mediante Cloudflare Queues con reintentos e idempotencia.
3. Webhook de recepción de eventos verificado criptográficamente.
