# ADR-0027: Descuentos automáticos y anuncios de envío

- **Estado:** Aceptado
- **Fecha:** 2026-10-15

## Contexto

Las reglas de promoción guardan porcentaje/monto, alcance, prioridad y compra mínima. La ficha de producto puede evaluar un producto aislado, mientras el cumplimiento de una compra mínima depende del carrito. Los banners y anuncios son contenido editable y no deben alterar el precio o la tarifa logística por su texto.

## Decisión

- Una regla sin compra mínima puede mostrar precio promocional en catálogo y detalle; el mismo precio debe verse en carrito, checkout y pedido.
- Una regla con compra mínima se evalúa en servidor contra el subtotal base de los productos del carrito. No aparece como descuento en una ficha aislada antes de conocer el total.
- El BFF muestra los precios resultantes para facilitar la compra, pero el servidor vuelve a calcular la promoción desde catálogo y `promotions` al cotizar y crear el pedido.
- El texto de envío gratis en un banner/barra no vuelve gratuito el transporte. Una exención de flete requiere una decisión y regla logística propias; no se deduce del texto de marketing.

## Consecuencias

- Admin expone el umbral de compra de cada regla y lo muestra en la lista para explicar cuándo aplica.
- No se requiere migración: `promotions_rules.min_order_amount_cents` ya existe.
- Si el negocio anuncia envío gratis sin haber configurado una exención logística, el anuncio no cambia el precio que devuelve la zona local o MiPaquete.
