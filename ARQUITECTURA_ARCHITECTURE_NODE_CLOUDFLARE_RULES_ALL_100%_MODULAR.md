# Reglas Estrictas de Arquitectura — Monolito Modular Serverless en Cloudflare (Node / TypeScript)
## DDD + Clean Architecture + Hexagonal + SOLID + Cloudflare Ecosystem


> **Propósito de este documento:** este archivo es el contrato de arquitectura que debe respetarse en TODO momento al crear o modificar código en cualquier proyecto TypeScript / Node.js diseñado para ejecutarse en la plataforma **Serverless de Cloudflare** (Workers, Pages, D1, Queues, R2, KV, Durable Objects, Hyperdrive). Debe entregarse como contexto/system prompt a cualquier agente (Claude, Codex, Copilot, etc.) antes de generar código.
>
> Ninguna regla aquí es "sugerencia": son restricciones obligatorias. Si una petición del usuario contradice una regla, el agente debe señalarlo antes de generar código que la viole.
>
> Este documento es **agnóstico al dominio de negocio**. No asume CRM, e-commerce, trading, fintech, ERP, SaaS, logística, salud, educación ni ningún otro dominio concreto.
>
> En el proyecto real, los nombres de módulos, entidades, agregados, casos de uso, eventos y recursos deben corresponder al dominio real del negocio, pero la disciplina arquitectónica y los límites definidos aquí deben mantenerse.


---


# 0. Objetivo estratégico (léelo primero)


Este es un **monolito modular serverless nativo de Cloudflare, desplegado como un único Worker (un solo binario), con una única base de datos D1 dividida lógicamente por módulo, y preparado para fisión a microservicios/workers independientes**.


Eso significa:


- El **BFF y todos los módulos viven en el mismo Worker y en el mismo despliegue**, ejecutándose sobre el runtime **`workerd` (V8 Isolates)** de Cloudflare. No se crean Workers separados mientras no exista una necesidad real.
- Cada módulo/bounded context se comporta como un servicio aislado con límites estrictos: es dueño exclusivo de sus **tablas (prefijo propio) dentro de la D1 única**, de su dominio, de sus casos de uso y de sus puertos.
- **Ningún módulo importa código interno de otro módulo directamente.** Tampoco lo hace el BFF. La única comunicación permitida es a través de:
  - (a) el contrato público del módulo (`module.public-api.ts`), consumido **SIEMPRE mediante un Gateway** (interfaz/puerto definido por quien llama). Hoy el Gateway se implementa con un **adaptador en proceso** (llamada directa a la API pública, sin red). Si el módulo se separa, ese adaptador se reemplaza por un **adaptador de Service Binding / RPC tipado**, o
  - (b) eventos de integración asíncronos publicados en **Cloudflare Queues** (hoy productor y consumidor pueden estar en el mismo Worker).
- Si en el futuro un módulo se extrae a un Worker independiente, el cambio se limita a:
  - crear su propio Worker con su `wrangler.jsonc`,
  - crear su propia D1 y mover solo las tablas con su prefijo (al no existir FKs ni JOINs cruzados, la copia es directa),
  - reemplazar, en el composition root, el adaptador en proceso por el adaptador de Service Binding (una línea de wiring por Gateway).
- **Ni el dominio, ni la aplicación, ni los controladores del BFF, ni los demás módulos deben tocarse**, porque el contrato del Gateway y los eventos de Cloudflare Queues ya están desacoplados desde el día uno.
- Por eso: trata cada carpeta bajo `src/modules/<nombre>` como un "servicio en potencia" con su propio dominio, aplicación, infraestructura, tablas y puertos de entrada/salida.
- Esta arquitectura es una excepción documentada a los patrones "una DB por módulo" y "Service Bindings obligatorios entre componentes". Ver **ADR-0001** en la sección 23.


---


## REGLA FUNDAMENTAL: Módulos No-Serverless y Procesos Continuos (Python / VMs / Contenedores)


> [!IMPORTANT]
> **REGLA DE DETECCIÓN Y CONSULTA OBLIGATORIA PARA EL AGENTE:**
> 
> Los Workers de Cloudflare están basados en ejecución Serverless efímera por evento/petición. Si el proyecto requiere un módulo o componente que **NO puede ejecutarse dentro de los límites de Cloudflare Workers** (por ejemplo: procesos en segundo plano de ejecución continua 24/7, procesamiento intensivo en Python con librerías nativas como NumPy/PyTorch/Pandas, renderizado pesado de video/GPU, demonios TCP persistentes tradicionales o software de terceros no compatible con V8 isolates):
>
> 1. **El agente TIENE PROHIBIDO intentar forzar código incompatible dentro de un Cloudflare Worker o improvisar atajos.**
> 2. **El agente DEBE DETENERSE y PREGUNTAR explícitamente al usuario:**
>    - **Opción A:** Desplegar ese módulo específico en **Cloudflare Containers / Cloudflare Container Applications** (la solución de ejecución basada en contenedores de Cloudflare).
>    - **Opción B:** Desplegar ese módulo como **Servicio Externo en una Máquina Virtual / Contenedor dedicado (Docker, VPS, Kubernetes, AWS ECS, Fly.io, Railway)**, comunicándose de forma segura con los Workers de Cloudflare mediante HTTPS/REST con mTLS o tokens de autenticación internos.


