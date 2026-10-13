# Progreso de auditoría integral

## Plan y estado

1. **Diagnóstico SQL/arquitectura:** completado para los archivos SQL y repositorios D1 encontrados. Inventario y matriz estática en `docs/migrations/schema-audit.md`.
2. **Correcciones de seguridad y operaciones:** implementadas en las rutas revisadas de catálogo, pedidos, pagos, realtime, storefront, settings y SEO. Se aplicó ownership en pedidos y se recalcula el checkout en servidor.
3. **Migraciones:** fuente canónica bajo `apps/api/src/modules/*/infrastructure/persistence/d1/migrations`; generador root y wrapper reproducibles. Añadidas pagos v3 y realtime v3; reconciliación remota descrita en `docs/migrations/manifest.md`.
4. **Banners:** corregida persistencia/lectura de descripción, tipo, CTA, ubicación, vigencia y orden; ampliado formulario de edición. Funciones de administración y ubicaciones públicas siguen incompletas.
5. **Validación y documentación:** verificaciones locales completadas; la auditoría integral no queda certificada como lista para producción debido a los pendientes abajo.

## Hallazgos corregidos

- `payments_cod_collections` no tenía `receipt_number` ni `created_at`; migración expand-only aplicada y verificada en D1 remoto.
- Estado `realtime_notifications.read` sincronizado con `is_read`; se verificó que no hay discrepancias restantes.
- Los upserts de banners omitían campos editables y las consultas públicas no filtraban estado/vigencia; corregido.
- El endpoint de pedidos confiaba en precios, totales y líneas del navegador; ahora deriva producto, precio, promociones/cupón, tarifa de zona e impuesto del servidor. Rechaza productos privados/cantidades/stock inválidos y confirma políticas de envío/COD.
- La reserva de inventario podía devolver `success: false` sin lanzar; ahora el pedido se cancela y responde conflicto.
- Se añadieron verificaciones de autorización a controladores administrativos auditados; el wildcard de permisos se interpreta por recurso (`catalog:*`).
- La consulta pública del catálogo ya no admite forzar estados privados; el checkout de resultado no muestra PII.
- Generador de migraciones antes dependía del cwd y mezclaba salidas; ahora usa una fuente definida y copias fijas sin borrar históricos.

## SQL y estado remoto

- Hay 27 migraciones canónicas y 54 copias generadas (27 bajo `migrations/` y 27 bajo `apps/api/migrations/`), 81 archivos SQL contabilizados.
- Matriz tabla/columnas/índices/restricciones y repositorios consultores: `docs/migrations/schema-audit.md`.
- Wrangler remoto indicó 15 migraciones históricas pendientes en su ledger pese a que los esquemas ya existían. Se inspeccionó el esquema, se aplicó DDL idempotente para índices/semillas faltantes, se sincronizó realtime y se registraron esas 15 entradas existentes. Luego Wrangler aplicó pagos v3. El ledger quedó en 27, columnas COD presentes y `read != is_read` devolvió cero. No se insertaron pedidos/pagos de prueba ni se desplegó el Worker.
- Bookmarks de D1 y secuencia de reconciliación: `docs/migrations/manifest.md`.
- Wrangler 3 no ordena correctamente los nombres `<módulo>__NNNN` al aplicar desde una base vacía. El intento local falló al ejecutar settings v2 antes de v1. SQLite automatizado sí cubre DDL, pero no sustituye Miniflare/Workers D1.

## Archivos principales modificados/creados

Controladores BFF de catálogo, pedidos, pagos, realtime, SEO, settings y storefront; helpers de pricing/policy de pedidos; `D1StorefrontContentRepository`; middleware y entidad de roles; vistas del checkout/admin; fuentes y copias de migraciones; ambos generadores; scripts de consistencia/upgrade SQLite; CI y `package.json`; `SECURITY_RULES.md`, `ROLLBACK_RECOVERY.md`, manifiesto/matriz de migraciones y este archivo.

## Verificaciones ejecutadas

- `node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json` — correcto.
- `node_modules/.bin/vitest run` desde `apps/api` — 8 archivos, 21 pruebas correctas (incluye ownership entre clientes, permisos, aislamiento y precios manipulados/producto borrador/cantidad/stock).
- `node scripts/check-table-isolation.js && node scripts/check-architecture.js` desde `apps/api` — correcto.
- `node scripts/check-migration-consistency.js` — fuentes y ambas copias coinciden.
- `python3 scripts/verify-migration-upgrades.py` — 67 tablas desde cero y actualización fixture; COD, banner, timestamp y estado leído verificados.
- `node_modules/.bin/wrangler deploy --dry-run --config apps/api/wrangler.jsonc` — build Worker correcto (dry-run; no despliegue).
- Wrangler remoto: esquema verificado, 27 migraciones registradas, 0 pendientes.
- `git diff --check` — correcto.

## Pendientes / riesgos abiertos

- No se completó una auditoría exhaustiva de cada controlador y caso de uso de todos los módulos.
- No se probó un webhook Wompi contra firma/API real ni reconciliación remota; validar esto antes de certificar pagos en producción.
- No se implementaron pruebas del endpoint de checkout para fallo de reserva; la rama ahora comprueba el resultado `success` y cancela.
- No se validó cobertura de imágenes R2, MIME real, URLs externas o limpieza de huérfanos; tampoco se hizo operación de prueba con R2.
- El panel de banners aún no tiene todas las funciones pedidas (filtros/búsqueda, duplicar, preview y confirmación completa); ubicaciones secundarias no tienen páginas públicas implementadas en esta pasada.
- No se añadió rate limiting/CSRF global ni se certificaron webhooks, idempotencia financiera, MFA o auditoría de cada mutación.
- No se hicieron pruebas de integración con runtime Workers/Miniflare. pnpm no pudo ejecutar por `ERR_PNPM_LOCKFILE_WRITE_FILE`; se invocaron binarios instalados directamente.
- No se ejecutó `lint` mediante pnpm por ese bloqueo. La comprobación de arquitectura equivalente sí pasó.
- No se desplegó el Worker. La migración D1 y el push remoto de Git sí fueron autorizados por el usuario.
- Git: commit `c48622f` en `main`, publicado a `origin/main`; árbol de trabajo limpio al terminar.
