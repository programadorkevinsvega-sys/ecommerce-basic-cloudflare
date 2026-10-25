# ADR-0024: Modalidad de cobro del flete en la entrega

- **Estado:** Aceptado
- **Fecha:** 2026-10-14

## Contexto

El comprador debe decidir si el flete se incluye en el total del pedido o si lo cobra la transportadora al entregar. El recaudo de MiPaquete y la forma en que Vega Store liquida el flete con el proveedor son conceptos distintos.

## Decisión

Guardar en `orders` la modalidad seleccionada, el valor incluido en el total y el valor que se recauda en la entrega. Si se cobra al entregar, el flete no aumenta el pago online ni el total/factura comercial del pedido; MiPaquete recibe el valor de mercancía a recaudar para pedidos contra entrega, más el flete. En pedidos pagados por Wompi, la guía solicita recaudar solo el flete. Si se incluye en el pedido, el valor de recaudo COD conserva el comportamiento anterior.

La opción de cobro en entrega requiere una cotización MiPaquete válida. El servidor determina todos los importes desde la cotización persistida; no confía en importes del navegador. `paymentType` continúa representando el método de liquidación del comercio con MiPaquete y no la preferencia del comprador.

El valor de venta enviado a MiPaquete solo representa mercancía que la transportadora recauda. Para pedidos Wompi, ese valor es cero tanto en la cotización como en la creación: si el cliente difiere el flete, el único `valueCollection` es el flete cotizado. La comisión del servicio de recaudo es un costo operativo de la tienda y no se agrega a la suma prometida al cliente. El selector `paymentType` configura la liquidación del flete con MiPaquete.

El checkout adapta el texto de “Sumarlo al pedido” al método de pago: en Wompi se paga ahora; en contra entrega se suma a lo que el cliente paga al recibir. “Pagarlo al recibir” identifica el flete aparte en ambas modalidades.

## Consecuencias y límites

- La opción solo se presenta cuando la integración y la cotización logística están disponibles.
- No activar producción sin dimensiones reales de productos, cajas configuradas y una cotización controlada del proveedor.
- El documento comercial refleja lo incluido en el pedido; el flete que cobra el transportador al entregar se informa aparte.
- Las columnas nuevas son aditivas. Los pedidos históricos usan `included` y conservan sus totales.
