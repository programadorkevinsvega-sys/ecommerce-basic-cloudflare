import { describe, it, expect } from 'vitest';
import { HealthController } from '../src/bff/controllers/HealthController.js';
import { Env } from '../src/platform/Env.js';

describe('HealthController BFF', () => {
  it('debe responder 200 cuando los bindings están disponibles o configurados', async () => {
    const app = HealthController.createRoutes();
    const mockEnv = {
      DB: {
        prepare: () => ({
          run: async () => ({ success: true }),
        }),
      },
      CACHE: {},
      EVENTS_QUEUE: {},
      MEDIA_BUCKET: {},
    } as unknown as Env;

    const res = await app.request('/', {}, mockEnv);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; checks: Record<string, string> };
    expect(body.status).toBe('healthy');
    expect(body.checks.d1).toBe('ok');
  });
});
