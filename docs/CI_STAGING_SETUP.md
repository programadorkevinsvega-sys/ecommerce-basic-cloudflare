# CI, staging y protección de main

## Alcance de esta entrega

El workflow de CI usa runtimes actuales de GitHub Actions y Gitleaks v3. El job de staging solo se ejecuta por `workflow_dispatch`, usa secretos de Actions exclusivos para staging, migra la D1 cuyo nombre está fijado a `ecommerce-vega-staging` y despliega el Worker `ecommerce-basic-cloudflare-staging`. No contiene un paso de despliegue a producción.

La configuración de staging se deja con IDs deliberadamente sin completar. Hasta registrar los IDs reales, `pnpm staging:check` y el despliegue deben fallar. La protección de `main` requiere una configuración de administración del repositorio y no se activa desde un workflow.

## Previews de ramas en Cloudflare Workers Builds

Los builds de ramas usan `npx wrangler preview`. Las dos configuraciones Wrangler contienen un bloque `previews.vars` explícito con `ENVIRONMENT=preview`, Wompi en sandbox y remitente de Resend de prueba. **No se copian bindings de D1, KV, R2, Queues ni rate limits de producción.**

Mientras no existan los recursos aislados de staging, Cloudflare puede crear el Preview pero avisará que faltan bindings; el runtime de rutas que necesitan D1, KV, R2 o Queues no está listo para pruebas funcionales. Esto es intencional y evita exponer datos productivos. Tras crear recursos reales y exclusivos, agrega sus bindings en el bloque `previews` tanto en `wrangler.jsonc` como en `apps/api/wrangler.jsonc`, con IDs/nombres distintos de producción, y ejecuta `pnpm cloudflare:check-bindings`. Nunca sustituyas este aislamiento copiando IDs productivos.

## 1. Crear recursos Cloudflare independientes

Usa una **cuenta Cloudflare dedicada a staging** y crea allí los recursos. El `CLOUDFLARE_STAGING_ACCOUNT_ID` de GitHub debe ser esa cuenta, nunca la cuenta de producción. Crea el API token de staging con los permisos mínimos para Worker Scripts, D1, R2, Workers KV y Queues en esa cuenta, sin permisos de escritura sobre producción. Si no puedes separar cuentas, usa únicamente un token realmente limitado a recursos staging; no continúes con un token que pueda modificar Workers/D1 productivos. Crea estos recursos (no reutilices ningún identificador productivo):

```bash
pnpm exec wrangler d1 create ecommerce-vega-staging
pnpm exec wrangler r2 bucket create ecommerce-vega-staging
pnpm exec wrangler kv namespace create ecommerce-vega-staging-cache
pnpm exec wrangler queues create ecommerce-vega-events-staging
pnpm exec wrangler queues create ecommerce-vega-events-dlq-staging
```

Copia el UUID D1 y el ID KV devueltos en `apps/api/wrangler.staging.jsonc`, reemplazando ambos valores `REPLACE_WITH_...`. No cambies los nombres reservados de D1, R2, Queue o DLQ. Los namespace_id de rate limiting ya son distintos de producción.

La ruta de staging no declara dominio custom: Cloudflare asignará el subdominio `workers.dev`. Habilita también Cloudflare Images en la cuenta de staging, porque la binding `IMAGES` opera a nivel de cuenta. No reutilices el servicio Images de producción. Las imágenes/media de negocio sí deben ir al bucket R2 de staging. Para pruebas de archivos usa exclusivamente datos sintéticos.

Después de editar el archivo, ejecuta:

```bash
pnpm staging:check
```

La comprobación rechaza IDs pendientes, rutas custom, recursos productivos compartidos y claves privadas en `vars`.

## 2. Preparar secretos de staging

En Settings → Secrets and variables → Actions, agrega como *repository secrets*:

- `CLOUDFLARE_STAGING_API_TOKEN`: token dedicado a staging, sin permisos de producción.
- `CLOUDFLARE_STAGING_ACCOUNT_ID`: cuenta Cloudflare que contiene los recursos de staging.

El workflow es manual (`workflow_dispatch`) y usa nombres de secretos exclusivos para staging. No reutilices un token que pueda modificar producción. En repositorios privados de GitHub Free no están disponibles GitHub Environments ni sus environment secrets; con GitHub Pro o superior se puede crear el Environment `staging`, mover allí esos secretos y añadir `environment: staging` al job para habilitar aprobaciones/reglas de despliegue.

En Cloudflare, configura por separado los Worker secrets de staging. Nunca copies valores de producción; también crea `ADMIN_PASSWORD` como secreto independiente y define `ADMIN_EMAIL` en las variables del Worker:

```bash
pnpm exec wrangler secret put ADMIN_PASSWORD --config apps/api/wrangler.staging.jsonc
pnpm exec wrangler secret put WOMPI_PRIVATE_KEY --config apps/api/wrangler.staging.jsonc
pnpm exec wrangler secret put WOMPI_INTEGRITY_SECRET --config apps/api/wrangler.staging.jsonc
pnpm exec wrangler secret put WOMPI_EVENTS_SECRET --config apps/api/wrangler.staging.jsonc
pnpm exec wrangler secret put RESEND_API_KEY --config apps/api/wrangler.staging.jsonc
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY --config apps/api/wrangler.staging.jsonc
```

