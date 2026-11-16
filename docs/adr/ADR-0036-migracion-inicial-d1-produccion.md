# ADR-0036: Inicialización de la D1 de producción sin ensayo en staging

## Estado

Aceptada — 2026-11-16. Excepción puntual autorizada explícitamente por el propietario para aplicar las migraciones a la D1 de producción recién creada.

## Contexto

La configuración local de producción apunta a `ecommerce-vega-production` (`a92eda84-2320-4bb1-99ed-c3c01f8c7c1b`), creada vacía el 2026-11-16. El inventario remoto confirmó que no contiene esquema de aplicación ni ledger. El endpoint de salud productivo responde HTTP 500; la versión activa del Worker aún referencia la D1 anterior (`bfb3ba3f-5e2a-4c33-9b93-0a5d7c04b6ef`). La configuración de staging pasa la validación estática, pero la D1 de staging configurada no aparece en la cuenta Cloudflare consultada, por lo que no se pudo ejecutar allí el ensayo.

## Decisión y alcance

- Como excepción única al requisito de ensayo previo en staging, aplicar con el runner documentado las 90 migraciones canónicas verificadas localmente, solo a la D1 nueva e inicialmente vacía.
- Usar el bookmark Time Travel existente como referencia previa; no restaurar ni eliminar la base como parte del rollback normal.
- No desplegar ni cambiar el Worker en esta operación. La versión activa seguirá apuntando a la D1 anterior hasta un despliegue separado autorizado.
- Registrar ledger, esquema, conteos de semillas y bookmark posterior en `docs/migrations/manifest.md`.

## Evidencia previa

- `pnpm db:check-migrations`: fuentes canónicas y copias coinciden.
- `pnpm db:test-migrations`: actualización desde esquemas vacíos y heredados aprobada.
- `pnpm db:test-wrangler-migrations`: 90 migraciones aplicadas en D1 local y segunda pasada idempotente.
- Bookmark remoto previo: `00000001-00000000-00005125-e78d14cbdb4431fb5df8f868307c384e`.

## Consecuencias y recuperación

La D1 está vacía antes de la operación, por lo que la inicialización no reemplaza datos de negocio existentes. Las migraciones y semillas permanecen aunque se revierta el Worker. No restaurar el bookmark como rollback rutinario. La operación no restablece por sí sola el servicio: la versión productiva observada conserva el binding antiguo y requiere una decisión de despliegue independiente.

## Resultado — 2026-11-16

Se aplicaron las 90 migraciones. El ledger remoto contiene 90 entradas y el esquema 99 tablas incluyendo `d1_migrations`. Bookmark posterior: `00000002-00000232-00005125-b22085c817c3befc793e1911ddc5365d`. Verificación: 3 productos en borrador, 3 variantes, 0 stocks y 0 reseñas; 9 páginas, 1 artículo y 2 menús; 4 zonas, 19 ubicaciones, 48 municipios y 3 perfiles de paquete; 4 roles y 1 secuencia de facturación. Banners, anuncios, reglas, cupones y reglas de envío gratis iniciales permanecen inactivos. No se desplegó el Worker. `/health` sigue en HTTP 500 y la versión activa conserva el binding D1 anterior.
