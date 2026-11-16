import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { PublicHtmlCacheMiddleware } from '../src/bff/middleware/PublicHtmlCacheMiddleware.js';

describe('public HTML cache policy', () => {
  it('prevents cached HTML from reusing a CSP nonce', async () => {
    const app = new Hono();
    app.use('*', PublicHtmlCacheMiddleware);
    app.get('/productos', (c) => c.html('<main>Catálogo</main>'));

    const response = await app.request('/productos?page=1');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toBe('Cookie');
    expect(response.headers.get('Cache-Tag')).toBeNull();
  });

  it('keeps personalized, searched and transactional requests out of cache', async () => {
    const app = new Hono();
    app.use('*', PublicHtmlCacheMiddleware);
    app.get('/productos', (c) => c.html('<main>Catálogo</main>'));
    app.get('/checkout', (c) => c.html('<main>Checkout</main>'));

    const personalized = await app.request('/productos', { headers: { cookie: '__Host-session=secret' } });
    const search = await app.request('/productos?q=camisa');
    const checkout = await app.request('/checkout');
    expect(personalized.headers.get('Cache-Control')).toBe('private, no-store');
    expect(search.headers.get('Cache-Control')).toBe('private, no-store');
    expect(checkout.headers.get('Cache-Control')).toBeNull();
  });
});