---


## Capas de la arquitectura completa (de afuera hacia adentro)


1. **Frontend** (Cloudflare Pages):
   - sin lógica de negocio;
   - SPA (React, Vue, Svelte) o SSR alojado en **Cloudflare Pages**;
   - consume los endpoints **REST/HTTP** del BFF;
   - maneja presentación, estado de UI y validaciones superficiales de entrada.


2. **BFF (REST API Gateway, dentro del mismo Worker)**:
   - sin lógica de negocio;
   - implementado con **Hono** (o la API nativa de Cloudflare Workers) con validación **OpenAPI / Zod**;
   - adapta y compone respuestas REST;
   - se comunica con los módulos exclusivamente mediante **Gateways** (interfaces propias del BFF). Hoy el adaptador es en proceso; si un módulo se separa, el adaptador pasa a ser un **Service Binding** tipado;
   - nunca importa dominio, aplicación ni infraestructura de un módulo;
   - puede existir uno o varios BFF según las necesidades del proyecto, pero cada uno debe respetar estas reglas.


3. **Módulos del monolito modular (Bounded Contexts Serverless)**:
   - únicos dueños de su lógica de negocio;
   - dueños de su dominio;
   - dueños de sus casos de uso;
   - dueños de sus **tablas dentro de la D1 única** (prefijo `<modulo>_*`), y de su persistencia en **Hyperdrive** (PostgreSQL acelerado), **Durable Objects** (estado transaccional con SQLite integrado) o **Cloudflare R2** (object storage, con keys prefijadas por módulo);
   - exponen su `module.public-api.ts`, consumido solo a través de Gateways;
   - se comunican entre sí de forma síncrona mediante Gateways y de forma asíncrona mediante **Cloudflare Queues**.


4. **Infraestructura transversal**:
   - bootstrap y exportador de Worker (`fetch`, `queue`, `scheduled`);
   - composition root único donde se cablean los Gateways;
   - configuración centralizada mediante variables y secrets de Cloudflare (`env`);
   - logging estructurado en JSON (`console.log(JSON.stringify(log))`);
   - tracing y métricas distribuidas con **OpenTelemetry OTLP** / **Workers Analytics Engine**;
   - tareas programadas con **Cron Triggers**.


---


### Regla de nombres


**Los nombres de módulos siempre deben ser genéricos en este documento.**


Ejemplos:


```text
module-a
module-b
module-c
```


En el proyecto real:


```text
src/modules/<nombre-real-del-contexto>
```


El nombre real debe representar un **bounded context** del dominio, no una capa técnica.


---


## 0.1 Diagrama canónico de la arquitectura en Cloudflare


Este es el diagrama de referencia obligatorio:


```text
Frontend (Cloudflare Pages)
   │
   │ HTTP fetch / REST
   ▼
┌─────────────────────────────────────────────────────────────────┐
│  UN SOLO WORKER (un solo binario / un solo despliegue)          │
│                                                                 │
│  BFF (Hono) — sin lógica de negocio                             │
│     │  Gateways (puertos del BFF y de cada módulo)              │
│     │  adaptador en proceso (hoy)  →  Service Binding (mañana)  │
│     ▼                                                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  module-a            module-b            module-c      │     │
│  │  (public-api)        (public-api)        (public-api)  │     │
│  │  tablas a_*          tablas b_*          tablas c_*    │     │
│  └────────────────────────────────────────────────────────┘     │
│     │                                                           │
│     ▼                                                           │
│  D1 única (env.DB) — límites lógicos por prefijo de tabla       │
│  R2 (keys por prefijo)   ·   KV (keys namespaced)               │
│     │                                                           │
│     ▼                                                           │
│  Cloudflare Queues (eventos entre módulos)                      │
└─────────────────────────────────────────────────────────────────┘
        │ (Si existe módulo continuo/Python)
        ▼
┌────────────────────────────────┐
│  Preguntar al usuario:         │
│  1. Cloudflare Container       │
│  2. VM Externa / VPS / Docker  │
└────────────────────────────────┘
```


---


## 0.2 Responsabilidad de cada componente en Cloudflare


