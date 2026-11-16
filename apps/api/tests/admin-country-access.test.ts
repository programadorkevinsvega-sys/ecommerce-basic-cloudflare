import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createAdminCountryAccessMiddleware } from '../src/bff/middleware/AdminCountryAccessMiddleware.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { Env } from '../src/platform/Env.js';

const env = {
  ENVIRONMENT: 'production',
  ADMIN_EMAIL: 'admin@example.test',
  ADMIN_DEMO_EMAIL: 'demo@example.test',
} as unknown as Env;

describe('admin country access policy', () => {
  it('limits the configured administrator to Colombia and admits only the configured demo email globally', async () => {
    const app = createApp({});

    expect((await request(app, '/api/v1/admin/auth/login', 'POST', 'CO', { email: 'admin@example.test' })).status).toBe(200);
    expect((await request(app, '/api/v1/admin/auth/login', 'POST', 'US', { email: 'admin@example.test' })).status).toBe(401);
    expect((await request(app, '/api/v1/admin/auth/login', 'POST', 'US', { email: 'demo@example.test' })).status).toBe(200);
    expect((await request(app, '/api/v1/admin/auth/login', 'POST', 'CO', { email: 'other@example.test' })).status).toBe(401);
  });

  it('logs country-policy rejection without logging the administrator email', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await request(createApp({}), '/api/v1/admin/auth/login', 'POST', 'US', { email: 'admin@example.test' });

      expect(output).toHaveBeenCalledOnce();
      const log = String(output.mock.calls[0]?.[0]);
      expect(log).toContain('"reason":"country_not_allowed"');
      expect(log).not.toContain('admin@example.test');
    } finally {
      output.mockRestore();
    }
  });

  it('enforces the same policy for sessions on admin pages and APIs outside the admin prefix', async () => {
    const identity = {
      validateSession: vi.fn(async (token: string) => ({
        actorId: token,
        actorType: 'admin' as const,
        email: token === 'demo' ? 'demo@example.test' : token === 'other' ? 'other@example.test' : 'admin@example.test',
        permissions: ['*'],
      })),
    };
    const app = createApp(identity);

    expect((await request(app, '/api/v1/settings', 'GET', 'US', undefined, 'admin')).status).toBe(403);
    expect((await request(app, '/api/v1/settings', 'GET', 'CO', undefined, 'admin')).status).toBe(200);
    expect((await request(app, '/api/v1/orders/any-id', 'GET', 'US', undefined, 'demo')).status).toBe(200);
    expect((await request(app, '/admin/dashboard', 'GET', 'CO', undefined, 'other')).status).toBe(403);
  });
});

function createApp(identity: Partial<IdentityGateway>) {
  const app = new Hono<{ Bindings: Env }>();
  app.use('*', createAdminCountryAccessMiddleware(identity as IdentityGateway));
  app.all('*', (c) => c.json({ ok: true }));
  return app;
}

async function request(
  app: Hono<{ Bindings: Env }>,
  path: string,
  method: string,
  country: string,
  body?: Record<string, unknown>,
  sessionToken?: string,
): Promise<Response> {
  const headers = new Headers();
  if (body) headers.set('content-type', 'application/json');
  if (sessionToken) headers.set('cookie', `__Host-admin-session=${sessionToken}`);
  const req = new Request(`https://shop.example.test${path}`, {
    method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  Object.defineProperty(req, 'cf', { value: { country } });
  return await app.request(req, undefined, env);
}
