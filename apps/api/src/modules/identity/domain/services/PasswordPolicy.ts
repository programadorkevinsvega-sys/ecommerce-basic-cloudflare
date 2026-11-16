const commonPasswords = new Set([
  'password', 'password1', 'password123', 'qwerty', 'qwerty123',
  '123456789012', '1234567890123', 'letmein123456', 'welcome12345',
]);

export class PasswordPolicy {
  public static isAcceptable(password: string): boolean {
    if (password.length < 12 || password.length > 128) return false;
    const normalized = password.trim().toLowerCase();
    if (commonPasswords.has(normalized)) return false;
    if (/^(.)\1{11,}$/.test(normalized)) return false;
    if (/^(?:0123456789|1234567890|9876543210|0987654321)+$/.test(normalized)) return false;
    return !/^(?:password|qwerty|welcome|admin|letmein|iloveyou)[0-9!@#$]*$/.test(normalized);
  }
}
