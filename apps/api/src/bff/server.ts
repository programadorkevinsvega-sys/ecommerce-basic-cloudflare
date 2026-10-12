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
import { StorefrontAdminController } from './controllers/storefront/StorefrontAdminController.js';
import { AdminUiController } from './controllers/admin/AdminUiController.js';
import { SeoController } from './controllers/seo/SeoController.js';
import { CmsController } from './controllers/cms/CmsController.js';
import { PromotionsController } from './controllers/promotions/PromotionsController.js';
import { ShippingController } from './controllers/shipping/ShippingController.js';
import { CartController } from './controllers/cart/CartController.js';
import { InventoryController } from './controllers/inventory/InventoryController.js';
import { OrdersController } from './controllers/orders/OrdersController.js';
import { PaymentsController } from './controllers/payments/PaymentsController.js';
import { RealtimeController } from './controllers/realtime/RealtimeController.js';
import { StorefrontCheckoutController } from './controllers/checkout/StorefrontCheckoutController.js';
import { AppCompositionRoot } from '../composition-root.js';

export function createBffApp(cRoot: AppCompositionRoot): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.use('*', TraceIdMiddleware);
  app.use('*', SecurityHeadersMiddleware);

  // Storefront Admin API
  app.route('/', StorefrontAdminController.createRoutes(cRoot.storefrontGateway));
  app.route('/', PromotionsController.createRoutes(cRoot.promotionsGateway, cRoot.identityGateway));
  app.route('/', ShippingController.createRoutes(cRoot.shippingGateway, cRoot.identityGateway));
  app.route('/', CmsController.createRoutes(cRoot.cmsGateway, cRoot.identityGateway));
  app.route('/', SeoController.createRoutes(cRoot.seoGateway, cRoot.catalogGateway));

  // Cart, Inventory, Orders, Payments, Realtime BFF APIs
  app.route('/', CartController.createRoutes(cRoot.cartGateway, cRoot.identityGateway));
  app.route('/', InventoryController.createRoutes(cRoot.inventoryGateway, cRoot.identityGateway));
  app.route('/', OrdersController.createRoutes(cRoot.ordersGateway, cRoot.identityGateway, cRoot.shippingGateway, cRoot.catalogGateway, cRoot.realtimeGateway, cRoot.inventoryGateway));
  app.route('/', PaymentsController.createRoutes(cRoot.paymentsGateway, cRoot.ordersGateway, cRoot.identityGateway, cRoot.realtimeGateway, cRoot.inventoryGateway));
  app.route('/', RealtimeController.createRoutes(cRoot.realtimeGateway));

  // Storefront Checkout Pages (/carrito, /checkout, /checkout/resultado)
  app.route('/', StorefrontCheckoutController.createRoutes(cRoot.cartGateway, cRoot.catalogGateway, cRoot.shippingGateway, cRoot.ordersGateway, cRoot.cmsGateway, cRoot.identityGateway, cRoot.settingsGateway));

  // Panel Visual Administrativo
  app.route('/admin', AdminUiController.createRoutes(
    cRoot.identityGateway,
    cRoot.catalogGateway,
    cRoot.settingsGateway,
    cRoot.storefrontGateway,
    cRoot.cmsGateway,
    cRoot.promotionsGateway,
    cRoot.shippingGateway
  ));

  // Storefront público SSR
  app.route('/', StorefrontController.createRoutes(
    cRoot.catalogGateway,
    cRoot.identityGateway,
    cRoot.storefrontGateway,
    cRoot.seoGateway,
    cRoot.cmsGateway,
    cRoot.promotionsGateway
  ));

  // Infra y Auth
  app.route('/health', HealthController.createRoutes());
  app.route('/api/v1/auth', CustomerAuthController.createRoutes(cRoot.identityGateway));
  app.route('/api/v1/admin/auth', AdminAuthController.createRoutes(cRoot.identityGateway));
  app.route('/api/v1/settings', SettingsController.createRoutes(cRoot.settingsGateway));
  app.route('/media', MediaController.createRoutes(cRoot.mediaGateway, cRoot.identityGateway));
  app.route('/api/v1', CatalogController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway));

  app.notFound((c) => c.json({ error: 'Recurso no encontrado' }, 404));
  app.onError((err, c) => {
    console.error('Unhandled BFF error:', err);
    return c.json({ error: 'Error interno del servidor' }, 500);
  });

  return app;
}
