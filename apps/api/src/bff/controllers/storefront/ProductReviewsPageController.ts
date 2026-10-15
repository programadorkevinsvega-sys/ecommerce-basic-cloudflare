import { Hono } from 'hono';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ReviewsGateway } from '../../gateways/reviews/ReviewsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { renderProductReviewsPage } from '../../views/renderProductReviewsPage.js';
import { getCustomerActorId, getCustomerEmail, getStorefrontNavMenus } from './StorefrontNavigationHelper.js';

export class ProductReviewsPageController {
  public static createRoutes(catalog:CatalogGateway,identity:IdentityGateway,reviews:ReviewsGateway,cms:CmsGateway,settings:SettingsGateway):Hono {
    const router=new Hono();
    router.get('/productos/:slug/opiniones',async(c)=>{
      const slug=c.req.param('slug');const page=Number(c.req.query('page')||1);
      const [customerId,customerEmail,nav]=await Promise.all([getCustomerActorId(c,identity),getCustomerEmail(c,identity),getStorefrontNavMenus(cms,settings)]);
      if(!Number.isSafeInteger(page)||page<1||page>10000)return c.redirect(`/productos/${encodeURIComponent(slug)}/opiniones`,302);
      try{
        const product=await catalog.getProductBySlug(slug);if(product.status!=='published')throw new Error('not found');
        const [result,eligibility]=await Promise.all([
          reviews.list(product.id,page,10).catch(()=>emptyReviewPage()),
          customerId?reviews.checkEligibility(product.id,customerId).catch(()=>({canReview:false,alreadyReviewed:false})):Promise.resolve({canReview:false,alreadyReviewed:false}),
        ]);
        const bodyHtml=renderProductReviewsPage({product,...result,page,pageSize:10,...eligibility});
        const url=new URL(c.req.url);
        const html=renderBaseLayout({title:`Opiniones de ${product.name} | Vega Store`,description:`Valoraciones y experiencias de clientes sobre ${product.name}.`,canonicalUrl:`${url.origin}/productos/${encodeURIComponent(product.slug)}/opiniones`,noindex:Boolean(customerId),bodyHtml,customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile});
        return c.html(html,200,{'Cache-Control':'private, no-store'});
      }catch{
        const html=renderBaseLayout({title:'Producto no encontrado | Vega Store',description:'No encontramos este producto.',noindex:true,bodyHtml:renderNotFoundPage(c.req.path),customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile});
        return c.html(html,404,{'Cache-Control':'private, no-store'});
      }
    });
    return router;
  }
}

function emptyReviewPage(){return {items:[],total:0,summary:{average:0,count:0,distribution:{1:0,2:0,3:0,4:0,5:0}}};}