Usa credenciales Wompi test y la API key de Resend autorizada para pruebas. `WOMPI_ENVIRONMENT=sandbox` ya está fijado en el config. Configura `ADMIN_EMAIL` como variable con un correo de prueba y `WOMPI_PUBLIC_KEY` como variable de staging con prefijo `pub_test_` (el preflight rechaza una llave pública live). Configura también `TURNSTILE_SITE_KEY` y `TURNSTILE_HOSTNAMES` con los valores del entorno de staging. El hostname `workers.dev` se conoce tras el primer despliegue; actualízalo antes de probar registro/login. El secreto `ADMIN_PASSWORD`, la llave privada de Wompi y el resto de secretos deben ser creados exclusivamente para staging. El remitente por defecto es `onboarding@resend.dev`, sujeto a las restricciones de Resend.

MiPaquete y Factus quedan sin credenciales ni endpoints en staging hasta que exista una estrategia de sandbox aprobada. No apuntes esos adaptadores a servicios reales.

## 3. Ejecutar CI y desplegar staging

1. Abre una PR desde la rama de trabajo hacia `main`. Revisa que completen ambos checks: `Lint, Arquitectura y Aislamiento de Tablas` y `Escaneo de Secretos (Gitleaks)`.
2. Para desplegar, entra a Actions → `Deploy Staging` → Run workflow, selecciona la rama que se desea probar.
3. El workflow valida aislamiento, aplica las migraciones de forma idempotente a `ecommerce-vega-staging` y despliega únicamente el Worker de staging.
4. Verifica `/health`, logs del Worker y smoke tests de storefront/admin. Ejecuta un checkout Wompi test y confirma el pago por webhook sandbox; verifica también contra entrega, notificaciones de prueba, Queue y DLQ.

La ejecución del workflow no cambia bindings ni rutas de producción. La configuración de Workers Builds asociada a `main` sigue siendo el mecanismo separado de publicación productiva.

## 4. Protección efectiva de main

**Restricción del plan:** este repo es privado. GitHub documenta que Branch protection y Rulesets en repositorios privados requieren GitHub Pro, Team o Enterprise; en GitHub Free solo están disponibles para repositorios públicos. No hagas público este repositorio para obtener esa función. Actualiza el plan de la cuenta a GitHub Pro o superior y después, en Settings → Rules → Rulesets (o Settings → Branches → Branch protection rules), crea una regla dirigida exactamente a `main`:

- Exigir Pull Request para integrar cambios.
- Exigir los checks `Lint, Arquitectura y Aislamiento de Tablas` y `Escaneo de Secretos (Gitleaks)`.
- Exigir que la rama esté actualizada antes de integrar.
- Exigir una aprobación independiente cuando exista otro colaborador disponible; si el propietario es el único colaborador, no fijar una aprobación que haga imposible integrar sus propias PRs.
- Descartar aprobaciones obsoletas tras nuevos commits y exigir aprobación del último push cuando aplique.
- Bloquear force-push y eliminación de `main`.
- Aplicar la regla a administradores (sin bypass rutinario).

Verifica después por API/UI que la protección/ruleset está activo y que una PR con un check fallido no puede fusionarse. Si el plan no se actualiza, `main` seguirá sin protección efectiva: Actions checks por sí solos no impiden pushes directos ni merges. Actualiza `ROADMAP.md` solo tras comprobarlo. El manifiesto de rama no sustituye la evidencia de protección.

## 5. Ensayo de recuperación en staging

No se ha ejecutado aún un rollback real: primero deben existir los recursos y un despliegue funcional de staging. Una vez creado:

1. Registra fecha UTC, commit, ID/versión estable del Worker y estado inicial de `/health`.
2. Crea datos sintéticos y realiza una compra Wompi sandbox; conserva reference/transaction ID de test, no secretos ni PII real.
3. Despliega un commit candidato y verifica salud, checkout sandbox, webhook idempotente, Queue/DLQ, R2 y logs.
4. Revierte el Worker al deployment estable anterior usando Wrangler y confirma el deployment objetivo antes de aceptar la operación interactiva. No ejecutes `wrangler rollback` a ciegas.
5. Comprueba que D1 conserva el ledger y los registros de prueba, que R2 conserva sus objetos y que los mensajes se reconcilian sin duplicados. Un rollback del Worker no revierte D1, R2 ni Queues.
6. Ensaya Time Travel únicamente sobre la D1 de staging o una D1 temporal desechable: registra bookmark/fecha antes, aplica un cambio de prueba, restaura el punto de recuperación y verifica esquema/datos. No ejecutes restore sobre producción.
7. Compara transacciones Wompi sandbox con pedidos/pagos, comprueba reservas de inventario, notificaciones idempotentes y DLQ antes de reabrir tareas.
8. Guarda IDs de deployments, commit antes/después, migraciones/ledger, comandos, resultados de smoke tests, bookmarks, reconciliación y responsable.

### Registro de evidencia

| Campo | Valor |
|---|---|
| Fecha/hora UTC y responsable | Pendiente |
| Commit estable / commit candidato | Pendiente |
| Worker deployments antes / después / rollback | Pendiente |
| D1 staging y bookmarks antes / después | Pendiente |
| Ledger de migraciones | Pendiente |
| Wompi sandbox: referencias reconciliadas | Pendiente |
| R2, Queues y DLQ | Pendiente |
| Health y smoke/E2E | Pendiente |
| Incidencias y resultado | Pendiente |

La Fase 0 permanece parcial hasta que staging esté aislado, la CI se ejecute con checks verdes, `main` tenga protección comprobada y el ensayo de recuperación esté documentado con evidencia real.
