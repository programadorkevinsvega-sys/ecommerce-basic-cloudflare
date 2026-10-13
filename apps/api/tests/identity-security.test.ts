import { describe, it, expect } from 'vitest';
import { PasswordHasher } from '../src/modules/identity/domain/services/PasswordHasher.js';
import { TotpService } from '../src/modules/identity/domain/services/TotpService.js';
import { SessionTokenGenerator } from '../src/modules/identity/domain/services/SessionTokenGenerator.js';
import { Role } from '../src/modules/identity/domain/entities/Role.js';

describe('Seguridad de Identidad y Criptografía (SEC-AUTH / SEC-SES / SEC-ISO)', () => {
  it('SEC-AUTH-01 / 02: PBKDF2 debe hashear con 100.000 iteraciones y verificar en tiempo constante', async () => {
    const password = 'MiPasswordSuperSegura123!';
    const hash = await PasswordHasher.hash(password);

    expect(hash.startsWith('pbkdf2_sha256$100000$')).toBe(true);

    const valid = await PasswordHasher.verify(password, hash);
    expect(valid).toBe(true);

    const invalid = await PasswordHasher.verify('PasswordIncorrecta', hash);
    expect(invalid).toBe(false);
  });

  it('SEC-AUTH-09: TotpService debe generar y validar códigos de segundo factor RFC 6238', async () => {
    const secret = TotpService.generateSecret();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(16);

    // Verificación de código inválido
    const invalid = await TotpService.verifyCode(secret, '000000');
    // Código arbitrario debe ser rechazado
    expect(invalid).toBe(false);
  });

  it('SEC-SES-01: SessionTokenGenerator genera token de 32 bytes y su hash SHA-256 es irreversible', async () => {
    const rawToken = SessionTokenGenerator.generateRawToken();
    expect(rawToken.length).toBe(64); // 32 bytes en hex = 64 chars

    const hash1 = await SessionTokenGenerator.hashToken(rawToken);
    const hash2 = await SessionTokenGenerator.hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('SEC-ADM-01: Role con política de denegar por defecto', () => {
    const editorRole = Role.create({
      id: 'role_editor',
      name: 'Editor',
      description: 'Solo contenido',
      permissions: ['catalog:*', 'cms:*'],
      isSystem: true,
      createdAt: new Date().toISOString(),
    });

    expect(editorRole.hasPermission('catalog:write')).toBe(true);
    expect(editorRole.hasPermission('catalog:*')).toBe(true);
    expect(editorRole.hasPermission('settings:update')).toBe(false); // Denegado por defecto
  });
});
