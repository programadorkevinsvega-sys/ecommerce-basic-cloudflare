import { MiddlewareHandler } from 'hono';
import { nonceHtmlResponse } from './NonceHtmlResponse.js';

export const SecurityHeadersMiddleware: MiddlewareHandler = async (c, next) => {
  const nonce = createNonce();
  await next();

  c.res = await nonceHtmlResponse(c.res, nonce);
  c.header(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; script-src-attr 'none'; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';`
  );
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-Frame-Options', 'DENY');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
};

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
