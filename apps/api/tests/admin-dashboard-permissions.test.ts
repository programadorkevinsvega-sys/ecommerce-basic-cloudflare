import { describe, expect, it, vi } from 'vitest';
import { AdminUiController } from '../src/bff/controllers/admin/AdminUiController.js';
import { IdentityGateway } from '../src/bff/gateways/identity/IdentityGateway.js';
import { CatalogGateway } from '../src/bff/gateways/catalog/CatalogGateway.js';
import { SettingsGateway } from '../src/bff/gateways/settings/SettingsGateway.js';
import { StorefrontGateway } from '../src/bff/gateways/storefront/StorefrontGateway.js';
import { CmsGateway } from '../src/bff/gateways/cms/CmsGateway.js';
import { PromotionsGateway } from '../src/bff/gateways/promotions/PromotionsGateway.js';
import { ShippingGateway } from '../src/bff/gateways/shipping/ShippingGateway.js';

describe('admin dashboard permissions', () => {
  it('does not fetch settings, promotion, or shipping data for an editor role', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'editor-1', actorType: 'admin', mfaEnabled: true, permissions: ['catalog:*', 'storefront:*', 'cms:*'] }) } as unknown as IdentityGateway;
    const catalog = {
      listProducts: vi.fn().mockResolvedValue([]), listCategories: vi.fn().mockResolvedValue([]),
      listBrands: vi.fn().mockResolvedValue([]), listAttributes: vi.fn().mockResolvedValue([]),
      listCollections: vi.fn().mockResolvedValue([]), listSuppliers: vi.fn().mockResolvedValue([]),
      listProductVariants: vi.fn().mockResolvedValue([]), listProductTags: vi.fn().mockResolvedValue([]),
    } as unknown as CatalogGateway;
    const storefront = {
      listAdminBanners: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      listAdminAnnouncements: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as StorefrontGateway;
    const cms = { listPages: vi.fn().mockResolvedValue([]), listBlogPosts: vi.fn().mockResolvedValue({ items: [], total: 0 }) } as unknown as CmsGateway;
    const promotions = { listPromotionRules: vi.fn(), listCoupons: vi.fn() } as unknown as PromotionsGateway;
    const shipping = { listZones: vi.fn(), listLocations: vi.fn() } as unknown as ShippingGateway;
    const settings = { getSettings: vi.fn().mockResolvedValue({ id: 's', storeName: 'Tienda', currency: 'COP', taxRatePercent: 19, supportEmail: 's@example.com', companyNit: 'NIT-PRIVATE-SENTINEL', requireCodVerification: false, updatedAt: 'now' }) } as unknown as SettingsGateway;

    const response = await AdminUiController.createRoutes(identity, catalog, settings, storefront, cms, promotions, shipping)
      .request('/', { headers: { cookie: '__Host-admin-session=session' } });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(catalog.listProducts).toHaveBeenCalledOnce();
    expect(storefront.listAdminBanners).toHaveBeenCalledOnce();
    expect(settings.getSettings).not.toHaveBeenCalled();
    expect(promotions.listCoupons).not.toHaveBeenCalled();
    expect(shipping.listZones).not.toHaveBeenCalled();
    expect(html).not.toContain('NIT-PRIVATE-SENTINEL');
  });

  it('routes an authenticated administrator without MFA to the enrollment-only page', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({ actorId: 'admin-1', actorType: 'admin', permissions: [], mfaEnabled: false }) } as unknown as IdentityGateway;
    const response = await AdminUiController.createRoutes(identity, {} as CatalogGateway, {} as SettingsGateway, {} as StorefrontGateway, {} as CmsGateway, {} as PromotionsGateway, {} as ShippingGateway)
      .request('/', { headers: { cookie: '__Host-admin-session=pending' } });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/admin/mfa-setup');
  });
});
