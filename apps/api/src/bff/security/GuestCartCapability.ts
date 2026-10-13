const CART_ID_PATTERN = /^cart_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function hashGuestCartId(cartId: string | undefined): Promise<string | null> {
  if (!cartId || !CART_ID_PATTERN.test(cartId)) return null;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cartId));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function isValidGuestCartId(cartId: string | undefined): cartId is string {
  return Boolean(cartId && CART_ID_PATTERN.test(cartId));
}
