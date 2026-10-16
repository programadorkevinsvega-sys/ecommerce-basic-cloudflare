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
import { CatalogBrandAdminController } from './controllers/catalog/CatalogBrandAdminController.js';
import { CatalogAuxiliaryAdminController } from './controllers/catalog/CatalogAuxiliaryAdminController.js';
import { CatalogTaxonomyListController } from './controllers/catalog/CatalogTaxonomyListController.js';
import { CatalogTaxonomyMutationController } from './controllers/catalog/CatalogTaxonomyMutationController.js';
import { CollectionAdminController } from './controllers/catalog/CollectionAdminController.js';
import { ProductTagAdminController } from './controllers/catalog/ProductTagAdminController.js';
import { BrandPagesController } from './controllers/storefront/BrandPagesController.js';
import { CollectionPagesController } from './controllers/storefront/CollectionPagesController.js';
import { StorefrontController } from './controllers/storefront/StorefrontController.js';
import { ProductReviewsPageController } from './controllers/storefront/ProductReviewsPageController.js';
import { StorefrontAdminController } from './controllers/storefront/StorefrontAdminController.js';
import { AdminUiController } from './controllers/admin/AdminUiController.js';
import { SeoController } from './controllers/seo/SeoController.js';
import { CmsController } from './controllers/cms/CmsController.js';
import { CmsBlogAdminController } from './controllers/cms/CmsBlogAdminController.js';
import { CmsMenuAdminController } from './controllers/cms/CmsMenuAdminController.js';
import { CmsBlogPublicController } from './controllers/cms/CmsBlogPublicController.js';
import { PromotionsController } from './controllers/promotions/PromotionsController.js';
import { ShippingController } from './controllers/shipping/ShippingController.js';
import { FreeShippingRuleController } from './controllers/shipping/FreeShippingRuleController.js';
import { MiPaqueteConfigController } from './controllers/shipping/MiPaqueteConfigController.js';
import { MiPaqueteShipmentController } from './controllers/shipping/MiPaqueteShipmentController.js';
import { CartController } from './controllers/cart/CartController.js';
import { InventoryController } from './controllers/inventory/InventoryController.js';
import { OrdersController } from './controllers/orders/OrdersController.js';
import { PaymentsController } from './controllers/payments/PaymentsController.js';
import { RealtimeController } from './controllers/realtime/RealtimeController.js';
import { StorefrontCheckoutController } from './controllers/checkout/StorefrontCheckoutController.js';
import { InvoicingController } from './controllers/invoicing/InvoicingController.js';
import { CustomerAccountController } from './controllers/account/CustomerAccountController.js';
import { CustomerAccountSecurityController } from './controllers/account/CustomerAccountSecurityController.js';
import { AuditController } from './controllers/audit/AuditController.js';
import { ReviewsController } from './controllers/reviews/ReviewsController.js';
import { ReviewsAdminController } from './controllers/reviews/ReviewsAdminController.js';
import { OrderTrackingController } from './controllers/orders/OrderTrackingController.js';
import { AppCompositionRoot } from '../composition-root.js';
import { CsrfProtectionMiddleware } from './middleware/CsrfProtectionMiddleware.js';
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware.js';
import { createAdminMfaGateMiddleware } from './middleware/AdminMfaGateMiddleware.js';
import { createAdminMutationAuditMiddleware } from './middleware/AdminMutationAuditMiddleware.js';
import { AdminMutationSnapshotProvider } from './middleware/AdminMutationSnapshotProvider.js';
import { renderBaseLayout } from './views/renderBaseLayout.js';
import { renderNotFoundPage } from './views/renderNotFoundPage.js';
import { getCustomerEmail, getStorefrontNavMenus } from './controllers/storefront/StorefrontNavigationHelper.js';
import { PublicHtmlCacheMiddleware } from './middleware/PublicHtmlCacheMiddleware.js';
import { PublicHtmlCacheInvalidationMiddleware } from './middleware/PublicHtmlCacheInvalidationMiddleware.js';

