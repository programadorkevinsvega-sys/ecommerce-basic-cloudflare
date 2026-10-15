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
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { getPageMarketingContent } from './StorefrontPageMarketing.js';

export class BrandPagesController {
  public static createRoutes(catalog: CatalogGateway, identity: IdentityGateway, cms: CmsGateway, settings: SettingsGateway, promotions: PromotionsGateway, storefront: StorefrontGateway): Hono {
    const router = new Hono();
    router.get('/marcas', async (c) => {
      const page = Number(c.req.query('page') || 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000) return c.redirect('/marcas', 302);
      const [brandRecords, nav, marketing] = await Promise.all([catalog.listBrands({ limit: 13, offset: (page - 1) * 12 }), getStorefrontNavMenus(cms, settings), getPageMarketingContent(storefront, 'brands', 'Marcas destacadas')]);
      if (brandRecords.length === 0 && page > 1) return c.redirect('/marcas', 302);
      const brands = brandRecords.slice(0, 12);
      const customerEmail = await getCustomerEmail(c, identity);
      return c.html(renderBaseLayout({ title: 'Marcas | Vega Store', description: 'Conoce las marcas disponibles y explora sus productos.', canonicalUrl: `https://vega.jnmtortas.com/marcas${page > 1 ? `?page=${page}` : ''}`, bodyHtml: marketing.bannersHtml + renderBrandDirectoryPage(brands, page, brandRecords.length > 12), customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile, announcementItems: marketing.announcementItems }));
    });
    router.get('/marcas/:slug', async (c) => {
      const [brands, nav] = await Promise.all([catalog.listBrands(), getStorefrontNavMenus(cms, settings)]);
      const customerEmail = await getCustomerEmail(c, identity);
      const brand = brands.find((item) => item.slug === c.req.param('slug'));
      if (!brand) return c.html(renderBaseLayout({ title: 'Marca no encontrada', description: 'La marca solicitada no existe.', noindex: true, bodyHtml: renderNotFoundPage(`/marcas/${c.req.param('slug')}`), customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile }), 404);
      const matches = await catalog.listProducts({ limit: 100, status: 'published', searchQuery: brand.name });
      const products = matches.filter((p) => p.status === 'published' && p.brand?.trim().toLocaleLowerCase() === brand.name.trim().toLocaleLowerCase());
      const [discounts, marketing] = await Promise.all([resolveProductDiscounts(products, promotions), getPageMarketingContent(storefront, `brand:${brand.slug}`, 'Contenido de la marca')]);
      return c.html(renderBaseLayout({ title: `${brand.name} | Marcas | Vega Store`, description: brand.description || `Explora los productos de ${brand.name} en Vega Store.`, canonicalUrl: `https://vega.jnmtortas.com/marcas/${encodeURIComponent(brand.slug)}`, bodyHtml: marketing.bannersHtml + renderBrandDetailPage(brand, products, discounts), customerEmail, headerMenuItems: nav.headerMenuItems, footerMenuItems: nav.footerMenuItems, footerStoreProfile: nav.footerStoreProfile, announcementItems: marketing.announcementItems }));
    });
    return router;
  }
}
