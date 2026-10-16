import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerAuthController } from '../src/bff/controllers/auth/CustomerAuthController.js';
import { renderCustomerRegisterPage } from '../src/bff/views/renderCustomerRegisterPage.js';

const gateway = { registerCustomer: vi.fn(async () => ({ id: 'customer-1', email: 'person@example.com', fullName: 'Client Person' })) };
const env = { TURNSTILE_SECRET_KEY: 'test-secret' } as never;

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => gateway.registerCustomer.mockClear());

describe('customer registration', () => {
  it('shows a registration form only when Turnstile is configured', () => {
    expect(renderCustomerRegisterPage()).toContain('Registro temporalmente no disponible');
    const html = renderCustomerRegisterPage('public-site-key');
    expect(html).toContain('data-sitekey="public-site-key"');
    expect(html).toContain('/api/v1/auth/register');
    expect(html).toContain('minlength="12"');
  });

  it('requires server verified Turnstile and excludes its token from customer data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, hostname: 'shop.test' }))));
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://shop.test/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'person@example.com', password: 'strong-password-123', fullName: 'Client Person', turnstileToken: 'valid-token' }) }, env);
    expect(response.status).toBe(201);
    expect(gateway.registerCustomer).toHaveBeenCalledWith({ email: 'person@example.com', password: 'strong-password-123', fullName: 'Client Person' });
  });

  it('rejects an unverified Turnstile token without creating the account', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, hostname: 'shop.test' }))));
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://shop.test/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'other@example.com', password: 'strong-password-123', fullName: 'Other Person', turnstileToken: 'invalid-token' }) }, env);
    expect(response.status).toBe(400);
    expect(gateway.registerCustomer).not.toHaveBeenCalled();
  });
});
