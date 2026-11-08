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
      const siteKey = (c as typeof c & { env?: { TURNSTILE_SITE_KEY?: string } }).env?.TURNSTILE_SITE_KEY;
      c.header('cache-control', 'private, no-store');
      return c.html(renderAdminLoginPage(siteKey));
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
          productTags,
          blogPosts,
          banners,
          announcements,
          cmsPages,
          publishedCmsPages,
          promotionRules,
          coupons,
          shippingZones,
          divipolaLocations,
          shippingCarrierConfig,
          settings,
          marketingCollections,
        ] = await Promise.all([
          can('catalog:read') ? catalogGateway.listAdminProducts({ limit: 25 }) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listCategories({ limit: 25, offset: 0, includeInactive: true }) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listBrands({ limit: 25, offset: 0, includeInactive: true }) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listAttributes({ limit: 25, offset: 0, includeInactive: true }) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listSuppliers({ limit: 25, offset: 0, includeInactive: true }) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listProductVariants({ limit: 25, offset: 0, includeInactive: true }) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listCollections({limit:25,offset:0,includeInactive:true}) : Promise.resolve([]),
          can('catalog:read') ? catalogGateway.listProductTags(true) : Promise.resolve([]),
          can('cms:read') ? cmsGateway.listBlogPosts({page:1,pageSize:25,status:'published',publishedOnly:true}) : Promise.resolve({items:[],total:0}),
          can('storefront:read') ? storefrontGateway.listAdminBanners(25, 0).then((result) => result.items) : Promise.resolve([]),
          can('storefront:read') ? storefrontGateway.listAdminAnnouncements(25, 0).then((result) => result.items) : Promise.resolve([]),
          can('cms:read') ? cmsGateway.listPages(25, 0) : Promise.resolve([]),
          can('cms:read') ? cmsGateway.listPages(25, 0, 'published') : Promise.resolve([]),
          can('promotions:read') ? promotionsGateway.listPromotionRules(false, 25, 0) : Promise.resolve([]),
          can('promotions:read') ? promotionsGateway.listCoupons(false, 25, 0) : Promise.resolve([]),
          can('shipping:read') ? shippingGateway.listZones(false, 25, 0, true) : Promise.resolve([]),
          Promise.resolve([]),
          can('shipping:read') ? shippingGateway.getCarrierConfig() : Promise.resolve(emptyCarrierConfig()),
          can('settings:read') ? settingsGateway.getSettings() : Promise.resolve(emptySettings()),
          can('catalog:read') ? catalogGateway.listCollections({limit:25,offset:0}) : Promise.resolve([]),
        ]);

        const marketingDestinations = [
          ...brands.filter((item) => item.status !== 'inactive').map((item) => ({value:`brand:${item.slug}`,label:item.name,group:'Marcas'})),
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
          productTags,
          blogPosts: blogPosts.items,
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

        c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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
    requestPickup: null, selectionCriterion: null, packageProfiles: [], updatedAt: '' };
}
