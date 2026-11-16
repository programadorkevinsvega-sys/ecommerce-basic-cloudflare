import { describe, expect, it } from 'vitest';
import {
  createGuestCartCapability,
  resolveGuestCartCapability,
  verifyGuestCartCapability,
} from '../src/bff/security/GuestCartCapability.js';

const secret = 'checkout-test-secret-'.padEnd(32, 'x');

describe('guest cart capability', () => {
  it('issues a server-generated random cart ID instead of signing a legacy cookie value', async () => {
    const legacyCartId = 'cart_123e4567-e89b-42d3-a456-426614174000';
    const first = await resolveGuestCartCapability(legacyCartId, secret);
    const second = await resolveGuestCartCapability(legacyCartId, secret);

    expect(first.cartId).not.toBe(legacyCartId);
    expect(first.cartId).toMatch(/^cart_[0-9a-f]{64}$/);
    expect(first.shouldSetCookie).toBe(true);
    expect(await verifyGuestCartCapability(first.capability, secret)).toBe(first.cartId);
    expect(second.cartId).not.toBe(first.cartId);
  });

  it('rejects altered signatures and secrets shorter than 32 bytes', async () => {
    const capability = await createGuestCartCapability(`cart_${'d'.repeat(64)}`, secret);

    expect(await verifyGuestCartCapability(`${capability.slice(0, -1)}0`, secret)).toBeNull();
    await expect(createGuestCartCapability(`cart_${'d'.repeat(64)}`, 'short')).rejects.toThrow();
  });
});
