import { Env } from './platform/Env.js';
import { SettingsGateway } from './bff/gateways/settings/SettingsGateway.js';
import { InProcessSettingsGateway } from './bff/gateways/settings/InProcessSettingsGateway.js';
import { createSettingsModule } from './modules/settings/module.config.js';
import { SettingsPublicApi } from './modules/settings/module.public-api.js';
import { IdentityGateway } from './bff/gateways/identity/IdentityGateway.js';
import { InProcessIdentityGateway } from './bff/gateways/identity/InProcessIdentityGateway.js';
import { createIdentityModule } from './modules/identity/module.config.js';
import { IdentityPublicApi } from './modules/identity/module.public-api.js';
import { MediaGateway } from './bff/gateways/media/MediaGateway.js';
import { InProcessMediaGateway } from './bff/gateways/media/InProcessMediaGateway.js';
import { createMediaModule } from './modules/media/module.config.js';
import { MediaPublicApi } from './modules/media/module.public-api.js';
import { CatalogGateway } from './bff/gateways/catalog/CatalogGateway.js';
import { InProcessCatalogGateway } from './bff/gateways/catalog/InProcessCatalogGateway.js';
import { createCatalogModule } from './modules/catalog/module.config.js';
import { CatalogPublicApi } from './modules/catalog/module.public-api.js';
import { StorefrontGateway } from './bff/gateways/storefront/StorefrontGateway.js';
import { InProcessStorefrontGateway } from './bff/gateways/storefront/InProcessStorefrontGateway.js';
import { createStorefrontModule } from './modules/storefront/module.config.js';
import { StorefrontPublicApi } from './modules/storefront/module.public-api.js';
import { SeoGateway } from './bff/gateways/seo/SeoGateway.js';
import { InProcessSeoGateway } from './bff/gateways/seo/InProcessSeoGateway.js';
import { createSeoModule } from './modules/seo/module.config.js';
import { SeoPublicApi } from './modules/seo/module.public-api.js';
import { CmsGateway } from './bff/gateways/cms/CmsGateway.js';
import { InProcessCmsGateway } from './bff/gateways/cms/InProcessCmsGateway.js';
import { createCmsModule } from './modules/cms/module.config.js';
import { CmsPublicApi } from './modules/cms/module.public-api.js';
import { PromotionsGateway } from './bff/gateways/promotions/PromotionsGateway.js';
import { InProcessPromotionsGateway } from './bff/gateways/promotions/InProcessPromotionsGateway.js';
import { createPromotionsModule } from './modules/promotions/module.config.js';
import { PromotionsPublicApi } from './modules/promotions/module.public-api.js';
import { ShippingGateway } from './bff/gateways/shipping/ShippingGateway.js';
import { InProcessShippingGateway } from './bff/gateways/shipping/InProcessShippingGateway.js';
import { createShippingModule } from './modules/shipping/module.config.js';
import { ShippingPublicApi } from './modules/shipping/module.public-api.js';
import { InventoryGateway } from './bff/gateways/inventory/InventoryGateway.js';
import { InProcessInventoryGateway } from './bff/gateways/inventory/InProcessInventoryGateway.js';
import { createInventoryModule } from './modules/inventory/module.config.js';
import { InventoryPublicApi } from './modules/inventory/module.public-api.js';
import { CartGateway } from './bff/gateways/cart/CartGateway.js';
import { InProcessCartGateway } from './bff/gateways/cart/InProcessCartGateway.js';
import { createCartModule } from './modules/cart/module.config.js';
import { CartPublicApi } from './modules/cart/module.public-api.js';
import { OrdersGateway } from './bff/gateways/orders/OrdersGateway.js';
import { InProcessOrdersGateway } from './bff/gateways/orders/InProcessOrdersGateway.js';
import { createOrdersModule } from './modules/orders/module.config.js';
import { OrdersPublicApi } from './modules/orders/module.public-api.js';
import { PaymentsGateway } from './bff/gateways/payments/PaymentsGateway.js';
import { InProcessPaymentsGateway } from './bff/gateways/payments/InProcessPaymentsGateway.js';
import { createPaymentsModule } from './modules/payments/module.config.js';
import { PaymentsPublicApi } from './modules/payments/module.public-api.js';
import { RealtimeGateway } from './bff/gateways/realtime/RealtimeGateway.js';
import { InProcessRealtimeGateway } from './bff/gateways/realtime/InProcessRealtimeGateway.js';
import { createRealtimeModule } from './modules/realtime/module.config.js';
import { RealtimePublicApi } from './modules/realtime/module.public-api.js';
import { InvoicingGateway } from './bff/gateways/invoicing/InvoicingGateway.js';
import { InProcessInvoicingGateway } from './bff/gateways/invoicing/InProcessInvoicingGateway.js';
import { InvoicingModuleContainer } from './modules/invoicing/module.config.js';
import { InvoicingPublicApi } from './modules/invoicing/module.public-api.js';
import { NotificationsGateway } from './bff/gateways/notifications/NotificationsGateway.js';
import { InProcessNotificationsGateway } from './bff/gateways/notifications/InProcessNotificationsGateway.js';
import { NotificationsModuleContainer } from './modules/notifications/module.config.js';
import { NotificationsPublicApi } from './modules/notifications/module.public-api.js';
import { AuditGateway } from './bff/gateways/audit/AuditGateway.js';
import { InProcessAuditGateway } from './bff/gateways/audit/InProcessAuditGateway.js';
import { AuditModuleContainer } from './modules/audit/module.config.js';
import { AuditPublicApi } from './modules/audit/module.public-api.js';
import { OutboxRelayService } from './platform/outbox/OutboxRelayService.js';

