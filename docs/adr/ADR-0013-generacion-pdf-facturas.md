# ADR-0013: Generación del Documento de Facturas en Cloudflare Workers

- **Estado:** Implementado y Verificado
- **Fecha:** Fase 0 (Propuesta) · Fase 9 (Implementado)

## Contexto
El Worker debe generar y servir documentos soporte de facturas de forma rápida, ligera y 100% compatible con Cloudflare Workers (V8 Isolates) sin depender de Cloudflare Containers ni binarios nativos.

## Decisión Técnica Implementada
1. **Puerto `IInvoicePdfPort`:**
   - La capa de dominio y aplicación de `invoicing` depende únicamente del puerto `IInvoicePdfPort`, retornando el resultado de almacenamiento en R2.
2. **Adaptador Documental Estructurado (`HtmlInvoicePdfAdapter`):**
   - Renderiza un documento formal HTML/CSS optimizado para impresión (print-friendly) con formato estándar de factura comercial colombiana.
   - Persistido de forma inmutable en Cloudflare R2 bajo la clave privada `private/invoices/{invoiceNumber}.html`.
   - Se sirve directamente con cabecera `Content-Type: text/html; charset=utf-8` y control de acceso seguro mediante endpoint del BFF (`/api/v1/invoices/:id/document`).
