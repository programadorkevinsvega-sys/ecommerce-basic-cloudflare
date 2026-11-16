import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createRateLimitMiddleware } from '../src/bff/middleware/RateLimitMiddleware.js';
import { extractSessionToken } from '../src/bff/security/extractSessionToken.js';
import { Env } from '../src/platform/Env.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';

describe('session token extraction', () => {
  it('matches exact cookie names and rejects bearer tokens in production', () => {
    const request = new Request('https://shop.example.test/', {
      headers: { cookie: 'x__Host-session=invalid; __Host-session=valid', authorization: 'Bearer ignored' },
    });

    expect(extractSessionToken(request, '__Host-session', 'production')).toBe('valid');
    expect(extractSessionToken(new Request('https://shop.example.test/', {
      headers: { cookie: 'x__Host-session=invalid' },
    }), '__Host-session', 'development')).toBeNull();
  });

  it('accepts bearer tokens only in explicit non-production environments', () => {
    const request = new Request('https://shop.example.test/', {
      headers: { authorization: 'Bearer test-token' },
    });

    expect(extractSessionToken(request, '__Host-session', 'staging')).toBe('test-token');
    expect(extractSessionToken(request, '__Host-session', 'production')).toBeNull();
    expect(extractSessionToken(request, '__Host-session')).toBeNull();
  });
});

describe('request rate limiting', () => {
  it('uses the public-read bindings only for the selected public GET routes', async () => {
    const searchLimit = vi.fn().mockResolvedValue({ success: true });
    const readLimit = vi.fn().mockResolvedValue({ success: true });
    const app = new Hono<{ Bindings: Env }>();
    app.use('*', createRateLimitMiddleware());
    for (const path of ['/api/v1/search/suggestions', '/api/v1/shipping/locations', '/api/v1/cart']) {
      app.get(path, (c) => c.text('ok'));
    }
    app.get('/api/v1/orders/:id', (c) => c.text('ok'));
    const env = {
      PUBLIC_SEARCH_LIMITER: { limit: searchLimit },
      PUBLIC_READ_LIMITER: { limit: readLimit },
    } as unknown as Env;

    await app.request('/api/v1/search/suggestions', {}, env);
    await app.request('/api/v1/shipping/locations', {}, env);
    await app.request('/api/v1/cart', {}, env);
    await app.request('/api/v1/orders/order-1', {}, env);

    expect(searchLimit).toHaveBeenCalledWith({ key: 'public_search:unknown' });
    expect(searchLimit).toHaveBeenCalledTimes(1);
    expect(readLimit).toHaveBeenCalledTimes(2);
  });

  it('applies separate IP and actor buckets scoped to the stable API route', async () => {
    const ipLimit = vi.fn().mockResolvedValue({ success: true });
    const actorLimit = vi.fn().mockResolvedValue({ success: true });
    const identity = {
      validateSession: vi.fn().mockResolvedValue({
        actorId: 'customer-1', actorType: 'customer', mfaEnabled: true, permissions: [],
      }),
    } as unknown as IdentityGateway;
    const app = new Hono<{ Bindings: Env }>();
    app.use('*', createRateLimitMiddleware(identity));
    app.patch('/api/v1/orders/:id', (c) => c.text('ok'));
    app.post('/api/v1/public/items/:id', (c) => c.text('ok'));
    const env = {
      API_IP_WRITE_LIMITER: { limit: ipLimit },
      API_WRITE_LIMITER: { limit: actorLimit },
      ENVIRONMENT: 'production',
    } as unknown as Env;

    const actorResponse = await app.request('/api/v1/orders/order-1', {
      method: 'PATCH', headers: { cookie: '__Host-session=session', 'cf-connecting-ip': '192.0.2.1' },
    }, env);
    const ipResponse = await app.request('/api/v1/public/items/item-1', {
      method: 'POST', headers: { 'cf-connecting-ip': '192.0.2.1' },
    }, env);

    expect(actorResponse.status).toBe(200);
    expect(ipResponse.status).toBe(200);
    expect(actorLimit).toHaveBeenCalledWith({ key: 'actor:customer-1:PATCH:/api/v1/orders' });
    expect(ipLimit).toHaveBeenCalledWith({ key: 'ip:192.0.2.1:POST:/api/v1/public' });
  });
});
