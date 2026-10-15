# ADR-0028: Política operativa de envío gratis

**Estado:** Aceptada  
**Fecha:** 2026-10-15

## Contexto

El anuncio de envío gratis desde $150.000 COP era texto de marketing y no modificaba el total del checkout. Aplicar tarifa cero directamente también habría perdido el costo real de MiPaquete necesario para validar y crear la guía.

## Decisión

El módulo `shipping` mantiene reglas independientes, editables desde Admin → Marketing → Envío gratis. Cada regla puede aplicar al catálogo completo, un producto, categoría o colección, y define mínimo, vigencia, prioridad y estado. No hay una regla activa por defecto; el comercio configura explícitamente sus beneficios. Se evalúa contra el subtotal después de descuentos automáticos y cupón; para alcance específico, todos los productos del pedido deben coincidir con el destino de la regla. Cuando se cumple, la tienda cubre el flete y no se puede cobrar al cliente al recibir.

El pedido conserva `shipping_cost_cents` como costo bruto real del proveedor/local y agrega `shipping_discount_cents` como subsidio de la tienda. El total solo suma la diferencia. Para la guía MiPaquete, la cotización y validación usan el costo bruto; el valor de venta excluye únicamente el flete neto cobrado al cliente.

## Consecuencias

- Las reglas viven en tablas `shipping_*`; pedidos solo almacenan la instantánea del descuento. La regla inicial histórica se retiró en la migración v9.
- Las migraciones son aditivas y el Worker anterior ignora sus columnas/tablas.
- Los textos de anuncios son informativos y se gestionan por separado; el administrador mantiene su coherencia comercial.

## Excepción documentada: migraciones ya aplicadas

El requerimiento explícito del comercio es no instalar umbral ni regla de envío gratis mediante semillas SQL. Las migraciones v7 y v8 ya se habían ejecutado en producción con esos valores antes de esta aclaración. Para nuevas instalaciones se retiraron las sentencias `INSERT` de las fuentes canónicas; para producción, v9 elimina la regla generada y v10 desactiva el singleton histórico con umbral cero para proteger un rollback. El ledger de este proyecto no guarda checksums, por lo que la corrección de las fuentes no cambia la base ya migrada. Esta es una excepción acotada a la regla de no modificar migraciones aplicadas, aprobada por la instrucción explícita del usuario; futuras migraciones se mantienen append-only.
