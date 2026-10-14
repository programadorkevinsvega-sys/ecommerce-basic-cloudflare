import { Hono } from 'hono';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderCollectionsUnavailablePage } from '../../views/renderCollectionsUnavailablePage.js';
import { getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';
import { renderCollectionDirectoryPage } from '../../views/renderCollectionDirectoryPage.js';
import { renderCollectionDetailPage } from '../../views/renderCollectionDetailPage.js';
import { renderProductCardActionsScript } from '../../views/renderProductCardActionsScript.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { resolveProductDiscounts } from './StorefrontDiscountResolver.js';

export class CollectionPagesController {
  public static createRoutes(catalog:CatalogGateway,identity: IdentityGateway, cms: CmsGateway, settings: SettingsGateway,promotions:PromotionsGateway): Hono {
    const router = new Hono();
    router.get('/colecciones', async (c) => {
      const [customerEmail, nav] = await Promise.all([
        getCustomerEmail(c, identity),
        getStorefrontNavMenus(cms, settings),
      ]);
      const page=Number(c.req.query('page')||1);
      if(!Number.isSafeInteger(page)||page<1||page>1000000)return c.redirect('/colecciones',302);
      const records=await catalog.listCollections({limit:13,offset:(page-1)*12});
      const collections=records.slice(0,12);
      return c.html(renderBaseLayout({
        title: 'Colecciones | Vega Store',
        description: 'Explora las colecciones disponibles de Vega Store.',
        canonicalUrl: `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/colecciones${page > 1 ? `?page=${page}` : ''}`,
        noindex: collections.length === 0,
        bodyHtml: collections.length?renderCollectionDirectoryPage(collections,page,records.length>12):renderCollectionsUnavailablePage(),
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
      }));
    });
    router.get('/colecciones/:slug',async(c)=>{
      const [customerEmail,nav]=await Promise.all([getCustomerEmail(c,identity),getStorefrontNavMenus(cms,settings)]);
      const collection=await catalog.findCollectionBySlug(c.req.param('slug'));
      if (!collection) {
        return c.html(renderBaseLayout({title:'Colección no encontrada | Vega Store',description:'No encontramos la colección solicitada.',noindex:true,bodyHtml:renderNotFoundPage(c.req.path),customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile}),404);
      }
      const resolved=await Promise.all(collection.productIds.map((id)=>catalog.getProductById(id).catch(()=>null)));
      const products=resolved.filter((item):item is NonNullable<typeof item>=>item?.status==='published');
      const discounts=await resolveProductDiscounts(products,promotions);
      const html=renderCollectionDetailPage(collection,products,discounts);
      return c.html(renderBaseLayout({title:`${collection.seoTitle||collection.name} | Colecciones | Vega Store`,description:collection.seoDescription||collection.description,canonicalUrl:`https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/colecciones/${encodeURIComponent(collection.slug)}`,bodyHtml:html+renderProductCardActionsScript,customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile}));
    });
    return router;
  }
}
