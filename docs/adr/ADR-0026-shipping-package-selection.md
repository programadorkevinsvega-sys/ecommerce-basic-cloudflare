# ADR-0026: Selección de empaque para cotizaciones nacionales

- **Estado:** Aceptado
- **Fecha:** 2026-10-15

## Contexto

Aplicar siempre una caja de catálogo a un pedido de una sola unidad puede inflar las dimensiones y el costo del flete. A la vez, cotizar varias unidades como si fueran un solo producto omite el espacio y el peso del empaque exterior.

## Decisión

- Cada producto registra dimensiones y peso empacados por unidad; estos datos son obligatorios también cuando se asocia una caja.
- Si el pedido contiene exactamente una unidad y existe una caja activa asociada explícitamente al producto, el servidor valida que la unidad quepa en sus medidas internas y respete su peso máximo. MiPaquete recibe las dimensiones externas de la caja y el peso del producto más la tara.
- Si no hay una caja asociada a esa unidad, MiPaquete recibe las dimensiones y el peso empacados del producto, sin añadir tara.
- Si contiene dos o más unidades, el servidor acomoda las unidades en el empaque activo genérico compatible de menor volumen. Las cajas asociadas a productos para una sola unidad no participan en esta selección. La cotización usa dimensiones externas y suma el peso de todas las unidades más la tara.
- El peso enviado a MiPaquete se redondea hacia arriba al kilogramo entero.
- Si una caja está asociada a la unidad pero no cabe o supera su peso máximo, se rechaza la cotización; no se ignora la asociación para usar silenciosamente otro tamaño. Si no hay una caja genérica activa compatible con varias unidades, también se rechaza. No se inventan dimensiones ni se estima una caja.
- La cotización guarda una instantánea del paquete. `package_profile_id` nullable distingue el empaque individual (`NULL`) de una caja configurada y conserva compatibilidad con cotizaciones existentes.

## Consecuencias

- Las asociaciones de productos son opcionales y se administran desde Envíos → Empaques. Los perfiles existentes quedan sin asociaciones tras la migración; el administrador debe editar el perfil y elegir sus productos.
- Se pueden desactivar o eliminar todos los perfiles: las cotizaciones de unidades sin asociación continúan usando su empaque individual; las unidades asociadas y los pedidos múltiples requieren una caja compatible y activa.
- Para un teléfono de 700 g en caja asociada con tara de 100 g, se cotizan 800 g y dimensiones externas; MiPaquete recibe 1 kg por el redondeo hacia arriba.
- La migración aditiva `shipping__0015_package_profile_single_unit_products.sql` guarda las asociaciones como JSON dentro del prefijo de `shipping`. El Worker anterior ignora la columna y las cotizaciones previas conservan su snapshot.
