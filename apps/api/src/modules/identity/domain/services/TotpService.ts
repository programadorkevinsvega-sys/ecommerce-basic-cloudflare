export class TotpService {
  private static readonly PERIOD_SECONDS = 30;
  private static readonly DIGITS = 6;

  public static generateSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return this.base32Encode(bytes);
  }

  public static async verifyCode(secretBase32: string, token: string, window = 1): Promise<boolean> {
    const cleanToken = token.trim();
    if (cleanToken.length !== this.DIGITS || !/^\d+$/.test(cleanToken)) {
      return false;
    }

    const currentCounter = Math.floor(Date.now() / 1000 / this.PERIOD_SECONDS);

    for (let step = -window; step <= window; step++) {
      const generated = await this.generateCodeForCounter(secretBase32, currentCounter + step);
      if (this.timingSafeEqualStr(cleanToken, generated)) {
        return true;
      }
    }

    return false;
  }

  private static async generateCodeForCounter(secretBase32: string, counter: number): Promise<string> {
    const keyBytes = this.base32Decode(secretBase32);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setBigUint64(0, BigInt(counter), false);

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hash = new Uint8Array(signature);

    const offset = (hash[hash.length - 1] as number) & 0x0f;
    const binary =
      (((hash[offset] as number) & 0x7f) << 24) |
      (((hash[offset + 1] as number) & 0xff) << 16) |
      (((hash[offset + 2] as number) & 0xff) << 8) |
      ((hash[offset + 3] as number) & 0xff);

    const otp = binary % 10 ** this.DIGITS;
    return otp.toString().padStart(this.DIGITS, '0');
  }

  private static base32Encode(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | (bytes[i] as number);
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private static base32Decode(input: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = input.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < clean.length; i++) {
      const idx = alphabet.indexOf(clean[i] as string);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(output);
  }

  private static timingSafeEqualStr(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}
