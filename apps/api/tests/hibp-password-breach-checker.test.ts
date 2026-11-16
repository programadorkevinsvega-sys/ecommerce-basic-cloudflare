import { afterEach, describe, expect, it, vi } from 'vitest';
import { HibpCustomerPasswordBreachChecker } from '../src/modules/identity/infrastructure/services/HibpCustomerPasswordBreachChecker.js';

afterEach(() => vi.unstubAllGlobals());

describe('HIBP Pwned Passwords range checker', () => {
  it('sends only the five-character SHA-1 prefix and matches the suffix locally', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      '1E4C9B93F3F0682250B6CF8331B7EE68FD8:5\r\n00000000000000000000000000000000000:0',
    ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new HibpCustomerPasswordBreachChecker().isCompromised('password')).resolves.toBe(true);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6');
    expect(url).not.toContain('1E4C9B93F3F0682250B6CF8331B7EE68FD8');
    expect(new Headers(options.headers).get('Add-Padding')).toBe('true');
    expect(new Headers(options.headers).get('User-Agent')).toBe('VegaStore-Password-Policy/1.0');
  });

  it('accepts a password absent from the returned hash range', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      '00000000000000000000000000000000000:0',
    )));

    await expect(new HibpCustomerPasswordBreachChecker().isCompromised('A-long-unique-phrase!123'))
      .resolves.toBe(false);
  });

  it('fails closed when the provider is unavailable or returns invalid data', async () => {
    const checker = new HibpCustomerPasswordBreachChecker();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('untrusted response', { status: 206 })));
    await expect(checker.isCompromised('A-long-unique-phrase!123'))
      .rejects.toThrow('PASSWORD_BREACH_CHECK_UNAVAILABLE');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid')));
    await expect(checker.isCompromised('A-long-unique-phrase!123'))
      .rejects.toThrow('PASSWORD_BREACH_CHECK_UNAVAILABLE');
  });

  it('fails closed when the network request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network failure')));

    await expect(new HibpCustomerPasswordBreachChecker().isCompromised('A-long-unique-phrase!123'))
      .rejects.toThrow('PASSWORD_BREACH_CHECK_UNAVAILABLE');
  });
});
