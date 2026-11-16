import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerAuthController } from '../src/bff/controllers/auth/CustomerAuthController.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { renderCustomerEmailVerificationPage } from '../src/bff/views/renderCustomerEmailVerificationPage.js';
import { renderCustomerPasswordResetPage } from '../src/bff/views/renderCustomerPasswordResetPage.js';

const publicOrigin = 'https://vega.jnmtortas.com';
const env = {
  TURNSTILE_SECRET_KEY: 'test-secret',
  TURNSTILE_HOSTNAMES: publicOrigin,
  PUBLIC_ORIGIN: publicOrigin,
} as never;

afterEach(() => vi.unstubAllGlobals());

describe('flujos de verificación y recuperación de cuenta', () => {
  it('devuelve una respuesta indistinguible para solicitud de recuperación', async () => {
    vi.stubGlobal('fetch', validTurnstile);
    const gateway = createGateway();
    const response = await CustomerAuthController.createRoutes(gateway).request(jsonPost('/password-reset/request', {
      email: 'buyer@example.test', turnstileToken: 'valid',
    }), undefined, env);

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ message: 'Si existe una cuenta con ese correo, recibirás instrucciones.' });
    expect(gateway.requestCustomerPasswordReset).toHaveBeenCalledWith('buyer@example.test', publicOrigin);
  });

  it('verifica correos solo mediante el token de un solo uso', async () => {
    const gateway = createGateway();
    const response = await CustomerAuthController.createRoutes(gateway).request(jsonPost('/email-verification/confirm', {
      token: 'a'.repeat(64),
    }), undefined, env);

    expect(response.status).toBe(200);
    expect(gateway.verifyCustomerEmail).toHaveBeenCalledWith('a'.repeat(64));
    expect(renderCustomerEmailVerificationPage()).toContain("history.replaceState(null,'',location.pathname)");
  });

  it('requiere captcha y token válido para completar recuperación', async () => {
    vi.stubGlobal('fetch', validTurnstile);
    const gateway = createGateway();
    const response = await CustomerAuthController.createRoutes(gateway).request(jsonPost('/password-reset/confirm', {
      token: 'b'.repeat(64), password: 'A-long-unique-phrase!123', turnstileToken: 'valid',
    }), undefined, env);

    expect(response.status).toBe(200);
    expect(gateway.resetCustomerPassword).toHaveBeenCalledWith('b'.repeat(64), 'A-long-unique-phrase!123');
    expect(renderCustomerPasswordResetPage('site-key')).toContain('data-sitekey="site-key"');
  });

  it('responde temporalmente no disponible si HIBP no permite evaluar la contraseña', async () => {
    vi.stubGlobal('fetch', validTurnstile);
    const gateway = createGateway({
      resetCustomerPassword: vi.fn().mockRejectedValue(new Error('PASSWORD_BREACH_CHECK_UNAVAILABLE')),
    });
    const response = await CustomerAuthController.createRoutes(gateway).request(jsonPost('/password-reset/confirm', {
      token: 'd'.repeat(64), password: 'A-long-unique-phrase!123', turnstileToken: 'valid',
    }), undefined, env);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'No se pudo comprobar la seguridad de la contraseña. Inténtalo más tarde.',
    });
  });

  it('no revela excepciones internas durante la confirmación', async () => {
    const gateway = createGateway({ verifyCustomerEmail: vi.fn().mockRejectedValue(new Error('database connection detail')) });
    const response = await CustomerAuthController.createRoutes(gateway).request(jsonPost('/email-verification/confirm', {
      token: 'c'.repeat(64),
    }), undefined, env);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'No fue posible verificar el correo' });
  });
});

function createGateway(overrides: Partial<IdentityGateway> = {}): IdentityGateway {
  return {
    registerCustomer: vi.fn().mockResolvedValue({ accepted: true }),
    loginCustomer: vi.fn(), loginAdmin: vi.fn(), beginAdminMfaEnrollment: vi.fn(),
    confirmAdminMfaEnrollment: vi.fn(), validateSession: vi.fn(), logout: vi.fn(),
    getCustomerProfile: vi.fn(), updateCustomerProfile: vi.fn(), changeCustomerPassword: vi.fn(),
    listCustomerSessions: vi.fn(), revokeCustomerSession: vi.fn(),
    requestCustomerPasswordReset: vi.fn(), requestCustomerEmailVerification: vi.fn(),
    verifyCustomerEmail: vi.fn(), resetCustomerPassword: vi.fn(), ...overrides,
  } as unknown as IdentityGateway;
}

function jsonPost(path: string, body: unknown): Request {
  return new Request(`https://vega.jnmtortas.com${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

async function validTurnstile(): Promise<Response> {
  return new Response(JSON.stringify({ success: true, hostname: 'vega.jnmtortas.com' }));
}
