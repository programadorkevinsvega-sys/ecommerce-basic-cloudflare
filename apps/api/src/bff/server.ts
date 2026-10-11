import { Hono } from 'hono';
import { Env } from '../platform/Env.js';
import { SecurityHeadersMiddleware } from './middleware/SecurityHeadersMiddleware.js';
import { TraceIdMiddleware } from './middleware/TraceIdMiddleware.js';
import { HealthController } from './controllers/HealthController.js';
import { SettingsController } from './controllers/settings/SettingsController.js';
import { AppCompositionRoot } from '../composition-root.js';

export function createBffApp(compositionRoot: AppCompositionRoot): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.use('*', TraceIdMiddleware);
  app.use('*', SecurityHeadersMiddleware);

  // Endpoint de salud del sistema
  app.route('/health', HealthController.createRoutes());

  // Documentación OpenAPI base
  app.get('/api/docs', (c) => {
    return c.json({
      openapi: '3.1.0',
      info: {
        title: 'Ecommerce Cloudflare API',
        version: '0.1.0',
        description: 'API Gateway REST (BFF) monolito modular 100% Cloudflare',
      },
      paths: {
        '/health': {
          get: { summary: 'Health check de bindings del Worker' },
        },
        '/api/v1/settings': {
          get: { summary: 'Consultar configuración de la tienda' },
          patch: { summary: 'Actualizar configuración de la tienda' },
        },
      },
    });
  });

  // Rutas de módulos montadas exclusivamente mediante Gateways
  app.route('/api/v1/settings', SettingsController.createRoutes(compositionRoot.settingsGateway));

  app.notFound((c) => {
    return c.json({ error: 'Recurso no encontrado' }, 404);
  });

  app.onError((err, c) => {
    console.error('Unhandled BFF error:', err);
    return c.json({ error: 'Error interno del servidor' }, 500);
  });

  return app;
}
