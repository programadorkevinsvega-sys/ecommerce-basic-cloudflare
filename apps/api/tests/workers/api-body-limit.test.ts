import { describe, expect, it } from 'vitest';
import { exports } from 'cloudflare:workers';

describe('Worker API request body limit', () => {
  it('rejects oversized webhook bodies before parsing or calling payment services', async () => {
    const response = await exports.default.fetch('https://shop.test/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(1024 * 1024 + 1) },
      body: '{}',
    });

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: 'La solicitud supera el límite de 1 MiB' });
  }, 15_000);
});
