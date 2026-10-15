# ADR-0026: Selección de empaque para cotizaciones nacionales

- **Estado:** Aceptado
- **Fecha:** 2026-10-15

## Contexto

Aplicar siempre una caja de catálogo a un pedido de una sola unidad puede inflar las dimensiones y el costo del flete. A la vez, cotizar varias unidades como si fueran un solo producto omite el espacio y el peso del empaque exterior.

## Decisión

- Cada producto registra dimensiones y peso empacados por unidad.
- Si el pedido contiene exactamente una unidad, MiPaquete recibe las dimensiones y el peso empacados de esa unidad; no se añade tara de una caja configurada.
- Si contiene dos o más unidades, el servidor las acomoda en el empaque activo compatible de menor volumen. La cotización usa dimensiones externas del empaque y suma el peso de todas las unidades más la tara.
- El peso enviado a MiPaquete se redondea hacia arriba al kilogramo entero.
- Si no hay una caja activa compatible con un pedido de varias unidades, se rechaza la cotización. No se inventan dimensiones ni se estima una caja.
- La cotización guarda una instantánea del paquete. `package_profile_id` nullable distingue el empaque individual (`NULL`) de una caja configurada y conserva compatibilidad con cotizaciones existentes.

## Consecuencias

- Se pueden desactivar o eliminar todos los perfiles de caja: las cotizaciones de una sola unidad continúan disponibles; varias unidades esperan una caja compatible.
- Para dos teléfonos de 220 g, por ejemplo, una caja con tara de 50 g genera 490 g de peso del paquete (`220 + 220 + 50`), que MiPaquete recibe como 1 kg. Las dimensiones enviadas son las externas de esa caja.
- No se requiere migración: `shipping_carrier_quotes.package_profile_id` ya es nullable desde `shipping__0003_package_profiles_and_quote_snapshot.sql`.
