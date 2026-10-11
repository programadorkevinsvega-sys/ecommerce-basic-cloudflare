# ADR-0012: Alcance del Módulo de Facturación

- **Estado:** Propuesta (Por ratificar en Fase 9)
- **Fecha:** Fase 0

## Contexto
Cada pago completado o recaudo contra entrega debe generar y guardar una factura inmutable con todos los detalles legales y contables.

## Decisión
1. **Emisión base:** Generación interna completa de factura con numeración consecutiva atómica, desglose tributario, snapshot JSON inmutable en D1 y PDF en R2.
2. **Factura Electrónica legal (DIAN):** El módulo `invoicing` define el puerto `IElectronicInvoicingPort`. En la Fase 9 se ratificará si se conecta con un proveedor tecnológico fiscal en Colombia para emisión de CUFE y validación previa ante la DIAN.
