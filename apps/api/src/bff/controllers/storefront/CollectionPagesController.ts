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
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { getPageMarketingContent } from './StorefrontPageMarketing.js';

export class CollectionPagesController {
  public static createRoutes(catalog:CatalogGateway,identity: IdentityGateway, cms: CmsGateway, settings: SettingsGateway,promotions:PromotionsGateway,storefront:StorefrontGateway): Hono {
    const router = new Hono();
    router.get('/colecciones', async (c) => {
      const [customerEmail, nav] = await Promise.all([
        getCustomerEmail(c, identity),
        getStorefrontNavMenus(cms, settings),
      ]);
      const page=Number(c.req.query('page')||1);
      if(!Number.isSafeInteger(page)||page<1||page>1000)return c.redirect('/colecciones',302);
      const [records,marketing]=await Promise.all([catalog.listCollections({limit:13,offset:(page-1)*12}),getPageMarketingContent(storefront,'collections','Colecciones destacadas')]);
      if(records.length===0&&page>1)return c.redirect('/colecciones',302);
      const collections=records.slice(0,12);
      return c.html(renderBaseLayout({
        title: 'Colecciones',
        description: 'Explora las colecciones disponibles de Vega Store.',
        canonicalUrl: `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/colecciones${page > 1 ? `?page=${page}` : ''}`,
        noindex: collections.length === 0,
        bodyHtml: marketing.bannersHtml + (collections.length?renderCollectionDirectoryPage(collections,page,records.length>12):renderCollectionsUnavailablePage()),
        customerEmail,
        headerMenuItems: nav.headerMenuItems,
        footerMenuItems: nav.footerMenuItems,
        footerStoreProfile: nav.footerStoreProfile,
        announcementMessage: marketing.announcementMessage,
        announcementLink: marketing.announcementLink,
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
      const [discounts,marketing]=await Promise.all([resolveProductDiscounts(products,promotions),getPageMarketingContent(storefront,`collection:${collection.slug}`,'Contenido de la colección')]);
      const html=marketing.bannersHtml+renderCollectionDetailPage(collection,products,discounts);
      return c.html(renderBaseLayout({title:`${collection.seoTitle||collection.name} | Colecciones`,description:collection.seoDescription||collection.description,canonicalUrl:`https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/colecciones/${encodeURIComponent(collection.slug)}`,bodyHtml:html+renderProductCardActionsScript,customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile,announcementMessage:marketing.announcementMessage,announcementLink:marketing.announcementLink}));
    });
    return router;
  }
}
