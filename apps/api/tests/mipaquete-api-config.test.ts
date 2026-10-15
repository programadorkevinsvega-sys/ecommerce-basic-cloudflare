import { describe, expect, it } from 'vitest';
import { readMiPaqueteApiConfig } from '../src/modules/shipping/infrastructure/carriers/mipaquete/MiPaqueteApiConfig.js';

describe('readMiPaqueteApiConfig', () => {
  it('requires both the Cloudflare secret and an explicit HTTPS API URL', () => {
    expect(readMiPaqueteApiConfig({ secret: 'a'.repeat(32) })).toBeNull();
    expect(readMiPaqueteApiConfig({ apiUrl: 'https://api.mipaquete.com' })).toBeNull();
  });

  it('accepts an explicitly configured MiPaquete HTTPS host', () => {
    const config = readMiPaqueteApiConfig({
      secret: 'a'.repeat(32),
      apiUrl: 'https://api-v2.mpr.mipaquete.com',
    });
    expect(config?.baseUrl.hostname).toBe('api-v2.mpr.mipaquete.com');
  });

  it('rejects insecure, credentialed, and non-provider URLs', () => {
    for (const apiUrl of [
      'http://api-v2.mpr.mipaquete.com',
      'https://user:pass@api-v2.mpr.mipaquete.com',
      'https://example.com',
    ]) {
      expect(readMiPaqueteApiConfig({ secret: 'a'.repeat(32), apiUrl })).toBeNull();
    }
  });

  it('rejects documented development hosts in production', () => {
    expect(readMiPaqueteApiConfig({ secret: 'a'.repeat(32), apiUrl: 'https://api-v2.dev.mpr.mipaquete.com', environment: 'production' })).toBeNull();
  });
});
