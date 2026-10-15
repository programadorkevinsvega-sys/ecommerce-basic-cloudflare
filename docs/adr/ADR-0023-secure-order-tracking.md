# ADR-0023: Seguimiento público de pedidos con clave de capacidad

- **Estado:** Aceptada para esta implementación
- **Fecha:** 2026-10-14
- **Contexto:** Los compradores invitados necesitan consultar pedidos sin cuenta. El identificador del pedido por sí solo no demuestra propiedad y los pedidos no deben exponer información personal.

## Decisión

Al crear un pedido, el BFF genera 32 bytes aleatorios. Envía la clave una sola vez al correo de compra y conserva solo su SHA-256 en el módulo `orders`. La consulta exige conjuntamente el identificador y la clave mediante `POST`; la clave nunca va en URL, logs ni respuesta de API. El resultado contiene únicamente estado, fechas del historial y plazo estimado. Se limita por IP con el límite de checkout existente.

El estado `prepared` se registra en el mismo historial de pedidos para que su fecha no sea inferida. La fecha/plazo estimado se congela desde la zona elegida al comprar. No hay integración de transportadora en el modelo actual, así que la pantalla indica claramente que ese dato no está disponible.

## Compatibilidad y límites

La migración `orders__0005_secure_order_tracking.sql` es aditiva y nullable. Pedidos anteriores no tienen clave; un invitado no podrá consultarlos en esta página y deberá solicitar soporte. La cuenta del cliente conserva la consulta autenticada existente. Al revertir el Worker, se conservan las columnas y hashes; no se borra información.

La clave funciona como credencial al portador y debe tratarse como secreta en el correo del comprador. La consulta pública no retorna dirección, contacto, identidad fiscal, productos, pago ni notas internas.
