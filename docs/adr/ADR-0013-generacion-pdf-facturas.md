# ADR-0013: Generación de PDF de facturas en Cloudflare Workers

- **Estado:** Implementado con `pdf-lib`; genera un PDF binario dentro del Worker
- **Fecha:** Fase 0 (Propuesta) · Fase 9 (Implementado)

## Contexto
El Worker debe generar y servir documentos soporte de facturas de forma segura y compatible con Cloudflare Workers (V8 Isolates), sin depender de Cloudflare Containers ni binarios nativos. El documento comercial imprimible no reemplaza la factura electrónica validada ante DIAN.

## Decisión Técnica Implementada
1. **Puerto `IInvoicePdfPort`:**
   - La capa de dominio y aplicación de `invoicing` depende únicamente del puerto `IInvoicePdfPort`, retornando el resultado de almacenamiento en R2.
2. **Adaptador Documental Estructurado (`HtmlInvoicePdfAdapter`):**
   - Genera un PDF binario con `pdf-lib`, incluyendo el snapshot fiscal y comercial guardado en la factura.
   - Persistido en Cloudflare R2 bajo la clave privada `private/invoices/{invoiceNumber}-v2.pdf` y con `Content-Type: application/pdf`.
   - Se sirve como PDF en línea o como descarga mediante el endpoint autenticado del BFF (`/api/v1/invoices/:id/document`), con autorización de propietario o administrador.

El nombre `IInvoicePdfPort` corresponde al artefacto actual. La versión `-v2.pdf` permite conservar compatibilidad con documentos de facturas ya emitidas; ante un objeto ausente se puede regenerar el PDF desde el snapshot inmutable, sin alterar la factura almacenada.
