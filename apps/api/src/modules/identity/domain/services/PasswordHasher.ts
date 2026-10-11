export class PasswordHasher {
  private static readonly ITERATIONS = 100_000;
  private static readonly SALT_BYTES = 16;
  private static readonly HASH_BYTES = 32;

  public static async hash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_BYTES));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      this.HASH_BYTES * 8
    );

    const hashBytes = new Uint8Array(derivedBits);
    const saltHex = this.toHex(salt);
    const hashHex = this.toHex(hashBytes);

    return `pbkdf2_sha256$${this.ITERATIONS}$${saltHex}$${hashHex}`;
  }

  public static async verify(password: string, serializedHash: string): Promise<boolean> {
    const parts = serializedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
      return false;
    }

    const iterations = parseInt(parts[1] as string, 10);
    const saltHex = parts[2] as string;
    const originalHashHex = parts[3] as string;

    const salt = this.fromHex(saltHex);
    const originalHash = this.fromHex(originalHashHex);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      originalHash.length * 8
    );

    const derivedBytes = new Uint8Array(derivedBits);
    return this.timingSafeEqual(derivedBytes, originalHash);
  }

  private static toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  private static timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= (a[i] as number) ^ (b[i] as number);
    }
    return diff === 0;
  }
}