| Componente | Responsabilidad única | Tecnología Cloudflare estándar |
|---|---|---|
| **Frontend** | UI/presentación. Sin lógica de negocio. | **Cloudflare Pages** (SPA / SSR) |
| **BFF (REST Gateway)** | Adaptación y composición de respuestas REST. Sin lógica de negocio. Vive en el mismo Worker que los módulos. | **Hono** + `@hono/zod-openapi` dentro del Worker único |
| **Gateways** | Contrato síncrono BFF↔módulos y módulo↔módulo. Interfaz + adaptador en proceso (hoy) o adaptador de Service Binding (tras separar). | Interfaces TypeScript + adaptadores en `src/bff/gateways` y `infrastructure/gateways` |
| **Service Bindings** | Solo se usan cuando un módulo ya fue separado a su propio Worker. | Cloudflare Worker Service Bindings (`env.MODULE_X.fetch` / RPC) |
| **Módulo** | Dueño exclusivo de su lógica de negocio: dominio, casos de uso y sus tablas. | Bounded Context aislado en `src/modules/<context>` |
| **DB Relacional** | Fuente de verdad. **Una D1 única**; cada módulo es dueño exclusivo de las tablas con su prefijo. Sin FKs ni JOINs entre prefijos. | **Cloudflare D1** (`env.DB`) o **Hyperdrive** (Postgres) |
| **Durable Objects** | Agregados con consistencia fuerte y coordinación atómica en el edge. | **Cloudflare Durable Objects** con SQLite Storage |
| **Cloudflare Queues** | Comunicación asíncrona entre módulos — eventos de dominio/integración. | **Cloudflare Queues** (con ack manual y DLQ) |
| **Cloudflare R2** | Almacenamiento de archivos, documentos y medios sin costos de egress. Keys prefijadas por módulo. | **Cloudflare R2** (S3-compatible bucket) |
| **Workers KV** | Cache distribuida de lectura ultra-rápida y estado no crítico. | **Cloudflare Workers KV** (lecturas globales eventuales) |
| **Cron Triggers** | Tareas programadas periódicas y Outbox Relay. | **Cloudflare Scheduled Workers** (`scheduled`) |
| **OpenTelemetry / Analytics** | Tracing y métricas de extremo a extremo. | **Workers Analytics Engine** / OpenTelemetry OTLP |
| **k6** | Pruebas de rendimiento y carga sobre los endpoints del Worker. | `k6` contra endpoints públicos |
| **Chaos / Resiliencia** | Validación activa de fallos en D1, Queues y Gateways. | Fault injection / mocks en entorno Miniflare |

---


# 1. Principios SOLID — aplicación obligatoria


| Principio | Regla obligatoria en Cloudflare |
|---|---|
| **S**RP | Una clase/función = una razón para cambiar. Prohibido `utils.ts` o `helpers.ts` genéricos. Casos de uso (`UseCase`) hacen UNA sola acción de negocio. |
| **O**CP | Extender comportamiento mediante nuevas implementaciones de interfaces/puertos, nunca con `if/switch` de tipos. |
| **L**SP | Toda implementación de una interfaz de puerto debe ser sustituible sin romper el contrato. Prohibido lanzar excepciones no declaradas. |
| **I**SP | Interfaces pequeñas y específicas por caso de uso (`IResourceReader`, `IResourceWriter`) en vez de una interfaz gorda con 20 métodos. |
| **D**IP | Las capas de dominio y aplicación jamás dependen de APIs concretas de Cloudflare (`D1Database`, `KVNamespace`, `R2Bucket`, `Queue`). Dependen de interfaces (puertos) definidas en dominio/aplicación. La infraestructura implementa esas interfaces inyectando los bindings de `env`. |

---


# 1.bis Límite de tamaño de archivo y "una función/clase por archivo"


Esta regla es tan obligatoria como SOLID y se verifica en cada archivo generado:


- **Máximo 200 líneas de código por archivo** (sin contar imports, comentarios de licencia ni líneas en blanco).
- Si un archivo se acerca a ese límite, es señal de que está violando SRP y debe dividirse.
- No se "estira" la regla. Se refactoriza.


### Un archivo = una responsabilidad pública principal


Un archivo debe contener:


- una función pública;
- una clase;
- un caso de uso;
- un handler/controlador REST;


según corresponda.


No se permiten archivos "bolsa" con múltiples clases/funciones no relacionadas.


### Nombre de archivo


**Nombre de archivo = nombre de lo que exporta.**


Ejemplo:


```text
ExecuteActionUseCase.ts
```


exporta:


```typescript
export class ExecuteActionUseCase { ... }
```


Evitar `index.ts` como contenedor de lógica (solo re-exports limpios).


---


# 2. Regla de dependencias — Clean Architecture / Hexagonal


```text
        ┌─────────────────────────────────────────────────┐
        │          INFRASTRUCTURE (adapters)               │
        │   Cloudflare D1, Queues, KV, R2, ServiceBindings │
        │  ┌───────────────────────────────────────────┐  │
        │  │           APPLICATION (use cases)         │  │
        │  │           ports in/out, DTOs, mappers     │  │
        │  │  ┌─────────────────────────────────────┐  │  │
        │  │  │            DOMAIN (core)            │  │  │
        │  │  │   entities, VOs, aggregates, rules  │  │  │
        │  │  └─────────────────────────────────────┘  │  │
        │  └───────────────────────────────────────────┘  │
        └─────────────────────────────────────────────────┘
```


### Regla de oro


Las flechas de dependencia (`import`) **SIEMPRE apuntan hacia adentro**.


El dominio:


- no importa aplicación;
- no importa infraestructura;
- no importa tipos de Cloudflare (`@cloudflare/workers-types`, `D1Database`, `R2Bucket`, `KVNamespace`, `Queue`);
- no importa librerías HTTP (`hono`, `itty-router`).


