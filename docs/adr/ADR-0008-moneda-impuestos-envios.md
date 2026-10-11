# ADR-0008: Moneda, Impuestos y Envíos

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
El cálculo financiero en comercios electrónicos debe evitar errores de redondeo por números flotantes y adaptarse a la legislación fiscal aplicable.

## Decisión
1. **Moneda:** Todos los valores monetarios se representan en **enteros (centavos de COP)**.
2. **Impuestos:** La tarifa base de IVA y desglose fiscal se define en el módulo `settings` y se aplica en el snapshot del pedido.
3. **Envíos:** Los cálculos tarifarios residen exclusivamente en el módulo `shipping`.
