# ADR-0009: Alcance de Venta a Crédito

- **Estado:** Propuesta (Por ratificar en Fase 10)
- **Fecha:** Fase 0

## Contexto
El negocio requiere vender productos a crédito a los clientes.

## Decisión
Se define inicialmente como **financiación directa en cuotas periódicas** gestionadas por la tienda:
1. Módulo `credit` gestiona planes, cuentas de crédito, cronogramas de cuotas y estados de mora.
2. Cada abono se paga en línea mediante Wompi referenciando el identificador de la cuota.
3. Se ratificará el cumplimiento normativo (tasas de interés y leyes de usura) antes de abrir a producción en la Fase 10.
