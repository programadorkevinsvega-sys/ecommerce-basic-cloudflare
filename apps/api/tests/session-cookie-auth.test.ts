import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthController } from '../src/bff/controllers/auth/AdminAuthController.js';
import { CustomerAuthController } from '../src/bff/controllers/auth/CustomerAuthController.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';

const env = { TURNSTILE_SECRET_KEY: 'secret', TURNSTILE_HOSTNAMES: 'https://shop.example.com' } as never;

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, hostname: 'shop.example.com' })) )));
afterEach(() => vi.unstubAllGlobals());

describe('cookie-based login sessions', () => {
  it('keeps admin session tokens out of JSON and HTML storage', async () => {
    const gateway = createIdentityGateway({ loginAdmin: vi.fn().mockResolvedValue({ rawToken: 'admin-secret-token', expiresAt: '2030-01-01T00:00:00.000Z', mfaEnabled: true }) });
    const response = await AdminAuthController.createRoutes(gateway).request(jsonPost({ email: 'admin@example.com', password: 'password', turnstileToken: 'test-token' }), undefined, env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('__Host-admin-session=admin-secret-token');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(body).toEqual({ status: 'ok', mfaEnabled: true });
    expect(JSON.stringify(body)).not.toContain('admin-secret-token');
  });

  it('keeps customer session tokens in an HttpOnly cookie only', async () => {
    const gateway = createIdentityGateway({ loginCustomer: vi.fn().mockResolvedValue({ rawToken: 'customer-secret-token', expiresAt: '2030-01-01T00:00:00.000Z' }) });
    const response = await CustomerAuthController.createRoutes(gateway).request(jsonPost({ email: 'buyer@example.com', password: 'password', turnstileToken: 'test-token' }), undefined, env);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('__Host-session=customer-secret-token');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(body).toEqual({ status: 'ok' });
    expect(JSON.stringify(body)).not.toContain('customer-secret-token');
  });
});

function jsonPost(body: unknown): Request {
  return new Request('https://shop.example.com/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createIdentityGateway(overrides: Partial<IdentityGateway>): IdentityGateway {
  return {
    registerCustomer: vi.fn(), loginCustomer: vi.fn(), loginAdmin: vi.fn(), validateSession: vi.fn(),
    logout: vi.fn(), getCustomerProfile: vi.fn(), ...overrides,
  } as unknown as IdentityGateway;
}
