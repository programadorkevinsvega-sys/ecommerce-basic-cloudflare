# ADR-0012: Alcance del Módulo de Facturación

- **Estado:** Implementado; decisión DIAN reemplazada parcialmente por ADR-0032
- **Fecha:** Fase 0 (Propuesta) · Fase 9 (Implementado y Certificado)

## Contexto
Cada pago completado (Wompi o contra entrega) debe generar una factura comercial inmutable con numeración consecutiva, desglose de impuestos y almacenamiento seguro en R2 y D1.

## Decisión Técnica Implementada
1. **Factura Interna Inmutable (Producción Directa):**
   - Emisión automática e idempotente en el módulo `invoicing`.
   - Numeración consecutiva y atómica por prefijo (`FAC-XXXXXX`) gestionada en `invoicing_sequences`.
   - Snapshot inmutable en D1 (`invoicing_invoices.snapshot_json`) con líneas, datos del comprador, dirección y desglose financiero.
   - Documento soporte imprimible formal almacenado en Cloudflare R2 (`private/invoices/FAC-XXXXXX.html`).
   - Soporte para notas crédito (`invoicing_credit_notes`).

2. **Integración DIAN de Colombia:**
   - La decisión original de no transmitir a DIAN fue reemplazada parcialmente por ADR-0032, que acepta Factus como proveedor.
