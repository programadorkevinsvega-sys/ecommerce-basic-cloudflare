import { Hono } from 'hono';
import { Env } from '../platform/Env.js';
import { SecurityHeadersMiddleware } from './middleware/SecurityHeadersMiddleware.js';
import { TraceIdMiddleware } from './middleware/TraceIdMiddleware.js';
import { HealthController } from './controllers/HealthController.js';
import { SettingsController } from './controllers/settings/SettingsController.js';
import { CustomerAuthController } from './controllers/auth/CustomerAuthController.js';
import { AdminAuthController } from './controllers/auth/AdminAuthController.js';
import { MediaController } from './controllers/media/MediaController.js';
import { CatalogController } from './controllers/catalog/CatalogController.js';
import { StorefrontController } from './controllers/storefront/StorefrontController.js';
import { AdminUiController } from './controllers/admin/AdminUiController.js';
import { SeoController } from './controllers/seo/SeoController.js';
import { CmsController } from './controllers/cms/CmsController.js';
import { AppCompositionRoot } from '../composition-root.js';

export function createBffApp(compositionRoot: AppCompositionRoot): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.use('*', TraceIdMiddleware);
  app.use('*', SecurityHeadersMiddleware);

  // CMS: Páginas con bloques (/p/:slug), menús y gestión de contenido
  app.route(
    '/',
    CmsController.createRoutes(
      compositionRoot.cmsGateway,
      compositionRoot.identityGateway
    )
  );

  // SEO: robots.txt, sitemap.xml y gestión de redirects
  app.route(
    '/',
    SeoController.createRoutes(
      compositionRoot.seoGateway,
      compositionRoot.catalogGateway
    )
  );

  // Panel Visual Administrativo (Fase 1 / Admin UI)
  app.route(
    '/admin',
    AdminUiController.createRoutes(
      compositionRoot.identityGateway,
      compositionRoot.catalogGateway,
      compositionRoot.settingsGateway
    )
  );

  // Storefront público SSR (Fases 3 y 4: Home, Banners, Catálogo, Detalle y Auth)
  app.route(
    '/',
    StorefrontController.createRoutes(
      compositionRoot.catalogGateway,
      compositionRoot.identityGateway,
      compositionRoot.storefrontGateway,
      compositionRoot.seoGateway
    )
  );

  // Salud del Worker y bindings
  app.route('/health', HealthController.createRoutes());

  // Rutas de autenticación de clientes y administradores
  app.route('/api/v1/auth', CustomerAuthController.createRoutes(compositionRoot.identityGateway));
  app.route('/api/v1/admin/auth', AdminAuthController.createRoutes(compositionRoot.identityGateway));

  // Rutas de módulos montadas exclusivamente mediante Gateways
  app.route('/api/v1/settings', SettingsController.createRoutes(compositionRoot.settingsGateway));
  app.route('/media', MediaController.createRoutes(compositionRoot.mediaGateway, compositionRoot.identityGateway));
  app.route('/api/v1', CatalogController.createRoutes(compositionRoot.catalogGateway, compositionRoot.identityGateway));

  // OpenAPI Docs
  app.get('/api/docs', (c) => {
    return c.json({
      openapi: '3.1.0',
      info: {
        title: 'Ecommerce Cloudflare API',
        version: '0.2.0',
        description: 'API Gateway REST (BFF) monolito modular 100% Cloudflare',
      },
      paths: {
        '/health': { get: { summary: 'Health check de bindings' } },
        '/api/v1/auth/register': { post: { summary: 'Registro de clientes' } },
        '/api/v1/auth/login': { post: { summary: 'Login de clientes' } },
        '/api/v1/auth/me': { get: { summary: 'Perfil del cliente autenticado' } },
        '/api/v1/admin/auth/login': { post: { summary: 'Login de administradores' } },
        '/api/v1/settings': { get: { summary: 'Consultar configuración' } },
        '/media/{id}': { get: { summary: 'Servir imagen desde R2' } },
        '/media/upload': { post: { summary: 'Subir archivo multimedia (Admin)' } },
        '/api/v1/products': { get: { summary: 'Listar productos públicos y búsqueda FTS5' } },
        '/api/v1/products/{slug}': { get: { summary: 'Detalle de producto por slug' } },
        '/api/v1/admin/products': { post: { summary: 'Crear producto con políticas comerciales (Admin)' } },
      },
    });
  });

  app.notFound((c) => c.json({ error: 'Recurso no encontrado' }, 404));
  app.onError((err, c) => {
    console.error('Unhandled BFF error:', err);
    return c.json({ error: 'Error interno del servidor' }, 500);
  });

  return app;
}
