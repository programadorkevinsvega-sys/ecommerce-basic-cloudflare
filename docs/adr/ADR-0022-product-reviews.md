# ADR-0022 — Reseñas verificadas y datos de demostración

- Estado: Aceptada
- Fecha: 2026-10-14

## Contexto

La tienda necesita mostrar valoraciones y comentarios en los detalles de producto y ofrecer una página propia para consultar opiniones. Las opiniones deben corresponder a experiencias reales y no exponer datos personales del cliente.

## Decisión

- Crear el bounded context `reviews`, dueño de `reviews_product_reviews`.
- Solo una sesión de cliente autenticada puede enviar una opinión. El servidor valida que el mismo cliente tenga el producto en un pedido entregado con pago aprobado o recaudo confirmado.
- Se permite una reseña por cliente y producto. El servidor toma `customerId` de la sesión y el producto de un slug publicado.
- La opinión contiene puntuación entera de 1 a 5, comentario de 10 a 2.000 caracteres y fecha de creación. Tras validar la compra se publica automáticamente.
- El frontend presenta promedio y total en la ficha, y enlaza a `/productos/:slug/opiniones`, que pagina el listado.
- La API y el HTML público no revelan email, nombre, teléfono ni ID del cliente. El JSON-LD incluye `AggregateRating` solo cuando existe al menos una reseña.
- `reviews` consulta pedidos mediante el Gateway público de `orders`; no consulta ni cruza tablas de otros módulos.
- Excepción aprobada explícitamente por el responsable de la tienda: una migración puede agregar opiniones ficticias para poblar la tienda, que según el responsable aún no tiene compradores reales. Se almacenan con `source='demo'` para conservar la procedencia interna; la interfaz no muestra una etiqueta DEMO y no afirma que esas opiniones provienen de compradores verificados. Si un producto tiene reseñas verificadas, sus ficticias no afectan el promedio; si aún no tiene verificadas, se muestran sus puntuaciones ficticias en la interfaz. El JSON-LD excluye puntuaciones ficticias. La creación normal de reseñas solo produce `source='verified'` después de validar la compra.

## Consecuencias

La reseña verificada es inmediata y no requiere moderación manual. Para publicar, el comprador necesita tener cuenta y haber recibido el producto. El límite por actor e IP reduce abuso; el endpoint requiere sesión y compra verificada. La migración de opiniones ficticias es una excepción limitada, autorizada expresamente por el usuario; mantiene su fuente separada y no permite que una opinión ficticia se convierta en verificada por moderación.

La migración es expand-only. Al revertir el Worker se conserva la tabla y sus filas; no se ejecuta `DROP TABLE` como rollback.
