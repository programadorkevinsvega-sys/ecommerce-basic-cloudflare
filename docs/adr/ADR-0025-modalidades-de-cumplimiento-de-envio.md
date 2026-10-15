# ADR-0025: Entrega local del comercio y envío nacional por transportadora

- **Estado:** Aceptada
- **Fecha:** 2026-10-15
- **Contexto:** La tienda necesita ofrecer entrega local con domiciliario o vehículo propio y envíos nacionales cotizados con MiPaquete. Una cobertura nacional manual duplicaba las reglas de la transportadora y podía contradecir sus destinos y tarifas.

## Decisión

- Las zonas `city`, `department` y `municipality` representan exclusivamente entregas locales gestionadas por el comercio. El comercio define municipios, tarifa, plazo y si acepta contra entrega.
- El destino nacional se identifica con DANE y se cotiza en MiPaquete. La cobertura, transportadoras disponibles, tarifa y plazo provienen de la cotización del proveedor, no de una tarifa nacional manual.
- La página de Municipios DANE administra solo las zonas locales. La lista DANE también identifica el destino que se envía a MiPaquete.
- Cuando el catálogo DANE local tiene menos de 500 municipios, el backend sincroniza `GET /getLocations` de MiPaquete y hace upsert de los códigos municipales en `shipping_divipola`; no modifica zonas ni sus municipios asociados. La sincronización se limita por instancia y continúa sirviendo el catálogo existente si MiPaquete no responde.
- El checkout identifica la modalidad desde la zona validada por el servidor. No confía en una modalidad enviada por el navegador.
- Los pedidos nuevos guardan `merchant_local` o `carrier` en `orders_orders.shipping_fulfillment_method`. Los históricos quedan como `legacy`; no se reclasifican automáticamente.
- Para compatibilidad, la zona nacional ya existente permanece como referencia interna del checkout cuando la transportadora está activa. No aparece como cobertura o tarifa administrable en Envíos y cobertura.

## Consecuencias

- Un pedido local suma la tarifa configurada por el comercio y no solicita cotización ni crea guía de MiPaquete.
- Un pedido nacional requiere cotización vigente de MiPaquete cuando la integración está activa; para poder crear guía, pedido y cotización conservan sus validaciones actuales.
- El método de pago y el modo de cobro del flete de MiPaquete aplican solo al cumplimiento `carrier`.
- El catálogo DANE puede comenzar con cobertura parcial; la sincronización lo completa desde MiPaquete antes de la búsqueda nacional.
- La migración `orders__0008_shipping_fulfillment_method.sql` es expand-only y compatible con Worker anterior.
