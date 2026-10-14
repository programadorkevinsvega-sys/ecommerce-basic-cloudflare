import { Hono } from 'hono';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCollectionsUnavailablePage } from '../../views/renderCollectionsUnavailablePage.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';

export class CollectionPagesController {
  public static createRoutes(identity: IdentityGateway, cms: CmsGateway, settings: SettingsGateway): Hono {
    const router = new Hono();
    router.get('/colecciones', async (c) => {
      const [customerEmail, nav] = await Promise.all([
        getCustomerEmail(c, identity),
        getStorefrontNavMenus(cms, settings),
      ]);
      return c.html(renderBaseLayout({
        title: 'Colecciones | Vega Store',
        description: 'Explora las colecciones disponibles de Vega Store.',
        canonicalUrl: 'https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/colecciones',
        noindex: true,
        bodyHtml: renderCollectionsUnavailablePage(),
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      }));
    });
    return router;
  }
}