export interface AppCompositionRoot {
  settingsGateway: SettingsGateway;
  identityGateway: IdentityGateway;
  mediaGateway: MediaGateway;
  catalogGateway: CatalogGateway;
  storefrontGateway: StorefrontGateway;
  seoGateway: SeoGateway;
  cmsGateway: CmsGateway;
  promotionsGateway: PromotionsGateway;
  shippingGateway: ShippingGateway;
  inventoryGateway: InventoryGateway;
  cartGateway: CartGateway;
  ordersGateway: OrdersGateway;
  paymentsGateway: PaymentsGateway;
  realtimeGateway: RealtimeGateway;
  invoicingGateway: InvoicingGateway;
  notificationsGateway: NotificationsGateway;
  auditGateway: AuditGateway;
  outboxRelayService: OutboxRelayService;
}

export function buildCompositionRoot(env: Env): AppCompositionRoot {
  const settingsContainer = createSettingsModule(env);
  const settingsGateway = new InProcessSettingsGateway(new SettingsPublicApi(settingsContainer));

  const identityContainer = createIdentityModule(env);
  const identityGateway = new InProcessIdentityGateway(new IdentityPublicApi(identityContainer));

  const mediaContainer = createMediaModule(env);
  const mediaGateway = new InProcessMediaGateway(new MediaPublicApi(mediaContainer));

  const catalogContainer = createCatalogModule(env);
  const catalogGateway = new InProcessCatalogGateway(new CatalogPublicApi(catalogContainer));

  const storefrontContainer = createStorefrontModule(env);
  const storefrontGateway = new InProcessStorefrontGateway(new StorefrontPublicApi(storefrontContainer));

  const seoContainer = createSeoModule(env);
  const seoGateway = new InProcessSeoGateway(new SeoPublicApi(seoContainer));

  const cmsContainer = createCmsModule(env);
  const cmsGateway = new InProcessCmsGateway(new CmsPublicApi(cmsContainer));

  const promotionsContainer = createPromotionsModule(env);
  const promotionsGateway = new InProcessPromotionsGateway(new PromotionsPublicApi(promotionsContainer));

  const shippingContainer = createShippingModule(env);
  const shippingGateway = new InProcessShippingGateway(new ShippingPublicApi(shippingContainer));

  const inventoryContainer = createInventoryModule(env);
  const inventoryGateway = new InProcessInventoryGateway(new InventoryPublicApi(inventoryContainer));

  const cartContainer = createCartModule(env);
  const cartGateway = new InProcessCartGateway(new CartPublicApi(cartContainer));

  const ordersContainer = createOrdersModule(env);
  const ordersGateway = new InProcessOrdersGateway(new OrdersPublicApi(ordersContainer));

  const paymentsContainer = createPaymentsModule(env);
  const paymentsGateway = new InProcessPaymentsGateway(new PaymentsPublicApi(paymentsContainer));

  const realtimeContainer = createRealtimeModule(env);
  const realtimeGateway = new InProcessRealtimeGateway(new RealtimePublicApi(realtimeContainer));

  const invoicingContainer = new InvoicingModuleContainer({ db: env.DB, bucket: env.MEDIA_BUCKET });
  const invoicingGateway = new InProcessInvoicingGateway(new InvoicingPublicApi(invoicingContainer));

  const notificationsContainer = new NotificationsModuleContainer({
    db: env.DB,
    resendApiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
  });
  const notificationsGateway = new InProcessNotificationsGateway(new NotificationsPublicApi(notificationsContainer));

  const auditContainer = new AuditModuleContainer({ db: env.DB });
  const auditGateway = new InProcessAuditGateway(new AuditPublicApi(auditContainer));

  const outboxRelayService = new OutboxRelayService(env.DB, env.EVENTS_QUEUE);

  return {
    settingsGateway,
    identityGateway,
    mediaGateway,
    catalogGateway,
    storefrontGateway,
    seoGateway,
    cmsGateway,
    promotionsGateway,
    shippingGateway,
    inventoryGateway,
    cartGateway,
    ordersGateway,
    paymentsGateway,
    realtimeGateway,
    invoicingGateway,
    notificationsGateway,
    auditGateway,
    outboxRelayService,
  };
}