La aplicación:


- no importa infraestructura concreta de Cloudflare;
- depende únicamente del dominio y de los puertos (interfaces) de entrada y salida.


La infraestructura:


- importa los bindings de Cloudflare (`env.DB`, `env.QUEUE`, `env.BUCKET`);
- implementa los puertos definidos por dominio/aplicación.


---


# 3. Estructura de carpetas obligatoria


```text
wrangler.jsonc / wrangler.toml          # Worker ÚNICO: D1 única, Queues, KV, R2


src/
  bff/                                  # API Gateway REST — Hono, dentro del mismo Worker
    controllers/                        # controladores REST (Hono routers), por dominio
    dto/                                # schemas Zod / OpenAPI
    gateways/                           # puertos del BFF hacia cada módulo
      <module>/
        <Module>Gateway.ts              # INTERFAZ: contrato que el BFF necesita
        InProcess<Module>Gateway.ts     # adaptador en proceso (llama a module.public-api)
        # ServiceBinding<Module>Gateway.ts  -> se crea SOLO al separar el módulo
    middleware/                         # CORS, autenticación (vía Gateway), trace_id
    server.ts                           # app Hono del BFF


  modules/
    <bounded-context>/                  # ej: module-a, module-b, etc.
      domain/
        entities/                       # entidades con identidad
        value-objects/                  # objetos de valor inmutables
        aggregates/                     # raíces de agregado + invariantes
        events/                         # domain events internos
        repositories/                   # INTERFACES / puertos de salida
        services/                       # domain services
        errors/                         # errores de dominio tipados


      application/
        use-cases/                      # 1 archivo = 1 caso de uso
        ports/
          in/                           # puertos de entrada
          out/                          # puertos de salida (ICachePort, IEventPublisher, IRepository, I<OtroModulo>Gateway)
        dto/                            # DTOs application
        mappers/                        # domain <-> DTO


      infrastructure/
        persistence/
          d1/                           # implementación concreta Cloudflare D1 (D1 única, solo tablas <modulo>_*)
            repositories/               # implementan domain/repositories
            mappers/                    # persistence <-> domain
            migrations/                 # migraciones SQL PROPIAS del módulo (0001_init.sql), solo tablas del prefijo
          durable-objects/              # implementación de Agregados en Durable Objects (si aplica)


        storage/
          r2/                           # implementación de storage de archivos con Cloudflare R2 (keys prefijadas por módulo)


        cache/
          kv/                           # implementación de ICachePort con Workers KV


        messaging/
          queues/
            publishers/                 # implementación IEventPublisher con Cloudflare Queues
            consumers/                  # handlers de mensajes entrantes (queue handler)
            schemas/                    # contratos versionados (Zod / JSON Schema)


        gateways/                       # adaptadores de salida hacia OTROS módulos (ACL)
          dto/                          # mapeo DTO del otro módulo <-> application DTO


      module.config.ts                  # wiring DI del módulo con inyección de env
      module.public-api.ts              # contrato público: funciones tipadas con DTOs planos serializables


  shared-kernel/                        # SOLO elementos verdaderamente universales
  platform/                             # telemetry, logger JSON, error handling
  composition-root.ts                   # ÚNICO lugar que cablea Gateways (en proceso vs Service Binding)
  index.ts                              # Worker Entrypoint: fetch, queue, scheduled
```


### Quién puede importar `module.public-api.ts`


Únicamente los adaptadores `InProcess<Module>Gateway.ts` y `composition-root.ts`. Ninguna otra capa del BFF ni de otro módulo puede importarlo.


---


# 4. Reglas de DDD


## 4.1 Bounded Context primero


Antes de escribir código:


1. define el lenguaje ubicuo;
2. define los límites del contexto;
3. define qué conceptos pertenecen al contexto.


---


## 4.2 Entidades


Las entidades tienen identidad estable (`id`), mutables mediante métodos de negocio explícitos (`recurso.desactivar()`). Prohibidos los setters genéricos (`recurso.setIsActive(false)`).


---


## 4.3 Value Objects


Inmutables, comparables por valor, auto-validados en el constructor (`Email`, `Money`, `DocumentId`). Prohibido representar VOs como `string`/`number` sueltos en firmas de dominio.


---


## 4.4 Agregados


- Una raíz de agregado (`AggregateRoot`) protege sus invariantes.
- En Cloudflare D1 / SQL: un caso de uso modifica **un solo agregado por transacción `db.batch()`**, y ese batch toca **únicamente tablas del propio módulo** (nunca de otro prefijo).
- Para escenarios de concurrencia extrema o consistencia fuerte en memoria: utilizar **Cloudflare Durable Objects** con almacenamiento SQLite transaccional.


---


## 4.5 Domain Events


Toda mutación de negocio emite un Domain Event interno, mapeado a un **Integration Event** versionado con Zod antes de publicarse a **Cloudflare Queues**.


---


## 4.6 Repositorios


La interfaz vive en `domain/repositories/` orientada a agregados completos (`save`, `findById`, `nextIdentity`). Prohibido exponer queries SQL crudas o D1 prepared statements fuera de `infrastructure/persistence/d1/`.


