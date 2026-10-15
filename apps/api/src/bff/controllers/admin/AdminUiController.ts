import { Hono } from 'hono';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { renderAdminLoginPage } from '../../views/admin/renderAdminLoginPage.js';
import { renderAdminDashboardPage } from '../../views/admin/renderAdminDashboardPage.js';
import { StoreSettingsResponse } from '../../gateways/settings/SettingsGateway.js';
import { renderAdminMfaSetupPage } from '../../views/admin/renderAdminMfaSetupPage.js';

export class AdminUiController {
  public static createRoutes(
    identityGateway: IdentityGateway,
    catalogGateway: CatalogGateway,
    settingsGateway: SettingsGateway,
    storefrontGateway: StorefrontGateway,
    cmsGateway: CmsGateway,
    promotionsGateway: PromotionsGateway,
    shippingGateway: ShippingGateway
  ): Hono {
    const router = new Hono();

    // Pantalla de login de administración
    router.get('/login', (c) => {
      return c.html(renderAdminLoginPage());
    });

    router.get('/mfa-setup', async (c) => {
      const token = c.req.header('cookie')?.match(/(?:^|;\s*)__Host-admin-session=([^;]+)/)?.[1];
      if (!token) return c.redirect('/admin/login');
      try {
        const session = await identityGateway.validateSession(token);
        if (session.actorType !== 'admin') return c.redirect('/admin/login');
        if (session.mfaEnabled) return c.redirect('/admin');
        c.header('cache-control', 'no-store');
        return c.html(renderAdminMfaSetupPage());
      } catch {
        return c.redirect('/admin/login');
      }
    });

    // Panel de control principal protegido
    router.get('/', async (c) => {
      const cookieHeader = c.req.header('cookie') || '';
      const match = cookieHeader.match(/__Host-admin-session=([^;]+)/);
      const token = match ? match[1] : undefined;

      if (!token) {
        return c.redirect('/admin/login');
      }

      try {
        const session = await identityGateway.validateSession(token);
        if (session.actorType !== 'admin') {
          return c.redirect('/admin/login');
        }
        if (!session.mfaEnabled) return c.redirect('/admin/mfa-setup');
        const can = (permission: string) => hasPermission(session.permissions, permission);

        const [
          products,
          categories,
          brands,
          attributes,
          suppliers,
          variants,
          collections,
          banners,
          announcements,
          cmsPages,
          publishedCmsPages,
          blogPosts,
          promotionRules,
          coupons,
          shippingZones,
          divipolaLocations,
          shippingCarrierConfig,
          settings,
          marketingBrands,
          marketingCollections,
        ] = await Promise.all([
          can('catalog:read') ? catalogGateway.listProducts({ limit: 500 }) : Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listAttributes({ limit: 10, offset: 0 }) : Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listCollections({limit:10,offset:0,includeInactive:true}) : Promise.resolve([]),
          can('storefront:read') ? storefrontGateway.listBanners() : Promise.resolve([]),
          can('storefront:read') ? storefrontGateway.listAnnouncements() : Promise.resolve([]),
          can('cms:read') ? cmsGateway.listPages(50, 0) : Promise.resolve([]),
          can('cms:read') ? cmsGateway.listPages(100, 0, 'published') : Promise.resolve([]),
          can('cms:read') ? cmsGateway.listBlogPosts({page:1,pageSize:100,status:'published',publishedOnly:true}) : Promise.resolve({items:[],total:0}),
          can('promotions:read') ? promotionsGateway.listPromotionRules() : Promise.resolve([]),
          can('promotions:read') ? promotionsGateway.listCoupons() : Promise.resolve([]),
          can('shipping:read') ? shippingGateway.listZones() : Promise.resolve([]),
          Promise.resolve([]),
          can('shipping:read') ? shippingGateway.getCarrierConfig() : Promise.resolve(emptyCarrierConfig()),
          can('settings:read') ? settingsGateway.getSettings() : Promise.resolve(emptySettings()),
          can('catalog:read') ? catalogGateway.listBrands({limit:100,offset:0}) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listCollections({limit:100,offset:0}) : Promise.resolve([]),
        ]);

        const marketingDestinations = [
          ...marketingBrands.filter((item) => item.status !== 'inactive').map((item) => ({value:`brand:${item.slug}`,label:item.name,group:'Marcas'})),
          ...marketingCollections.filter((item) => item.status === 'active').map((item) => ({value:`collection:${item.slug}`,label:item.name,group:'Colecciones'})),
          ...blogPosts.items.map((item) => ({value:`blog:${item.slug}`,label:item.title,group:'Artículos del blog'})),
          ...publishedCmsPages.map((item) => ({value:`cms:${item.slug}`,label:item.title,group:'Páginas CMS'})),
        ];

        const html = renderAdminDashboardPage({
          products,
          categories,
          brands,
          attributes,
          suppliers,
          variants,
          collections,
          banners,
          marketingDestinations,
          announcements,
          cmsPages,
          promotionRules,
          coupons,
          shippingZones,
          divipolaLocations,
          shippingCarrierConfig,
          settings,
          adminEmail: session.actorId || 'Administrador',
          reviewCanRead: can('catalog:read'),
          reviewCanCreate: can('catalog:create'),
          reviewCanEdit: can('catalog:edit'),
          reviewCanDelete: can('catalog:delete'),
        });

        return c.html(html);
      } catch {
        return c.redirect('/admin/login');
      }
    });


    return router;
  }
}

function hasPermission(permissions: string[], required: string): boolean {
  return permissions.some((permission) => permission === '*' || permission === required ||
    permission.endsWith(':*') && required.startsWith(permission.slice(0, -1)));
}

function emptySettings(): StoreSettingsResponse {
  return { id: '', storeName: 'Vega Store', footerCopyrightText: 'Todos los derechos reservados.', currency: 'COP', taxRatePercent: 0, supportEmail: '', requireCodVerification: false, updatedAt: '' };
}

function emptyCarrierConfig() {
  return { enabled: false, originDaneCode: null, packageWidthCm: null, packageLengthCm: null, packageHeightCm: null,
    packageWeightKg: null, declaredValueMode: null, cashOnDeliveryPaymentType: null,
    requestPickup: null, selectionCriterion: null, updatedAt: '' };
}
