# ADR-0035: Cifrado de secretos TOTP en reposo

## Estado

Aceptada — 2026-11-15. Implementación local; el secreto `TOTP_ENCRYPTION_KEY` todavía debe aprovisionarse por separado en cada entorno antes del despliegue.

## Contexto

`identity_admins.mfa_secret` contiene secretos TOTP reutilizables para generar códigos de segundo factor. Guardarlos en claro permite que una lectura no autorizada de D1 comprometa el segundo factor administrativo.

## Decisión

- Cifrar secretos al entrar y salir de la persistencia de `identity` usando AES-256-GCM de Web Crypto, nonce aleatorio de 12 bytes y datos autenticados asociados al `adminId`.
- Guardar el sobre versionado `enc:v1:<base64(nonce+ciphertext+tag)>` en la columna existente `identity_admins.mfa_secret`; no se requiere una migración de esquema adicional.
- Obtener la clave exclusivamente del secreto de Worker `TOTP_ENCRYPTION_KEY`, codificado en Base64 y decodificado a exactamente 32 bytes. Generar y aprovisionar una clave distinta por entorno.
- Fallar al inicializar la persistencia de `identity` cuando falta la clave, para no operar con MFA sin protección cifrada disponible.
- Aceptar temporalmente valores heredados en claro y cifrarlos de forma gradual al accederlos mediante la persistencia; cualquier escritura nueva se almacena cifrada.
- No rotar ni perder la clave sin un procedimiento validado que descifre y vuelva a cifrar todas las filas. Los Workers que no entienden el sobre `enc:v1:` no son compatibles para rollback.

## Consecuencias y recuperación

Una copia de D1 contiene ciphertext y requiere la clave correspondiente para recuperar MFA. La clave debe mantenerse en el gestor de secretos aprobado y respaldarse según la política operativa, nunca en Git, D1 o logs. La pérdida de la clave hace inaccesibles los factores MFA. Los valores heredados permanecen en claro hasta que cada administrador activo acceda a su cuenta; el despliegue protege inmediatamente los nuevos secretos y los que se lean después.

## Validación requerida

Verificar round-trip AES-GCM, nonce distinto por cifrado, rechazo de clave inválida, autenticación de ciphertext contra otro `adminId`, escritura de nuevas filas cifradas y migración gradual de filas heredadas. Aprovisionar el secreto y validar el procedimiento de recuperación en staging antes de producción.