---


## 4.7 Anti-Corruption Layer (ACL)


Al consumir datos de otro módulo vía Gateway o Cloudflare Queue, traduce SIEMPRE el payload externo al lenguaje ubicuo propio mediante un mapper dedicado.


---


# 5. Reglas de Casos de Uso — Application Layer


- 1 clase/función = 1 caso de uso = 1 archivo (`ExecuteActionUseCase.ts`).
- Recibe un `InputDTO`, devuelve un `OutputDTO` o `Result<T, DomainError>`.
- Orquesta: valida input → recupera agregado vía puerto → ejecuta método de dominio → persiste vía puerto → publica eventos en Cloudflare Queues.
- No contiene reglas de negocio propias.
- Idempotencia garantizada mediante `eventId` / `idempotencyKey`.


---


# 6. Base de datos y Almacenamiento (D1, Hyperdrive, R2)


## 6.1 Propiedad de los datos (D1 única con límites lógicos)


- El proyecto usa **una única base de datos D1** (`env.DB`). Cada módulo es **dueño exclusivo de las tablas con su prefijo** (`<modulo>_*`, ej. `module_a_items`, `module_b_orders`, `module_a_outbox_events`).
- Un repositorio solo lee y escribe tablas de su propio prefijo.
- Prohibidos JOINs, subconsultas, vistas, triggers y **foreign keys** entre tablas de prefijos distintos. La referencia a una entidad de otro módulo es un ID como valor simple (ej. `resource_id TEXT`), sin FK.
- Si necesitas datos de otro módulo, solicítalos vía Gateway (su `module.public-api.ts`) o mantenlos desnormalizados vía Queue.
- Cada `db.batch()` toca únicamente tablas de un módulo. Transacciones que crucen módulos están prohibidas: usar eventos + consistencia eventual (Outbox).
- La regla se hace cumplir con un **test/lint automático** que escanea el SQL de cada módulo y falla si menciona tablas de otro prefijo. La convención por sí sola no es suficiente.
- Esta decisión es una excepción documentada (ADR-0001). Al separar un módulo, sus tablas se copian a su propia D1 sin cambios de esquema.


## 6.2 Migraciones en D1


- Migraciones versionadas por módulo, con numeración independiente, en `infrastructure/persistence/d1/migrations/` (`0001_init.sql`). Solo crean o alteran tablas del prefijo del módulo.
- Como la D1 es una sola, un script de build copia las migraciones de cada módulo al `migrations_dir` de wrangler preservando el módulo en el nombre (`<modulo>__0001_init.sql`) y se aplican con `wrangler d1 migrations apply <DB_NAME>`.
- El script debe poder ejecutarse por módulo, para facilitar la separación futura.


## 6.3 Hyperdrive para bases de datos externas


- Si el proyecto utiliza PostgreSQL/MySQL externo, debe conectarse SIEMPRE a través de **Cloudflare Hyperdrive** (`env.HYPERDRIVE`) para mantener pooling acelerado y latencia de conexión cero desde el edge.


## 6.4 Cloudflare R2 para almacenamiento de objetos


- El almacenamiento de archivos/documentos se realiza exclusivamente mediante **Cloudflare R2** detrás de un puerto `IFileStoragePort` en aplicación.


## 6.5 Outbox Pattern en Cloudflare


Para garantizar consistencia entre la escritura en D1 y la publicación del evento:


1. Insertar el cambio de estado y el evento en la tabla `<modulo>_outbox_events` (una por módulo) dentro de un `db.batch([...])` atómico.
2. Un handler **Cron Trigger** (`scheduled`) o consumer de Cloudflare Queue lee los eventos pendientes, los publica a la Queue de destino y los marca como procesados.


---


# 7. Cache, Workers Cache y KV


- Acceso a KV siempre detrás de un puerto `ICachePort` en `application/ports/out/`.
- Usos permitidos de **Workers KV**:
  - Lecturas de configuración global y cache con tolerancia a consistencia eventual.
  - TTL explícito (`expirationTtl`).
  - Keys namespaced: `<module>:<entity>:<id>:<subresource>`.
- Para cachear respuestas HTTP completas del Worker: usar **Workers Cache**, activado por configuración y controlado con cabeceras HTTP (`Cache-Control`). No confundirlo con Workers KV ni con la Cache API programática (`caches.default`), cuyos objetos se administran explícitamente y tienen otro alcance.
- Las respuestas públicas mutables deben incluir etiquetas `Cache-Tag`; después de confirmar una escritura se purgan con `ctx.cache.purge()` o `cache.purge()` desde el mismo Worker y entrypoint. Una invalidación fallida se registra y debe existir un TTL finito como recuperación.
- Nunca etiquetar ni cachear respuestas con datos personales, autenticados o transaccionales. Esas respuestas llevan `private, no-store`.
- Prohibido usar Workers KV como fuente única de verdad para datos críticos de negocio.


---


# 8. Eventos con Cloudflare Queues


## 8.1 Contrato versionado


