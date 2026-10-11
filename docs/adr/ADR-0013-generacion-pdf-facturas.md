# ADR-0013: Generación del PDF de Facturas en Cloudflare Workers

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
El Worker debe renderizar el documento PDF de la factura sin depender de navegadores externos ni Cloudflare Containers.

## Decisión
1. Definir el puerto `IInvoicePdfPort` en la capa de aplicación de `invoicing`.
2. Implementar un adaptador en infraestructura usando una librería pura de JavaScript compatible con V8 Isolates (como `pdf-lib` o similar compilada en WebAssembly/JS puro).
3. El archivo generado se persiste en R2 en el prefijo privado `private/invoices/{id}.pdf` y se sirve con control de acceso por sesión.
