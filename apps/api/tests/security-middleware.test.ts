import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { CsrfProtectionMiddleware } from '../src/bff/middleware/CsrfProtectionMiddleware.js';
import { createRateLimitMiddleware } from '../src/bff/middleware/RateLimitMiddleware.js';
import { Env } from '../src/platform/Env.js';
import { SettingsController } from '../src/bff/controllers/settings/SettingsController.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { SecurityHeadersMiddleware } from '../src/bff/middleware/SecurityHeadersMiddleware.js';

describe('CSRF and request rate middleware', () => {
  it('adds a per-response nonce and blocks inline scripts and external images', async () => {
    const app = new Hono();
    app.use('*', SecurityHeadersMiddleware);
    app.get('/auth/register', (c) => c.html('<script>window.ready=true</script><img src="/media/image">'));
    const response = await app.request('/auth/register');
    const response2 = await app.request('/auth/register');
    const policy = response.headers.get('Content-Security-Policy') || '';
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(await response.text()).toContain(`<script nonce="${nonce}">`);
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain('https://challenges.cloudflare.com');
    expect(policy).toContain('https://static.cloudflareinsights.com');
    expect(policy).toContain('frame-src https://challenges.cloudflare.com');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("img-src 'self' data:");
    expect(policy).not.toContain('img-src https:');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response2.headers.get('Content-Security-Policy')).not.toContain(`'nonce-${nonce}'`);
  });

  it('rejects cross-origin cookie writes and permits same-origin writes', async () => {
    const app = new Hono();
    app.use('*', CsrfProtectionMiddleware);
    app.post('/api/v1/customer/profile', (c) => c.text('ok'));
    const crossOrigin = await app.request('https://shop.example.com/api/v1/customer/profile', {
      method: 'POST', headers: { origin: 'https://attacker.example', cookie: '__Host-session=session' },
    });
    const sameOrigin = await app.request('https://shop.example.com/api/v1/customer/profile', {
      method: 'POST', headers: { origin: 'https://shop.example.com', cookie: '__Host-session=session' },
    });
    const missingOrigin = await app.request('https://shop.example.com/api/v1/customer/profile', {
      method: 'POST', headers: { cookie: '__Host-session=session' },
    });

    expect(crossOrigin.status).toBe(403);
    expect(sameOrigin.status).toBe(200);
    expect(missingOrigin.status).toBe(403);
  });

  it('shares an IP bucket across routes within the selected limiter class', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    const app = new Hono<{ Bindings: Env }>();
    app.use('*', createRateLimitMiddleware());
    app.post('/api/v1/auth/login', (c) => c.text('ok'));
    app.post('/api/v1/auth/register', (c) => c.text('ok'));
    const env = { AUTH_LIMITER: { limit }, CHECKOUT_LIMITER: { limit: vi.fn() }, API_WRITE_LIMITER: { limit: vi.fn() } } as unknown as Env;

    await app.request('/api/v1/auth/login', { method: 'POST', headers: { 'cf-connecting-ip': '203.0.113.10' } }, env);
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'cf-connecting-ip': '203.0.113.10' } }, env);

    expect(limit).toHaveBeenCalledTimes(2);
    expect(limit.mock.calls[0]?.[0]).toEqual({ key: '203.0.113.10' });
    expect(limit.mock.calls[1]?.[0]).toEqual({ key: '203.0.113.10' });
  });

  it('returns a traceable 503 and logs the failed IP limiter without exposing exception text', async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use('*', createRateLimitMiddleware());
    app.put('/api/v1/admin/products/:id', (c) => c.text('updated'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const env = {
      API_IP_WRITE_LIMITER: { limit: vi.fn().mockRejectedValue(new Error('private runtime detail')) },
    } as unknown as Env;

    const response = await app.request('/api/v1/admin/products/product-1', { method: 'PUT' }, env);
    const body = await response.json() as { error: string; errorCode: string; traceId: string };
    const logOutput = log.mock.calls.map(([entry]) => String(entry)).join('\n');

    expect(response.status).toBe(503);
    expect(body.errorCode).toBe('RATE_LIMIT_UNAVAILABLE');
    expect(body.traceId).toBe('unknown');
    expect(body.error).toContain('No se pudo validar el límite');
    expect(logOutput).toContain('"failure_reason":"rate_limit_binding_error"');
    expect(logOutput).toContain('"binding_name":"API_IP_WRITE_LIMITER"');
    expect(logOutput).not.toContain('private runtime detail');
    log.mockRestore();
  });

  it('identifies an absent rate-limit binding in a safe traceable response', async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use('*', createRateLimitMiddleware());
    app.post('/media/upload', (c) => c.text('uploaded'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const response = await app.request('/media/upload', { method: 'POST' }, {} as Env);
    const body = await response.json() as { errorCode: string };
    const logOutput = log.mock.calls.map(([entry]) => String(entry)).join('\n');

    expect(response.status).toBe(503);
    expect(body.errorCode).toBe('RATE_LIMIT_UNAVAILABLE');
    expect(logOutput).toContain('"failure_reason":"rate_limit_binding_missing"');
    expect(logOutput).toContain('"binding_name":"API_IP_WRITE_LIMITER"');
    log.mockRestore();
  });

  it('protects private store settings behind settings:read', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin', actorType: 'admin', mfaEnabled: true, permissions: ['settings:read'] }) } as unknown as IdentityGateway;
    const settings = { getSettings: vi.fn().mockResolvedValue({ id: 's', storeName: 'Shop', currency: 'COP', taxRatePercent: 19, supportEmail: 'support@example.test', companyNit: 'private-nit', requireCodVerification: false, updatedAt: 'now' }) } as unknown as SettingsGateway;
    const app = SettingsController.createRoutes(settings, identity);

    const anonymous = await app.request('/');
    const authorized = await app.request('/', { headers: { Cookie: '__Host-admin-session=token' } });

    expect(anonymous.status).toBe(401);
    expect(authorized.status).toBe(200);
    const body = await authorized.json() as { data: { companyNit: string } };
    expect(body.data.companyNit).toBe('private-nit');
  });
});
