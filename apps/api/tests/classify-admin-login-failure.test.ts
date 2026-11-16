import { describe, expect, it } from 'vitest';
import { classifyAdminLoginFailure } from '../src/bff/security/classifyAdminLoginFailure.js';

describe('admin login failure classification', () => {
  it('keeps expected credential failures separate from operational failures', () => {
    expect(classifyAdminLoginFailure(new Error('Credenciales inválidas'))).toEqual({
      reason: 'invalid_credentials',
      expectedAuthenticationFailure: true,
    });
    expect(classifyAdminLoginFailure(new Error('Código TOTP inválido o expirado'))).toEqual({
      reason: 'totp_invalid',
      expectedAuthenticationFailure: true,
    });
    expect(classifyAdminLoginFailure(new Error('database connection unavailable'))).toEqual({
      reason: 'identity_service_failure',
      expectedAuthenticationFailure: false,
    });
  });
});
