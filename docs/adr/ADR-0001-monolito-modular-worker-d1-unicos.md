# ADR-0001: Monolito Modular Serverless en Worker Único y D1 Única

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
El sistema requiere operar con bajo coste y simplicidad operativa sin microservicios dispersos, pero manteniendo fronteras de dominio estrictas (DDD) que permitan extraer cualquier módulo a un Worker independiente en el futuro.

## Decisión
1. Desplegar el BFF y todos los módulos dentro de un único Worker de Cloudflare.
2. Utilizar una única base de datos D1 (`env.DB`), donde cada módulo es dueño exclusivo de las tablas con su prefijo (`<modulo>_*`).
3. Comunicación síncrona BFF-módulo y módulo-módulo estrictamente a través de Gateways (adaptadores en proceso hoy, Service Bindings mañana).
4. Prohibidos JOINs, foreign keys y transacciones batch cruzadas entre módulos.
