# ADR-0004: Pasarela de Pago Wompi

- **Estado:** Implementado y Verificado en Producción
- **Fecha:** Fase 0 (Definido) · Fase 8 (Implementado y Certificado)

## Contexto
El ecommerce opera en Colombia (moneda oficial COP en centavos enteros) y requiere procesar pagos seguros con tarjetas de crédito/débito, PSE, Nequi y corresponsales bancarios sin intermediación de infraestructura no serverless ni Cloudflare Containers.

## Decisiones Técnicas Implementadas

1. **Arquitectura Port & Adapter (`IPaymentPort`):**
   - El dominio de `payments` define el puerto agnóstico `IPaymentPort` e `IWompiAdapter`.
   - `WompiPaymentAdapter` encapsula la lógica de integración técnica y cálculo de hashes criptográficos con Web Crypto API (`crypto.subtle.digest`).

2. **Hosted Checkout Seguro (`https://checkout.wompi.co/p/`):**
   - El cliente es redirigido al widget hosted oficial de Wompi con los parámetros requeridos: `public-key`, `currency` (COP), `amount-in-cents`, `reference` y `signature:integrity`.
   - **Firma de Integridad (SHA-256):** Generada en el servidor concatenando en orden estricto: `reference + amountInCents + currency + integritySecret`.
   - **Prellenado de Datos de Usuario:** Se envían parámetros opcionales prellenados (`customer-data` y `shipping-address`) para optimizar la conversión en el checkout.
   - **Cero manejo de datos sensibles:** Ningún dato de tarjeta (PAN/CVV) toca el Worker ni las bases de datos D1 del comercio.

3. **Confirmación Asíncrona por Webhook (`POST /api/v1/webhooks/wompi`):**
   - Confirmación de pagos realizada **exclusivamente** a través del webhook de Wompi, nunca por redirección del navegador del usuario.
   - **Verificación Criptográfica de Eventos:** Se valida `signature.checksum` calculando `SHA-256` sobre los valores concatenados de las propiedades listadas en `signature.properties` (resueltas con notación de punto desde `body.data`, ej. `transaction.id`, `transaction.status`, `transaction.amount_in_cents`) + `timestamp` + `WOMPI_EVENTS_SECRET`. Retorna `401 Unauthorized` si no coincide.
   - **Idempotencia:** Deduplicación estricta en `payments_webhook_events` por `eventId`. Eventos duplicados se responden con `200 { received: true, ignored: true }` sin reprocesar.

4. **Orquestación con Pedidos e Inventario:**
   - Transacción `APPROVED`: Pedido transiciona a `status: 'confirmed'` y `paymentStatus: 'approved'`. Se consume el stock reservado (`consumeStock`).
   - Transacción `DECLINED` / `VOIDED`: Pedido transiciona a `status: 'cancelled'` y `paymentStatus: 'failed'`. Se libera la reserva de stock (`releaseStock`).
   - Notificación instantánea emitida vía `RealtimeGateway` hacia el canal administrativo.

5. **Gestión de Secretos:**
   - Llaves y secretos de Wompi (`WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`) residen exclusivamente como secretos cifrados en Cloudflare Workers runtime (`wrangler secret put`).