export function createBffApp(cRoot: AppCompositionRoot): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.use('*', TraceIdMiddleware);
  app.use('*', SecurityHeadersMiddleware);
  app.use('*', PublicHtmlCacheMiddleware);
  app.use('/api/*', RateLimitMiddleware);
  app.use('/media/upload', RateLimitMiddleware);
  app.use('/api/*', CsrfProtectionMiddleware);
  app.use('/api/v1/admin/*', createAdminMfaGateMiddleware(cRoot.identityGateway));
  const mutationSnapshots = new AdminMutationSnapshotProvider(cRoot);
  app.use('*', createAdminMutationAuditMiddleware(
    cRoot.identityGateway,
    cRoot.auditGateway,
    mutationSnapshots,
  ));
  app.use('*', PublicHtmlCacheInvalidationMiddleware);

  // Storefront Admin API
  app.route('/', StorefrontAdminController.createRoutes(cRoot.storefrontGateway, cRoot.identityGateway));
  app.route('/', PromotionsController.createRoutes(cRoot.promotionsGateway, cRoot.identityGateway));
  app.route('/', ShippingController.createRoutes(cRoot.shippingGateway, cRoot.identityGateway));
  app.route('/', FreeShippingRuleController.createRoutes(cRoot.shippingGateway, cRoot.identityGateway, cRoot.catalogGateway, cRoot.auditGateway));
  app.route('/', MiPaqueteConfigController.createRoutes(cRoot.shippingGateway, cRoot.identityGateway, cRoot.auditGateway));
  app.route('/', MiPaqueteShipmentController.createRoutes({ identity: cRoot.identityGateway,
    orders: cRoot.ordersGateway, settings: cRoot.settingsGateway, shipping: cRoot.shippingGateway,
    audit: cRoot.auditGateway, notifications: cRoot.notificationsGateway }));
  app.route('/', CmsController.createRoutes(cRoot.cmsGateway, cRoot.identityGateway, cRoot.settingsGateway, cRoot.storefrontGateway));
  app.route('/', CmsMenuAdminController.createRoutes(cRoot.cmsGateway, cRoot.identityGateway));
  app.route('/', CmsBlogAdminController.createRoutes(cRoot.cmsGateway, cRoot.identityGateway, cRoot.seoGateway, cRoot.mediaGateway));
  app.route('/', SeoController.createRoutes(cRoot.seoGateway, cRoot.catalogGateway, cRoot.identityGateway));

  // Cart, Inventory, Orders, Payments, Realtime, Invoicing, Audit BFF APIs
  app.route('/', CartController.createRoutes(cRoot.cartGateway, cRoot.identityGateway, cRoot.catalogGateway));
  app.route('/', OrderTrackingController.createRoutes(cRoot.ordersGateway, cRoot.cmsGateway, cRoot.identityGateway, cRoot.settingsGateway, cRoot.notificationsGateway));
  app.route('/', InventoryController.createRoutes(cRoot.inventoryGateway, cRoot.identityGateway, cRoot.catalogGateway, cRoot.auditGateway));
  app.route('/', OrdersController.createRoutes(
    cRoot.ordersGateway,
    cRoot.identityGateway,
    cRoot.shippingGateway,
    cRoot.catalogGateway,
    cRoot.realtimeGateway,
    cRoot.inventoryGateway,
    cRoot.notificationsGateway,
    cRoot.settingsGateway,
    cRoot.promotionsGateway
  ));
  app.route('/', PaymentsController.createRoutes(
    cRoot.paymentsGateway,
    cRoot.ordersGateway,
    cRoot.identityGateway,
    cRoot.realtimeGateway,
    cRoot.inventoryGateway,
    cRoot.invoicingGateway,
    cRoot.notificationsGateway,
    cRoot.auditGateway,
    cRoot.settingsGateway,
    cRoot.shippingGateway
  ));
  app.route('/', RealtimeController.createRoutes(cRoot.realtimeGateway, cRoot.identityGateway));
  app.route('/', InvoicingController.createRoutes(cRoot.invoicingGateway, cRoot.identityGateway, cRoot.auditGateway));
  app.route('/', AuditController.createRoutes(cRoot.auditGateway, cRoot.identityGateway));

  // Storefront Checkout Pages (/carrito, /checkout, /checkout/resultado) y Cuenta del cliente (/cuenta)
  app.route('/', StorefrontCheckoutController.createRoutes(cRoot.cartGateway, cRoot.catalogGateway, cRoot.shippingGateway, cRoot.ordersGateway, cRoot.cmsGateway, cRoot.identityGateway, cRoot.settingsGateway, cRoot.storefrontGateway, cRoot.promotionsGateway));
  app.route('/', CustomerAccountController.createRoutes(cRoot.identityGateway, cRoot.ordersGateway, cRoot.invoicingGateway));
  app.route('/', CustomerAccountSecurityController.createRoutes(cRoot.identityGateway));

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
    cRoot.promotionsGateway,
    cRoot.settingsGateway,
    cRoot.reviewsGateway
  ));
  app.route('/', ProductReviewsPageController.createRoutes(cRoot.catalogGateway,cRoot.identityGateway,cRoot.reviewsGateway,cRoot.cmsGateway,cRoot.settingsGateway));
  app.route('/', BrandPagesController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway, cRoot.cmsGateway, cRoot.settingsGateway, cRoot.promotionsGateway, cRoot.storefrontGateway));
  app.route('/', CollectionPagesController.createRoutes(cRoot.catalogGateway,cRoot.identityGateway,cRoot.cmsGateway,cRoot.settingsGateway,cRoot.promotionsGateway,cRoot.storefrontGateway));
  app.route('/', CmsBlogPublicController.createRoutes(cRoot.cmsGateway,cRoot.identityGateway,cRoot.settingsGateway,cRoot.storefrontGateway));

  // Infra y Auth
  app.route('/health', HealthController.createRoutes());
  app.route('/api/v1/auth', CustomerAuthController.createRoutes(cRoot.identityGateway));
  app.route('/api/v1/admin/auth', AdminAuthController.createRoutes(cRoot.identityGateway));
  app.route('/api/v1/settings', SettingsController.createRoutes(cRoot.settingsGateway, cRoot.identityGateway));
  app.route('/media', MediaController.createRoutes(cRoot.mediaGateway, cRoot.identityGateway));
  app.route('/api/v1', CatalogController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway, cRoot.settingsGateway, cRoot.auditGateway, cRoot.shippingGateway));
  app.route('/api/v1', CatalogBrandAdminController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway, cRoot.auditGateway));
  app.route('/api/v1', CatalogTaxonomyListController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway));
  app.route('/api/v1', CatalogTaxonomyMutationController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway, cRoot.auditGateway));
  app.route('/api/v1', CollectionAdminController.createRoutes(cRoot.catalogGateway,cRoot.identityGateway,cRoot.auditGateway));
  app.route('/api/v1', ProductTagAdminController.createRoutes(cRoot.catalogGateway,cRoot.identityGateway,cRoot.auditGateway));
  app.route('/api/v1', CatalogAuxiliaryAdminController.createRoutes(cRoot.catalogGateway, cRoot.identityGateway, cRoot.auditGateway));
  app.route('/api/v1', ReviewsController.createRoutes(cRoot.catalogGateway, cRoot.reviewsGateway, cRoot.identityGateway));
  app.route('/api/v1', ReviewsAdminController.createRoutes(cRoot.reviewsGateway,cRoot.catalogGateway,cRoot.identityGateway,cRoot.ordersGateway));

  app.notFound(async (c) => {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD' || c.req.path.startsWith('/api/') || c.req.path.startsWith('/admin') || c.req.path.startsWith('/media/') || c.req.path === '/health') {
      return c.json({ error: 'Recurso no encontrado' }, 404);
    }
    const [customerEmail, nav] = await Promise.all([
      getCustomerEmail(c, cRoot.identityGateway),
      getStorefrontNavMenus(cRoot.cmsGateway, cRoot.settingsGateway),
    ]);
    return c.html(renderBaseLayout({
      title: 'Página no encontrada | Vega Store',
      description: 'No encontramos la página que buscas. Explora el catálogo de Vega Store.',
      noindex: true,
      bodyHtml: renderNotFoundPage(c.req.path),
      customerEmail,
      headerMenuItems: nav.headerMenuItems,
      footerMenuItems: nav.footerMenuItems,
      footerStoreProfile: nav.footerStoreProfile,
    }), 404);
  });
  app.onError((err, c) => {
    const traceContext = c.get('traceContext');
    console.error(JSON.stringify({ event: 'bff.unhandled_error', trace_id: traceContext?.traceId, request_id: traceContext?.requestId, error_name: err instanceof Error ? err.name : 'UnknownError' }));
    return c.json({ error: 'Error interno del servidor' }, 500);
  });

  return app;
}
