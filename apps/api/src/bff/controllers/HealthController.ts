import { Hono } from 'hono';
import { Env } from '../../platform/Env.js';

export class HealthController {
  public static createRoutes(): Hono<{ Bindings: Env }> {
    const router = new Hono<{ Bindings: Env }>();

    router.get('/', async (c) => {
      const checks: Record<string, 'ok' | 'fail' | 'not_configured'> = {
        d1: 'ok',
        kv: 'ok',
        queue: 'ok',
        r2: 'ok',
      };

      try {
        if (!c.env.DB) checks.d1 = 'not_configured';
        else await c.env.DB.prepare('SELECT 1').run();
      } catch {
        checks.d1 = 'fail';
      }

      try {
        if (!c.env.CACHE) checks.kv = 'not_configured';
      } catch {
        checks.kv = 'fail';
      }

      try {
        if (!c.env.EVENTS_QUEUE) checks.queue = 'not_configured';
      } catch {
        checks.queue = 'fail';
      }

      try {
        if (!c.env.MEDIA_BUCKET) checks.r2 = 'not_configured';
      } catch {
        checks.r2 = 'fail';
      }

      const allOk = Object.values(checks).every((status) => status === 'ok' || status === 'not_configured');
      const statusCode = allOk ? 200 : 503;

      return c.json(
        {
          status: allOk ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          checks,
        },
        statusCode
      );
    });

    return router;
  }
}
