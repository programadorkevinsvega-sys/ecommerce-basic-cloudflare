# AGENTS.md — Lee esto antes de hacer cualquier cosa

Este archivo es el punto de entrada para cualquier agente de IA (Claude, Codex, Copilot, Cursor, etc.) y para cualquier desarrollador que trabaje en este repositorio: **ecommerce profesional 100% Cloudflare, sin Cloudflare Containers**.

**No escribas, modifiques ni revises código hasta haber leído los documentos de la sección 1.** Si no puedes leerlos, detente y avisa; no trabajes de memoria ni "por intuición".

---

## 1. Lectura obligatoria (en este orden)

| # | Archivo | Para qué | Cuándo |
|:-:|---|---|---|
| 1 | [`ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md`](./ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md) | Contrato de arquitectura: Worker único, D1 única con prefijos, módulos, Gateways, Queues, capas DDD, 200 líneas por archivo, testing | **Siempre, completo** |
| 2 | [`SECURITY_RULES.md`](./SECURITY_RULES.md) | Reglas de seguridad `SEC-*`, checklist de PR, matriz de certificación | **Siempre, completo** |
| 3 | [`ROLLBACK_RECOVERY.md`](./ROLLBACK_RECOVERY.md) | Releases, migraciones compatibles, rollback, reconciliación de pagos, Queues y caché | **Siempre**; con especial atención si tocas D1, Queues, R2, caché o pagos |
| 4 | [`README.md`](./README.md) | Alcance, stack, módulos, reglas comerciales (contra entrega, envío local/nacional, crédito), rutas, decisiones abiertas | **Siempre** (sección 0 y la sección que afecte a tu tarea) |
| 5 | [`ROADMAP.md`](./ROADMAP.md) | Fases, entregables y qué reglas aplican a cada fase | Para ubicar tu tarea en su fase |
| 6 | `docs/PROJECT_RULES.md` y `docs/adr/*` | Decisiones concretas del proyecto y ADRs | Cuando existan (se crean en la Fase 0) |
| 7 | `docs/migrations/manifest.md` | Registro de migraciones por módulo y entorno | Si tocas D1 |

Además, antes de editar un módulo existente, lee su `module.public-api.ts`, su `module.config.ts` y `src/composition-root.ts`.

**Prioridad si hay conflicto entre documentos:** 1 (arquitectura) > 2 (seguridad) > 3 (rollback) > 4–5 (README/roadmap). Si una petición del usuario contradice una regla, **señálalo antes de generar código**. Una excepción solo es válida si se documenta en un ADR o PR y se aprueba explícitamente.

---

## 2. Antes de implementar (checklist previo)

- [ ] Identifiqué la **fase** del roadmap y releí su "Contrato aplicable" y su "Seguridad y recuperación".
- [ ] Sé en qué **bounded context** (`src/modules/<contexto>`) va el cambio y no necesito tocar otro módulo.
- [ ] Si necesito datos de otro módulo, usaré un **Gateway** (o un evento por Queue), nunca un import ni un JOIN.
- [ ] Sé qué reglas `SEC-*` aplican (propiedad por sesión, validación Zod, importes en servidor, RBAC, webhooks, sanitización…).
- [ ] Sé si el cambio afecta D1, Queues, R2 o caché y cómo seguirá siendo **compatible con rollback**.
- [ ] El requerimiento **puede correr en un Worker**. Si no (proceso continuo, Python nativo, GPU, demonio TCP): **detente y pregunta** (Cloudflare Containers vs. VM externa). Nunca improvises.
- [ ] Hay ambigüedad de negocio sin resolver (por ejemplo, el alcance de "productos a crédito", ADR-0009): **pregunta** en lugar de suponer.

---

## 3. Reglas que nunca se rompen

**Arquitectura**
- Un solo Worker y una sola D1; tablas con el prefijo del módulo (`<modulo>_*`).
- Prohibido: imports entre módulos, JOINs/subconsultas/vistas/triggers/FKs/`db.batch()` entre prefijos, BFF que importe internals de un módulo.
- `domain/` y `application/` no importan tipos de Cloudflare (`D1Database`, `R2Bucket`, `KVNamespace`, `Queue`) ni librerías HTTP.
- **Máximo 200 líneas por archivo**, una responsabilidad pública por archivo, nombre de archivo = nombre de lo que exporta. Prohibidos `utils.ts` y `helpers.ts`.
- Gateways cableados **solo** en `src/composition-root.ts`.
- BFF (Hono) sin lógica de negocio; los frontends tampoco la tienen.
- Eventos por Queues con schema Zod versionado, outbox por módulo, ack manual, handlers idempotentes y DLQ.

**Seguridad y negocio**
- `customerId`/`adminId` salen **solo de la sesión validada**; todo recurso de cliente se consulta filtrando por propiedad y un recurso ajeno responde **404**.
- Nunca confiar en precios, totales, descuentos, roles o método de pago enviados por el cliente: el servidor recalcula, con importes en enteros (centavos COP).
- Pagos con **Wompi**: se confirman solo por webhook con firma verificada, idempotente y **reconciliado con la API de Wompi**; jamás por la redirección del navegador. Nunca tocar ni registrar datos de tarjeta.
- Email con **Resend** detrás de `IEmailPort`; envío por Queue con idempotencia.
- Reglas de contra entrega, cobertura de envío y crédito viven en el **dominio de `orders`** (README §5.1), no en el BFF ni en el frontend.
- Admin: RBAC denegar por defecto, auditoría de toda mutación, MFA y re-autenticación en acciones críticas.
- Contenido editable sanitizado; redirecciones solo a destinos propios; JSON-LD serializado de forma segura.
- Nada de secretos, datos de tarjeta ni PII en el repositorio, logs, URLs o respuestas. Logs JSON estructurados con `trace_id`.

**Honestidad del estado**
- No declares algo "probado", "certificado" o "COMPLETE" sin evidencia reproducible (tests o verificación documentada). Los estados de seguridad y rollback están **PENDIENTES** hasta que la haya.
- No inventes endpoints, bindings, tablas o módulos que no existan: verifica en el código.

---

## 4. Al terminar una tarea

1. Tests en verde: unitarios, integración (Miniflare / `@cloudflare/vitest-pool-workers`), **acceso cruzado entre clientes** si hay datos de usuario, y el **test de aislamiento de tablas** si hay SQL.
2. Lint de arquitectura sin violaciones (imports, 200 líneas, prefijos).
3. *Definition of Done* del contrato (§19) y **checklist de PR** de `SECURITY_RULES.md`.
4. Migraciones nuevas: solo tablas de tu módulo, compatibles hacia atrás (expand/contract) y registradas en `docs/migrations/manifest.md`.
5. Actualiza README/ROADMAP/ADR si tomaste o cambiaste una decisión.
6. En tu respuesta final indica: qué hiciste, qué reglas aplicaste, qué quedó pendiente o sin verificar y cualquier excepción o duda abierta.

---

## 5. Contexto rápido del proyecto

- **Stack:** TypeScript, Hono + Zod/OpenAPI, D1, R2, KV, Queues, Cron, Pages (SSR para la tienda, SPA para el admin).
- **Pagos:** Wompi (COP). **Email:** Resend. **Sin Cloudflare Containers.**
- **Módulos:** `identity`, `catalog`, `media`, `inventory`, `cart`, `orders`, `payments`, `shipping`, `credit`, `promotions`, `storefront`, `cms`, `seo`, `settings`, `notifications`, `audit`.
- **Reglas comerciales por producto:** pago contra entrega sí/no, envío nacional o local (ciudad/municipio), venta de contado/crédito, descuentos vía `promotions`.
