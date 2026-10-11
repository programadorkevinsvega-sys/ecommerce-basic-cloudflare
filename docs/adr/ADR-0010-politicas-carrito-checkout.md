# ADR-0010: Políticas de Carrito Mixto y Checkout

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
Los productos pueden tener distintas políticas: contra entrega permitida o no, envío nacional o solo local, de contado o a crédito.

## Decisión
Toda la lógica de combinación se evalúa en el **dominio de `orders` (`OrdersCheckoutPolicy`)**:
1. Si un producto es de alcance `local` y la dirección destino está fuera de cobertura, se bloquea el checkout y se notifica al usuario.
2. La opción de pago contra entrega solo se ofrece si **todos** los artículos del carrito la permiten y la zona destino la admite.
3. El BFF no evalúa estas reglas: únicamente invoca al Gateway de órdenes.