Cada evento en Cloudflare Queues tiene un schema Zod explícito (`resource-updated.v1.ts`) con:


```typescript
{
  eventId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  producerModule: string;
  payload: Record<string, unknown>;
  traceId: string;
}
```


## 8.2 Publisher


Implementado en `infrastructure/messaging/queues/publishers/` usando `env.QUEUE.send(event)`.


## 8.3 Consumer y Ack Manual


En el handler `queue(batch, env, ctx)`:


- Procesar cada mensaje de forma individual dentro de un bloque seguro.
- Hacer `message.ack()` únicamente tras confirmar la persistencia exitosa.
- Ante fallos recuperables: hacer `message.retry({ delaySeconds })`.
- Configurar Dead-Letter Queue (DLQ) en `wrangler.jsonc` para mensajes que superen el límite de reintentos.
- At-least-once: los consumidores deben ser **idempotentes**.


---


# 9. BFF, REST y Frontend


## Frontend


- Aloja la UI en **Cloudflare Pages**.
- Sin lógica de negocio. Consume endpoints REST del Worker BFF.


## BFF (Hono dentro del mismo Worker)


- Enrutador HTTP ultra-rápido basado en **Hono** con validación Zod y documentación OpenAPI.
- Controladores adaptadores puros: reciben petición HTTP → validan schema Zod → invocan el **Gateway** del módulo correspondiente (ej. `moduleAGateway.executeAction(input)`).
- Sin lógica de negocio ni acceso directo a D1, R2 o KV de ningún módulo.
- No importa dominio, aplicación ni infraestructura de ningún módulo. Solo los adaptadores `InProcess<Module>Gateway.ts` y `composition-root.ts` pueden importar un `module.public-api.ts`.


---


# 10. Comunicación Síncrona: Gateways (en proceso hoy, Service Bindings mañana)


- Toda comunicación síncrona BFF→módulo y módulo→módulo pasa por un **Gateway**: una interfaz (puerto) definida por el consumidor, con DTOs propios.
- Implementaciones:
  - **En proceso (hoy):** el adaptador llama directamente a `module.public-api.ts` dentro del mismo Worker. Sin red.
  - **Service Binding (tras separar un módulo):** el adaptador usa `env.MODULE_X.fetch` o RPC tipado hacia el Worker del módulo.
- `module.public-api.ts` expone funciones tipadas con **DTOs planos serializables** (sin clases de dominio ni tipos de Cloudflare), de modo que el mismo contrato funcione en proceso y por red.
- Los errores se devuelven como `Result<T, E>` o códigos de error tipados y serializables, nunca como excepciones que dependan del stack.
- El **composition root** (`src/composition-root.ts`) es el único lugar donde se decide qué adaptador usa cada Gateway.


## 10.1 Procedimiento de separación de un módulo


Para extraer `<modulo>` a un Worker propio:


1. Crear el Worker nuevo con `src/modules/<modulo>` y su `wrangler.jsonc` (D1 propia, y R2/Queues propios si aplica).
2. Copiar a la D1 nueva únicamente las tablas `<modulo>_*` y sus migraciones (sin FKs ni JOINs cruzados, no hay dependencias que romper).
3. Exponer el `module.public-api.ts` del Worker nuevo vía fetch/RPC.
4. En el Worker original, crear `ServiceBinding<Modulo>Gateway.ts` y cambiar una línea en `composition-root.ts` para usarlo en lugar de `InProcess<Modulo>Gateway.ts`.
5. Verificar que dominio, aplicación, controladores del BFF y los demás módulos no tuvieron cambios en el diff.


---


# 11. Shared Kernel — uso muy restringido


- `shared-kernel/` SOLO contiene: tipos de utilidad universales (`Result<T,E>`, `UUID`), interfaces base de logging/reloj (`IClock`), y errores base.
- Prohibido compartir entidades o modelos de persistencia entre módulos.


---


# 12. Observabilidad en Cloudflare


- **Logs estructurados:** emitidos en formato JSON mediante `console.log(JSON.stringify(log))` incluyendo: `timestamp`, `service`, `module`, `level`, `trace_id`, `request_id`, `duration`.
- **OpenTelemetry / Analytics:** Exportación OTLP HTTP de trazas y métricas o uso de **Workers Analytics Engine** para métricas en tiempo real.
- Propagación de `traceparent` a través de cabeceras HTTP entre Pages → Worker (BFF) → Gateways (y Service Bindings tras una separación) → Queues.
- Prohibido registrar credenciales, secretos o PII en logs.


---


# 13. SLO / SLA / SLI y Health Checks


- Definir métricas clave: latencia en edge (p50, p90, p95, p99), error rate (< 0.1%), queue processing lag.
- Endpoint de health check `/health` en el Worker BFF verificando disponibilidad de bindings críticos.


---


# 14. Testing — obligatorio, no opcional


