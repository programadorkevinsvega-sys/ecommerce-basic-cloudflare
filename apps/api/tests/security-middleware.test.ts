import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { CsrfProtectionMiddleware } from '../src/bff/middleware/CsrfProtectionMiddleware.js';
import { RateLimitMiddleware } from '../src/bff/middleware/RateLimitMiddleware.js';
import { Env } from '../src/platform/Env.js';
import { SettingsController } from '../src/bff/controllers/settings/SettingsController.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';

describe('CSRF and request rate middleware', () => {
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
    app.use('*', RateLimitMiddleware);
    app.post('/api/v1/auth/login', (c) => c.text('ok'));
    app.post('/api/v1/auth/register', (c) => c.text('ok'));
    const env = { AUTH_LIMITER: { limit }, CHECKOUT_LIMITER: { limit: vi.fn() }, API_WRITE_LIMITER: { limit: vi.fn() } } as unknown as Env;

    await app.request('/api/v1/auth/login', { method: 'POST', headers: { 'cf-connecting-ip': '203.0.113.10' } }, env);
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'cf-connecting-ip': '203.0.113.10' } }, env);

    expect(limit).toHaveBeenCalledTimes(2);
    expect(limit.mock.calls[0]?.[0]).toEqual({ key: '203.0.113.10' });
    expect(limit.mock.calls[1]?.[0]).toEqual({ key: '203.0.113.10' });
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
