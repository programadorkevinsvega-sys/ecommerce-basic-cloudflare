const GENERATED_CART_ID_PATTERN = /^cart_[0-9a-f]{64}$/;

export class GuestCartCapabilityConfigurationError extends Error {
  public constructor() {
    super('GUEST_CART_HMAC_SECRET must contain at least 32 bytes');
    this.name = 'GuestCartCapabilityConfigurationError';
  }
}

export function isValidGuestCartId(cartId: string | undefined): cartId is string {
  return Boolean(cartId && GENERATED_CART_ID_PATTERN.test(cartId));
}

export async function createGuestCartCapability(cartId: string, secret: string): Promise<string> {
  if (!isValidGuestCartId(cartId)) throw new Error('Invalid guest cart identifier');
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, cartMessage(cartId));
  return `${cartId}.${toHex(new Uint8Array(signature))}`;
}

export async function verifyGuestCartCapability(value: string | undefined, secret: string): Promise<string | null> {
  if (!value) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 0) return null;
  const cartId = value.slice(0, separator);
  const signature = fromHex(value.slice(separator + 1));
  if (!isValidGuestCartId(cartId) || !signature || signature.byteLength !== 32) return null;
  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, signature, cartMessage(cartId));
  return valid ? cartId : null;
}

export async function resolveGuestCartCapability(
  currentCapability: string | undefined,
  secret: string,
): Promise<{ cartId: string; capability: string; shouldSetCookie: boolean }> {
  const currentCartId = await verifyGuestCartCapability(currentCapability, secret);
  if (currentCartId && currentCapability) {
    return { cartId: currentCartId, capability: currentCapability, shouldSetCookie: false };
  }
  const cartId = createGuestCartId();
  return { cartId, capability: await createGuestCartCapability(cartId, secret), shouldSetCookie: true };
}

export async function hashGuestCartId(cartId: string | undefined): Promise<string | null> {
  if (!isValidGuestCartId(cartId)) return null;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cartId));
  return toHex(new Uint8Array(bytes));
}

export type GuestCheckoutFingerprintPurpose = 'ip' | 'email' | 'cart';

export async function fingerprintGuestCheckoutSignal(
  purpose: GuestCheckoutFingerprintPurpose,
  value: string,
  secret: string,
): Promise<string> {
  if (!value || value.length > 320) throw new Error('Invalid guest checkout signal');
  const key = await importHmacKey(secret);
  const input = new TextEncoder().encode(`guest-checkout:${purpose}:v1\0${value}`);
  const digest = await crypto.subtle.sign('HMAC', key, input);
  return toHex(new Uint8Array(digest));
}

function createGuestCartId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `cart_${toHex(bytes)}`;
}

function cartMessage(cartId: string): Uint8Array {
  return new TextEncoder().encode(`guest-cart:v1\0${cartId}`);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret || '');
  if (raw.byteLength < 32) throw new GuestCartCapabilityConfigurationError();
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g) || [], (byte) => Number.parseInt(byte, 16));
}
