export class SessionTokenGenerator {
  public static generateRawToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public static async hashToken(rawToken: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashBytes = new Uint8Array(hashBuffer);
    return Array.from(hashBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
