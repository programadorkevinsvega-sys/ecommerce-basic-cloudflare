# ADR-0028: Política operativa de envío gratis

**Estado:** Aceptada  
**Fecha:** 2026-10-15

## Contexto

El anuncio de envío gratis desde $150.000 COP era texto de marketing y no modificaba el total del checkout. Aplicar tarifa cero directamente también habría perdido el costo real de MiPaquete necesario para validar y crear la guía.

## Decisión

El módulo `shipping` mantiene una política única, editable desde Admin → Envío gratis. El umbral inicial de $150.000 COP coincide con el anuncio vigente. Se compara contra el subtotal luego de promociones automáticas y cupón. Cuando se cumple, el cliente paga cero por el flete y no puede pedir que se le cobre al recibir.

El pedido conserva `shipping_cost_cents` como costo bruto real del proveedor/local y agrega `shipping_discount_cents` como subsidio de la tienda. El total solo suma la diferencia. Para la guía MiPaquete, la cotización y validación usan el costo bruto; el valor de venta excluye únicamente el flete neto cobrado al cliente.

## Consecuencias

- La política vive en una tabla `shipping_*`; pedidos solo almacenan la instantánea del descuento.
- Ambas migraciones son aditivas y el Worker anterior ignora sus columnas/tablas.
- Si cambia el umbral, el administrador también debe actualizar el texto del anuncio para mantenerlos alineados.