- **Unit Testing:** Lógica pura de dominio y use cases sin dependencias de Cloudflare (`vitest`).
- **Integration Testing con Miniflare / Vitest Pool Workers:** Probar D1, KV, Queues y Gateways usando `@cloudflare/vitest-pool-workers` en entorno `workerd` local simulado. Incluir el **test automático de aislamiento de tablas** (ningún SQL de un módulo referencia tablas de otro prefijo) y un test de contrato que ejecute la misma suite contra el Gateway en proceso y contra uno de Service Binding simulado.
- **Contract Testing:** Validación de schemas Zod / OpenAPI y contratos de Queues.
- **End-to-End Testing:** Flujos críticos probados con peticiones HTTP reales contra el entorno Miniflare local o preview de Cloudflare.


---


# 15. Rendimiento y Pruebas de Carga


- Herramienta: **k6** ejecutando pruebas de carga contra los endpoints del Worker.
- Medir `requests/sec`, latencia p95/p99, y validar que no se alcancen límites de CPU time de Cloudflare Workers (50ms en plan gratuito, 30s en plan Workers Paid / Unbound).


---


# 16. Resiliencia en Serverless


- Timeouts explícitos en llamadas `fetch` externas usando `AbortController`.
- Retries con backoff exponencial configurados en Cloudflare Queues.
- Graceful degradation: si un servicio secundario falla, responder con datos en cache de KV si está disponible.


---


# 17. Chaos Engineering


- Pruebas simulando fallos en D1, saturación de Queues o fallo de Gateways (y desconexión de Service Bindings, tras una separación) en tests de integración con Miniflare.


---


# 18. Alerting


- Alertas configuradas en Cloudflare Dashboard / Notifications sobre: excepciones no capturadas de Workers, saturación de DLQs, tiempo de CPU excedido y códigos 5xx.


---


# 19. Definition of Done


Antes de dar por terminada una funcionalidad en Cloudflare Serverless, verificar:


- [ ] Bounded Context delimitado en `src/modules/<context>`.
- [ ] Sin imports directos entre módulos ni desde el BFF hacia internals de un módulo (comunicación solo vía Gateways o Queues).
- [ ] Dominio POJO/POTS puro, sin acoplamiento a tipos de Cloudflare (`D1Database`, `KVNamespace`).
- [ ] Casos de uso respetan límite de 200 líneas.
- [ ] Tablas con el prefijo del módulo, sin FKs ni JOINs hacia tablas de otros módulos, y test de aislamiento de tablas en verde.
- [ ] D1 con migraciones SQL versionadas por módulo.
- [ ] `module.public-api.ts` expone solo DTOs planos serializables.
- [ ] Gateways cableados únicamente en `composition-root.ts`.
- [ ] Queues con ack manual y DLQ configurada.
- [ ] Endpoints Hono documentados con Zod / OpenAPI.
- [ ] Tests pasando con `vitest` y `@cloudflare/vitest-pool-workers`.
- [ ] Logs estructurados en JSON con `trace_id`.
- [ ] Si existe algún proceso no-serverless (Python, demonios continuos), se consultó al usuario (Cloudflare Container vs VM externa).


---


# 19.1 Matriz de Verificación de Cobertura por Bounded Context


| Bounded Context | Entidades de Dominio | Command Handlers | Query Handlers | Suites de Prueba (Vitest) |
|---|---|---|---|:---:|
| `module-a` | `<EntityA>, <EntityB>` | `<CommandA>, <CommandB>` | `<QueryA>, <QueryB>` | 🟢 / 🟡 / 🔴 |
| `module-b` | `<EntityA>, <EntityB>` | `<CommandA>, <CommandB>` | `<QueryA>, <QueryB>` | 🟢 / 🟡 / 🔴 |
| `module-c` | `<EntityA>, <EntityB>` | `<CommandA>, <CommandB>` | `<QueryA>, <QueryB>` | 🟢 / 🟡 / 🔴 |

---


# 20. Prohibiciones explícitas en Cloudflare Serverless


Antes de entregar código, verifica que NO hiciste ninguna de estas cosas:


- [ ] Importar tipos de infraestructura de Cloudflare (`D1Database`, `KVNamespace`, `Queue`, `R2Bucket`) dentro de `domain/` o `application/`.
- [ ] Hacer `import` directo del código interno de otro módulo (`../otro-modulo/domain/...`).
- [ ] Hacer que el BFF importe dominio, aplicación o infraestructura de un módulo (solo `InProcess<Module>Gateway.ts` y `composition-root.ts` pueden importar `module.public-api.ts`).
- [ ] Hacer JOINs, subconsultas, vistas, triggers o foreign keys entre tablas de módulos distintos en la D1 única.
- [ ] Consultar o modificar tablas de otro prefijo desde un repositorio, o abrir un `db.batch()` que cruce módulos.
- [ ] Escribir lógica de negocio en handlers de Hono o controladores del BFF.
- [ ] Hacer que el BFF acceda directamente a D1, R2 o KV de un módulo.
- [ ] Exponer clases de dominio o tipos de Cloudflare en `module.public-api.ts`.
- [ ] Usar auto-ack en Cloudflare Queues antes de persistir con éxito.
- [ ] Usar Workers KV como fuente única de verdad para datos críticos de negocio.
- [ ] Intentar correr un proceso continuo 24/7 o script incompatible de Python dentro de un Cloudflare Worker sin consultar al usuario.
- [ ] Usar `console.log` sin formato JSON estructurado en producción.
- [ ] Registrar contraseñas, secretos o PII en logs.
- [ ] Generar un archivo de más de 200 líneas de código.


