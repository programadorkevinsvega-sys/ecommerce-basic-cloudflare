# ADR-0032: Facturación electrónica con Factus

- **Estado:** Aceptado para implementación; activación en producción pendiente de configuración tributaria y credenciales.
- **Fecha:** 2026-10-24
- **Reemplaza parcialmente:** ADR-0012, únicamente en la decisión de no transmitir documentos a DIAN.

## Contexto

El módulo `invoicing` genera una representación comercial interna, pero no transmite facturas ni notas crédito a DIAN. El comercio eligió Factus como proveedor tecnológico y pidió que Factus envíe al comprador la factura electrónica cuando DIAN la acepte. Factus no ofrece webhook de estado documental; el estado se debe consultar periódicamente.

## Decisiones

- `invoicing` conserva el snapshot comercial inmutable y emite la factura electrónica desde su adaptador Factus. La aceptación DIAN, número externo, CUFE y resultado de envío de correo se guardan por separado de la factura interna.
- La emisión y la nota crédito se guardan con sus eventos en el outbox del mismo módulo. La Queue procesa eventos idempotentes y el Cron reconcilia documentos pendientes consultando Factus; una redirección del navegador no cambia estados fiscales.
- El identificador interno estable (`invoice.id` o `creditNote.id`) es el `reference_code` de Factus. Un conflicto HTTP 409 queda pendiente de consulta y no causa un segundo documento.
- Factus envía al comprador la factura y la nota crédito solo en producción. En sandbox `send_email=false`, porque Factus no envía estos correos en ese entorno. Resend conserva el correo de confirmación de compra y el aviso interno, pero no presenta el PDF comercial local como factura electrónica.
- Sandbox y producción usan endpoints y credenciales separados. Las credenciales se guardan como secretos Cloudflare; el modo y los rangos de numeración se configuran con variables por entorno. La facturación inicia deshabilitada en producción hasta configurar estos valores.
- Las notas crédito requieren el concepto DIAN elegido por el administrador y se enlazan con el número Factus de una factura aceptada. La factura interna solo queda totalmente acreditada después de que Factus confirme una nota por su total.
- `FACTUS_API_URL` y las credenciales OAuth viven en bindings/secretos de Cloudflare; el modo y los rangos de numeración se administran en Configuración. La URL se limita a los hosts HTTPS oficiales sandbox y producción.
- Los precios, descuentos, impuestos, formas de pago, líneas de envío y datos del comprador se forman desde snapshots del servidor. No se aceptan importes fiscales calculados por el navegador.

## Recuperación y operación

La migración `invoicing__0003_factus_electronic_invoices.sql` es expand-only. No borrar columnas ni eventos en rollback. Si Queue falla, el outbox permanece; si Factus no responde, el documento sigue pendiente y el Cron lo consulta más tarde. Los documentos aceptados o rechazados no se reemiten automáticamente. Antes de elegir Producción en Configuración, se debe validar en la cuenta Factus el emisor, el software autorizado, los rangos activos separados para factura y nota crédito, responsabilidades y perfil tributario. Aplicar la migración y verificar la emisión real en un pedido controlado antes de declarar operación DIAN activa.

## Consecuencias

El estado “pendiente” en el panel significa que Factus aún no ha devuelto un resultado final consultable. Sandbox valida la integración de API, pero no certifica el envío de correos ni la aceptación DIAN en producción. No se crean correos duplicados desde Resend para los documentos electrónicos.
