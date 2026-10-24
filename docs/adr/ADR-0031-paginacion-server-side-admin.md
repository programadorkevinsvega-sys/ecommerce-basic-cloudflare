# ADR-0031: Paginación del lado servidor para listas administrativas

## Estado

Cerrado para implementación: las listas administrativas persistentes consultan páginas en el backend. El despliegue coordinado y la verificación de humo en producción quedan como pasos operativos posteriores.

## Contexto

El admin usa paginación visual en el navegador, pero varios endpoints entregan colecciones completas o lotes fijos de hasta 1.000 elementos. Esto aumenta el tiempo de respuesta, el HTML inicial y el uso de memoria; además, la búsqueda del navegador solo puede filtrar los registros descargados. Las APIs administrativas tampoco tenían una política común para evitar caché.

## Decisión

- Toda tabla administrativa que represente una colección persistente obtiene sus filas desde un endpoint paginado del backend. La paginación solo en el navegador no cuenta como paginación del sistema.
- El contrato común usa `page` (base 1), `pageSize` (por defecto 25, máximo 50), filtros validados en el servidor y metadatos `page`, `pageSize`, `total` y `hasMore`.
- Las consultas aplican `LIMIT` y `OFFSET` en el repositorio dueño de los datos. `total` usa un conteo con los mismos filtros. Orden estable y explícito incluye un desempate por ID.
- Cambiar filtros reinicia a la página 1. Tras una mutación, el admin invalida los datos y vuelve a consultar la lista; las vistas que conservan la página actual retroceden si esa página queda vacía.
- Las respuestas de `/api/v1/admin/*` son `private, no-store`; el cliente solicita las lecturas con `cache: 'no-store'`.
- Gateways mantienen los límites entre módulos. No se agregan JOINs, imports internos ni consultas entre prefijos para construir filtros o conteos.
- Las lecturas de entidades individuales, configuraciones singleton y opciones pequeñas de formularios no se convierten artificialmente en tablas paginadas. Los selectores de grandes catálogos deben usar búsqueda paginada remota.
- Exportar es una operación explícita separada de la vista paginada; no debe hacer que la pantalla cargue todas las filas en memoria. El endpoint de exportación debe limitar el volumen por petición o usar lotes acotados.

## Despliegue y recuperación

La transición es compatible hacia atrás: primero se agregan parámetros y metadatos paginados opcionales a las APIs; después se actualiza cada pantalla para consumirlos; finalmente se eliminan las cargas masivas. No requiere migración D1. Cada lista se despliega junto con su cliente para evitar que un cliente antiguo interprete incorrectamente la página parcial como el total. El rollback restaura el Worker anterior; `no-store` puede permanecer sin impacto funcional.

## Alcance operativo

Aplicar a pedidos, pagos, facturas, inventario, productos, taxonomías, reseñas, auditoría, envíos, CMS, promociones y cualquier otra tabla/lista persistente del admin. Las listas ya paginadas en D1 se normalizan al mismo contrato. La configuración singleton y los detalles de un registro quedan fuera del concepto de paginación.

## Implementación registrada

- Listas administrativas actualizadas: pedidos y seguimiento, transacciones y recaudos, liquidaciones, facturas, inventario, productos, colecciones, etiquetas y taxonomías, reseñas, auditoría, zonas y municipios, páginas CMS y blog, banners, anuncios, reglas de promoción, cupones y reglas de envío gratis.
- Lecturas del admin fuerzan `no-store` en el Worker y en el cliente. Los listados usan consultas limitadas y orden estable, conteos alineados con filtros donde aplica, y controles remotos de página; los selectores de productos para colecciones y recaudos locales también consultan páginas remotas.
- No se agregó migración D1. Los límites de módulo se mantienen mediante APIs públicas y Gateways.
- Verificación local: `tsc --noEmit -p apps/api/tsconfig.json`, `git diff --check` y `node apps/api/scripts/check-architecture.js` completan sin errores. Las pruebas unitarias/de integración y la verificación en producción quedan pendientes; no se afirma que el despliegue esté validado.