---


# 21. Instrucción final para el agente (Claude/Codex/Copilot)


> Cuando generes código para este proyecto en Cloudflare:
>
> 1. Aplica TODAS las reglas de arquitectura monolito modular serverless.
> 2. Mantén la separación estricta de capas (DDD, Clean Architecture, SOLID).
> 3. Utiliza los primitives nativos de Cloudflare (Hono, D1, Queues, R2, KV). Los Service Bindings se usan solo cuando un módulo ya fue separado a su propio Worker; mientras tanto, la comunicación síncrona va por Gateways en proceso.
> 4. **SI UN REQUERIMIENTO NO PUEDE SER SERVERLESS (ej. ejecución continua, Python nativo, GPUs, demonios TCP): DETENTE Y PREGUNTA AL USUARIO si prefiere desplegarlo en Cloudflare Containers o en una VM/Contenedor externo.**
> 5. Respeta el ADR-0001: un solo Worker, una sola D1 con tablas prefijadas por módulo, y Gateways como único canal de comunicación síncrona.


---


# 22. Regla de adaptación al proyecto real


- `ARCHITECTURE_RULES.md`: Contiene las reglas universales de este documento.
- `PROJECT_RULES.md`: Contiene las decisiones concretas del proyecto (nombres de Workers, bases de datos D1, Queues, Buckets R2 y bounded contexts reales).


---


# 23. Regla de prioridad arquitectónica


La integridad arquitectónica tiene prioridad sobre atajos rápidos. Cualquier excepción debe documentarse mediante un ADR.


## ADR-0001 — Un solo Worker y una sola D1 con límites lógicos por módulo


- **Estado:** Aceptada.
- **Contexto:** se requiere desplegar el BFF y todos los módulos en un solo binario y con una sola base de datos, manteniendo la posibilidad de separar cualquier módulo a futuro como microservicio sin modificar los demás.
- **Decisión:**
  - Un único Worker contiene el BFF y todos los módulos.
  - Una única D1 (`env.DB`); cada módulo es dueño exclusivo de las tablas con su prefijo `<modulo>_*`.
  - La comunicación síncrona se hace solo mediante Gateways (interfaz + adaptador en proceso), con `module.public-api.ts` como contrato de DTOs planos serializables.
  - La comunicación asíncrona sigue siendo Cloudflare Queues con outbox por módulo.
- **Excepciones a reglas previas:** "una DB/schema D1 por módulo" (6.1) y "Service Bindings como comunicación síncrona entre BFF y módulos" (10), vigentes ahora solo tras separar un módulo.
- **Condiciones obligatorias para que la excepción sea válida:**
  - cero JOINs, subconsultas, vistas, triggers y FKs entre prefijos;
  - `db.batch()` limitado a un solo módulo;
  - test/lint automático que haga cumplir el aislamiento de tablas;
  - Gateways cableados solo en `composition-root.ts`;
  - procedimiento de separación de la sección 10.1 verificado.
- **Consecuencias:** menor costo operativo y de despliegue mientras el sistema es pequeño; el aislamiento entre módulos depende de disciplina y de tests automáticos en vez de ser impuesto por la plataforma; las migraciones y el despliegue de datos no son independientes por módulo hasta que se separe uno.


---


# 24. Principio final


La arquitectura permite que el monolito modular serverless en Cloudflare, desplegado hoy como un solo Worker con una sola D1, evolucione:


```text
Frontend (Cloudflare Pages)
   │
   │ HTTP / REST
   ▼
┌────────────────────────────────────────────────────────────┐
│  UN SOLO WORKER                                            │
│                                                            │
│  BFF Worker (Hono)                                         │
│     │                                                      │
│     │ Gateways (en proceso)                                │
│     ▼                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  module-a            module-b            module-c    │  │
│  │  tablas a_*          tablas b_*          tablas c_*  │  │
│  └──────────────────────────────────────────────────────┘  │
│     │                                                      │
│     ▼                                                      │
│  D1 única (prefijos por módulo)                            │
│     │                                                      │
│     ▼                                                      │
│  Cloudflare Queues  →  Eventos asíncronos                  │
└────────────────────────────────────────────────────────────┘
```


Y cuando un módulo se separe, solo cambia el wiring:


```text
┌──────────────────────────────────────────────────────────────────┐
│  Worker principal (BFF + módulos restantes)                      │
│     │  ServiceBinding<ModuleB>Gateway  (único cambio de wiring)  │
│     ▼                                                            │
│  ┌─────────────────────────────────┐                             │
│  │  Worker module-b (propio)       │                             │
│  │  D1 propia con tablas b_*       │                             │
│  │  Queues / R2 propios si aplica  │                             │
│  └─────────────────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```


Todo módulo puede desplegarse como Worker independiente sin reescribir dominio ni aplicación.


---


# FIN DEL CONTRATO DE ARQUITECTURA
