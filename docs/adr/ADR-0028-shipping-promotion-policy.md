# ADR-0028: Política operativa de envío gratis

**Estado:** Aceptada  
**Fecha:** 2026-10-15

## Contexto

El anuncio de envío gratis desde $150.000 COP era texto de marketing y no modificaba el total del checkout. Aplicar tarifa cero directamente también habría perdido el costo real de MiPaquete necesario para validar y crear la guía.

## Decisión

El módulo `shipping` mantiene reglas independientes, editables desde Admin → Marketing → Envío gratis. Cada regla puede aplicar al catálogo completo, un producto, categoría o colección, y define mínimo, vigencia, prioridad y estado. La migración convierte la antigua política única en una regla general con el umbral existente. Se evalúa contra el subtotal después de descuentos automáticos y cupón; para alcance específico, todos los productos del pedido deben coincidir con el destino de la regla. Cuando se cumple, la tienda cubre el flete y no se puede cobrar al cliente al recibir.

El pedido conserva `shipping_cost_cents` como costo bruto real del proveedor/local y agrega `shipping_discount_cents` como subsidio de la tienda. El total solo suma la diferencia. Para la guía MiPaquete, la cotización y validación usan el costo bruto; el valor de venta excluye únicamente el flete neto cobrado al cliente.

## Consecuencias

- Las reglas viven en tablas `shipping_*`; pedidos solo almacenan la instantánea del descuento.
- Las migraciones son aditivas y el Worker anterior ignora sus columnas/tablas.
- Los textos de anuncios son informativos y se gestionan por separado; el administrador mantiene su coherencia comercial.
