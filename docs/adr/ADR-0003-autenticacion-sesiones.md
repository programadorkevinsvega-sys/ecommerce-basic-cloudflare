# ADR-0003: Estrategia de Autenticación y Sesiones

- **Estado:** Aceptado
- **Fecha:** Fase 0

## Contexto
Se requiere proteger cuentas de clientes y panel de administración contra suplantación, fuga de credenciales y ataques de fuerza bruta.

## Decisión
1. Contraseñas hasheadas con PBKDF2-SHA-256 (100.000 iteraciones en Web Crypto, sal de 16 bytes).
2. Sesiones opacas: token aleatorio de 32 bytes guardado exclusivamente como su hash SHA-256 en D1 (`identity_sessions`).
3. Cookies seguras: `__Host-session` para clientes y `__Host-admin-session` para administradores (`HttpOnly; Secure; SameSite=Lax; Path=/`).
4. MFA obligatorio (TOTP) para administradores y re-autenticación en acciones críticas.
