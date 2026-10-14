import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderBrandDirectoryPage } from '../../views/renderBrandDirectoryPage.js';
import { renderBrandDetailPage } from '../../views/renderBrandDetailPage.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';
import { resolveProductDiscounts } from './StorefrontDiscountResolver.js';

export class BrandPagesController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway, cms: CmsGateway, settings: SettingsGateway, promotions: PromotionsGateway): Hono {
    const router = new Hono();
    router.get('/marcas', async (c) => {
      const [brands, nav] = await Promise.all([catalog.listBrands(), getStorefrontNavMenus(cms, settings)]);
      const customerEmail = await getCustomerEmail(c, identity);
      return c.html(renderBaseLayout({ title: 'Marcas | Vega Store', description: 'Conoce las marcas disponibles y explora sus productos.', canonicalUrl: 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/marcas', bodyHtml: renderBrandDirectoryPage(brands), customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile }));
    });
    router.get('/marcas/:slug', async (c) => {
      const [brands, nav] = await Promise.all([catalog.listBrands(), getStorefrontNavMenus(cms, settings)]);
      const customerEmail = await getCustomerEmail(c, identity);
      const brand = brands.find((item) => item.slug === c.req.param('slug'));
      if (!brand) return c.html(renderBaseLayout({ title: 'Marca no encontrada', description: 'La marca solicitada no existe.', noindex: true, bodyHtml: renderNotFoundPage(`/marcas/${c.req.param('slug')}`), customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile }), 404);
      const matches = await catalog.listProducts({ limit: 100, status: 'published', searchQuery: brand.name });
      const products = matches.filter((p) => p.status === 'published' && p.brand?.trim().toLocaleLowerCase() === brand.name.trim().toLocaleLowerCase());
      const discounts = await resolveProductDiscounts(products, promotions);
      return c.html(renderBaseLayout({ title: `${brand.name} | Marcas | Vega Store`, description: brand.description || `Explora los productos de ${brand.name} en Vega Store.`, canonicalUrl: `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/marcas/${encodeURIComponent(brand.slug)}`, bodyHtml: renderBrandDetailPage(brand, products, discounts), customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile }));
    });
    return router;
  }
}
