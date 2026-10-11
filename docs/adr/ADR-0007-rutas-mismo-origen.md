# ADR-0007: Enrutamiento y Mismo Origen (/api/*)

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
Tanto el storefront como el panel admin necesitan consumir la API sin sufrir las restricciones y riesgos de seguridad de CORS abierto con credenciales.

## Decisión
El Worker sirve las rutas `/api/*` bajo cada host (`tienda.com/api/*` y `admin.tienda.com/api/*`). Esto permite comunicación de **mismo origen** (*same-origin*), elimina la necesidad de CORS permisivo y fortalece la protección CSRF mediante cookies `SameSite=Lax`.
