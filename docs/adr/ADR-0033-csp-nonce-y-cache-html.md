# ADR-0033: CSP con nonce por respuesta y HTML fuera de caché

## Estado

Aceptada — 2026-11-15. La migración de todos los handlers inline y su verificación son parte del mismo cambio y deben completarse antes de activar la política estricta.

## Contexto

El HTML SSR contiene scripts inline. Una CSP con nonce distinto por respuesta permite ejecutarlos sin `unsafe-inline`, pero una respuesta HTML compartida por Workers Cache podría reutilizar un nonce entre visitantes. Los atributos de evento HTML (`onclick`, `onerror`, entre otros) no quedan autorizados por un nonce en la etiqueta `<script>`.

## Decisión

- Generar un nonce criptográficamente aleatorio por respuesta HTML y añadirlo a cada etiqueta `<script>`.
- Aplicar `script-src` con nonce y `strict-dynamic`, además de `script-src-attr 'none'`; no permitir `unsafe-inline` en scripts ni hashes derivados del HTML renderizado.
- Migrar los atributos de evento a `addEventListener` y `data-*` con escape HTML; el HTML no debe depender de handlers inline.
- Servir HTML con `Cache-Control: private, no-store` y retirar `Cache-Tag` para evitar reutilizar una respuesta con nonce.
- Limitar `img-src` a `'self' data:`. Las imágenes de contenido se sirven desde rutas propias de medios.

## Consecuencias y recuperación

El HTML SSR público deja de usar Workers Cache mientras cada respuesta requiera un nonce. Se conserva el caché de medios inmutables. Para volver a cachear HTML se necesita un diseño que genere un nonce nuevo en el borde sin debilitar la CSP; no basta con cachear el HTML nonceado. El rollback del Worker revierte la política de caché junto con la versión del código.

## Validación requerida

Buscar cero atributos de evento ejecutables en las vistas, probar nonce distinto por respuesta, `script-src-attr 'none'`, `img-src 'self' data:`, no-cache en HTML, pruebas de las interacciones migradas, typecheck y lint de arquitectura. No declarar la remediación completa hasta que toda esta evidencia pase.
