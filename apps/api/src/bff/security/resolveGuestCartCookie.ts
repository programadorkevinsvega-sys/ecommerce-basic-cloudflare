import { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Env } from '../../platform/Env.js';
import { resolveGuestCartCapability } from './GuestCartCapability.js';

export async function resolveGuestCartCookie(c: Context<{ Bindings: Env }>): Promise<string> {
  const resolved = await resolveGuestCartCapability(
    getCookie(c, '__Host-cart'),
    c.env?.GUEST_CART_HMAC_SECRET || '',
  );
  if (resolved.shouldSetCookie) {
    setCookie(c, '__Host-cart', resolved.capability, {
      path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (getCookie(c, 'vega_cart_id')) deleteCookie(c, 'vega_cart_id', { path: '/' });
  return resolved.cartId;
}
