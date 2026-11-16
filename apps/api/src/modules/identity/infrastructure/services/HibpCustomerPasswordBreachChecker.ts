import { PasswordBreachCheckUnavailableError } from '../../application/errors/PasswordBreachCheckUnavailableError.js';
import { ICustomerPasswordBreachChecker } from '../../application/ports/ICustomerPasswordBreachChecker.js';

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const REQUEST_TIMEOUT_MS = 4_000;

export class HibpCustomerPasswordBreachChecker implements ICustomerPasswordBreachChecker {
  public async isCompromised(password: string): Promise<boolean> {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
        headers: {
          'Add-Padding': 'true',
          'User-Agent': 'VegaStore-Password-Policy/1.0',
        },
        signal: controller.signal,
      });
      if (response.status !== 200) throw new PasswordBreachCheckUnavailableError();
      const hashes = await response.text();
      return parseRangeResponse(hashes, suffix);
    } catch (error) {
      if (error instanceof PasswordBreachCheckUnavailableError) throw error;
      throw new PasswordBreachCheckUnavailableError();
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function sha1(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function parseRangeResponse(body: string, expectedSuffix: string): boolean {
  const lines = body.trim().split(/\r?\n/);
  if (!body.trim() || lines.some((line) => !/^[0-9A-F]{35}:[0-9]+$/i.test(line))) {
    throw new PasswordBreachCheckUnavailableError();
  }
  return lines.some((line) => {
    const separator = line.indexOf(':');
    const suffix = line.slice(0, separator);
    const count = line.slice(separator + 1);
    return suffix.toUpperCase() === expectedSuffix && Number(count) > 0;
  });
}
