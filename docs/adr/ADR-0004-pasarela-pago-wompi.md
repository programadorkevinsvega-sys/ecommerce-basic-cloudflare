# ADR-0004: Pasarela de Pago Wompi

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
El ecommerce opera en Colombia (moneda COP en centavos) y requiere soportar pagos con tarjetas, PSE, Nequi y corresponsales bancarios.

## Decisión
1. Adoptar **Wompi** como proveedor oficial implementando el puerto `IPaymentPort` en el módulo `payments`.
2. Confirmación de pagos realizada exclusivamente a través de webhook verificado con checksum y reconciliación contra la API de Wompi.
3. Cero almacenamiento o procesamiento de números de tarjeta (PAN/CVV) en el Worker o bases de datos.
