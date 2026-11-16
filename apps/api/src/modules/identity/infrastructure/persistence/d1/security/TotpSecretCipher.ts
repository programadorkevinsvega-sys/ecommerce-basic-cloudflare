const ENVELOPE_PREFIX = 'enc:v1:';
const AES_GCM_NONCE_BYTES = 12;
const AES_GCM_TAG_BYTES = 16;
const AES_KEY_BYTES = 32;

export class TotpSecretCipher {
  private readonly keyBytes?: Uint8Array;
  private importedKey?: Promise<CryptoKey>;

  public constructor(encodedKey?: string) {
    if (!encodedKey) return;
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encodedKey)) {
      throw new Error('TOTP_ENCRYPTION_KEY must be base64-encoded 32-byte key material');
    }
    const decoded = atob(encodedKey);
    if (decoded.length !== AES_KEY_BYTES) {
      throw new Error('TOTP_ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
    this.keyBytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  }

  public isEncrypted(value: string): boolean {
    return value.startsWith('enc:');
  }

  public async encrypt(secret: string, adminId: string): Promise<string> {
    const nonce = crypto.getRandomValues(new Uint8Array(AES_GCM_NONCE_BYTES));
    const encrypted = await crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv: nonce,
      additionalData: this.additionalData(adminId),
      tagLength: AES_GCM_TAG_BYTES * 8,
    }, await this.getKey(), new TextEncoder().encode(secret));
    const payload = new Uint8Array(nonce.length + encrypted.byteLength);
    payload.set(nonce);
    payload.set(new Uint8Array(encrypted), nonce.length);
    return `${ENVELOPE_PREFIX}${this.encodeBase64(payload)}`;
  }

  public async decrypt(value: string, adminId: string): Promise<string> {
    if (!this.isEncrypted(value)) return value;
    if (!value.startsWith(ENVELOPE_PREFIX)) {
      throw new Error('Unsupported encrypted TOTP secret version');
    }
    const payload = this.decodeBase64(value.slice(ENVELOPE_PREFIX.length));
    if (payload.length <= AES_GCM_NONCE_BYTES + AES_GCM_TAG_BYTES) {
      throw new Error('Encrypted TOTP secret has an invalid length');
    }
    const plaintext = await crypto.subtle.decrypt({
      name: 'AES-GCM',
      iv: payload.slice(0, AES_GCM_NONCE_BYTES),
      additionalData: this.additionalData(adminId),
      tagLength: AES_GCM_TAG_BYTES * 8,
    }, await this.getKey(), payload.slice(AES_GCM_NONCE_BYTES));
    return new TextDecoder().decode(plaintext);
  }

  private async getKey(): Promise<CryptoKey> {
    if (!this.keyBytes) {
      throw new Error('TOTP_ENCRYPTION_KEY is required to access administrator MFA secrets');
    }
    this.importedKey ??= crypto.subtle.importKey('raw', this.keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
    return this.importedKey;
  }

  private additionalData(adminId: string): Uint8Array {
    return new TextEncoder().encode(`identity-admin-mfa:v1:${adminId}`);
  }

  private encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  private decodeBase64(value: string): Uint8Array {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
}
