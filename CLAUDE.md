# CLAUDE.md

@AGENTS.md

Antes de implementar cualquier cosa, **lee completos** estos documentos (todos en la raíz del repositorio) y cúmplelos. Si no puedes leer alguno, detente y avisa:

1. `ARQUITECTURA_ARCHITECTURE_NODE_CLOUDFLARE_RULES_ALL_100%_MODULAR.md` — contrato de arquitectura (máxima prioridad)
2. `SECURITY_RULES.md` — reglas de seguridad `SEC-*`
3. `ROLLBACK_RECOVERY.md` — release, rollback y reconciliación
4. `README.md` — alcance, módulos, reglas comerciales y decisiones
5. `ROADMAP.md` — fases y reglas aplicables por fase
6. `docs/PROJECT_RULES.md`, `docs/adr/*` y `docs/migrations/manifest.md` — cuando existan

Recordatorios de este proyecto:

- Sin Cloudflare Containers; si algo no puede correr en un Worker, **pregunta antes de continuar**.
- Un archivo = una responsabilidad y máximo 200 líneas.
- No importes internals de otro módulo ni cruces prefijos de tablas en D1.
- No declares nada como probado o COMPLETE sin evidencia reproducible.
