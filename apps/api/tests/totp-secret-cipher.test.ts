import { describe, expect, it } from 'vitest';
import { TotpSecretCipher } from '../src/modules/identity/infrastructure/persistence/d1/security/TotpSecretCipher.js';

const key = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

describe('TOTP secret encryption', () => {
  it('encrypts with AES-GCM and binds ciphertext to its administrator', async () => {
    const cipher = new TotpSecretCipher(key);
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const encrypted = await cipher.encrypt(plaintext, 'admin-1');

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain(plaintext);
    await expect(cipher.decrypt(encrypted, 'admin-1')).resolves.toBe(plaintext);
    await expect(cipher.decrypt(encrypted, 'admin-2')).rejects.toThrow();
    expect(await cipher.encrypt(plaintext, 'admin-1')).not.toBe(encrypted);
  });

  it('rejects missing and malformed encryption keys when encrypting', async () => {
    await expect(new TotpSecretCipher().encrypt('secret', 'admin-1'))
      .rejects.toThrow('TOTP_ENCRYPTION_KEY is required');
    expect(() => new TotpSecretCipher('not-base64')).toThrow('base64-encoded 32-byte');
    expect(() => new TotpSecretCipher('AQ==')).toThrow('exactly 32 bytes');
  });
});
