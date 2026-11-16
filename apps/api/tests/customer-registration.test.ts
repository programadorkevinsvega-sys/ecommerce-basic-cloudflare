import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerAuthController } from '../src/bff/controllers/auth/CustomerAuthController.js';
import { renderCustomerRegisterPage } from '../src/bff/views/renderCustomerRegisterPage.js';
import { renderAuthPage } from '../src/bff/views/renderAuthPage.js';
import { AdminAuthController } from '../src/bff/controllers/auth/AdminAuthController.js';
import { renderAdminLoginPage } from '../src/bff/views/admin/renderAdminLoginPage.js';
import { renderBaseLayout } from '../src/bff/views/renderBaseLayout.js';

const gateway = {
  registerCustomer: vi.fn(async () => ({ accepted: true as const })),
  loginCustomer: vi.fn(async () => ({ rawToken: 'customer-session', expiresAt: '2030-01-01T00:00:00.000Z' })),
  loginAdmin: vi.fn(async () => ({ rawToken: 'admin-session', expiresAt: '2030-01-01T00:00:00.000Z', mfaEnabled: true })),
};
const env = { TURNSTILE_SECRET_KEY: 'test-secret', TURNSTILE_HOSTNAMES: 'https://vega.jnmtortas.com', PUBLIC_ORIGIN: 'https://vega.jnmtortas.com' } as never;

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => { gateway.registerCustomer.mockClear(); gateway.loginCustomer.mockClear(); gateway.loginAdmin.mockClear(); });

describe('customer registration', () => {
  it('shows a registration form only when Turnstile is configured', () => {
    expect(renderCustomerRegisterPage()).toContain('Registro temporalmente no disponible');
    const html = renderCustomerRegisterPage('public-site-key');
    expect(html).toContain('data-sitekey="public-site-key"');
    expect(html).toContain('/api/v1/auth/register');
    expect(html).toContain('minlength="12"');
  });

  it('renders Turnstile on both customer and admin login forms', () => {
    expect(renderAuthPage('/', 'public-site-key')).toContain('data-sitekey="public-site-key"');
    expect(renderAdminLoginPage('public-site-key')).toContain('data-sitekey="public-site-key"');
  });

  it('redirects a regular customer to the account and links the signed-in header to it', () => {
    expect(renderAuthPage()).toContain('id="redirectTo" value="/cuenta"');
    const layout = renderBaseLayout({ title: 'Inicio', description: 'Tienda', bodyHtml: '', customerEmail: 'buyer@example.com' });
    expect(layout).toContain('href="/cuenta" class="customer-email account-link"');
    expect(layout).toContain('>Mi cuenta</a>');
  });

  it('requires server verified Turnstile and excludes its token from customer data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, hostname: 'vega.jnmtortas.com' }))));
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://vega.jnmtortas.com/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'person@example.com', password: 'strong-password-123', fullName: 'Client Person', turnstileToken: 'valid-token' }) }, env);
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ message: 'Si el registro fue aceptado, recibirás instrucciones para verificar tu correo.' });
    expect(gateway.registerCustomer).toHaveBeenCalledWith({
      email: 'person@example.com', password: 'strong-password-123', fullName: 'Client Person',
      publicOrigin: 'https://vega.jnmtortas.com',
    });
  });

  it('rejects an unverified Turnstile token without creating the account', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, hostname: 'vega.jnmtortas.com' }))));
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://vega.jnmtortas.com/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'other@example.com', password: 'strong-password-123', fullName: 'Other Person', turnstileToken: 'invalid-token' }) }, env);
    expect(response.status).toBe(400);
    expect(gateway.registerCustomer).not.toHaveBeenCalled();
  });

  it('does not expose Zod validation details on registration', async () => {
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://vega.jnmtortas.com/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'strong-password-123', fullName: 'Client Person', turnstileToken: 'valid-token' }),
    }, env);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Solicitud inválida' });
  });

  it('returns the same registration response for an existing email', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, hostname: 'vega.jnmtortas.com' }))));
    gateway.registerCustomer.mockResolvedValueOnce({ accepted: true });
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://vega.jnmtortas.com/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'person@example.com', password: 'strong-password-123', fullName: 'Client Person', turnstileToken: 'valid-token' }) }, env);
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ message: 'Si el registro fue aceptado, recibirás instrucciones para verificar tu correo.' });
  });

  it('requires Turnstile before customer login', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, hostname: 'vega.jnmtortas.com' }))));
    const app = CustomerAuthController.createRoutes(gateway as never);
    const response = await app.request('https://vega.jnmtortas.com/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'person@example.com', password: 'secret', turnstileToken: 'valid-token' }) }, env);
    expect(response.status).toBe(200);
    expect(gateway.loginCustomer).toHaveBeenCalledWith(expect.objectContaining({ email: 'person@example.com', password: 'secret' }));
  });

  it('requires Turnstile before admin login', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, hostname: 'vega.jnmtortas.com' }))));
    const app = AdminAuthController.createRoutes(gateway as never);
    const response = await app.request('https://vega.jnmtortas.com/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'secret', turnstileToken: 'valid-token' }) }, env);
    expect(response.status).toBe(200);
    expect(gateway.loginAdmin).toHaveBeenCalledWith(expect.objectContaining({ email: 'admin@example.com', password: 'secret' }));
  });
});
