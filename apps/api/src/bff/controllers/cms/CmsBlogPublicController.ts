import { Context, Hono } from 'hono';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { renderBaseLayout } from '../../views/renderBaseLayout.js';
import { renderBlogIndexPage } from '../../views/renderBlogIndexPage.js';
import { blogPostingJsonLd, renderBlogArticlePage } from '../../views/renderBlogArticlePage.js';
import { getCustomerEmail, getStorefrontNavMenus } from '../storefront/StorefrontNavigationHelper.js';
import { renderNotFoundPage } from '../../views/renderNotFoundPage.js';
import { StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { getPageMarketingContent } from '../storefront/StorefrontPageMarketing.js';

export class CmsBlogPublicController {
  public static createRoutes(cms:CmsGateway,identity:IdentityGateway,settings:SettingsGateway,storefront:StorefrontGateway):Hono{
    const router=new Hono();
    router.get('/sitemap-blog.xml',async(c)=>{
      const urls:string[]=[];let page=1;let total=0;
      do{const result=await cms.listBlogPosts({page,pageSize:50,publishedOnly:true});total=result.total;for(const post of result.items)if(!post.noindex){const loc=post.canonicalUrl||new URL(`/blog/${encodeURIComponent(post.slug)}`,c.req.url).toString();urls.push(`<url><loc>${xmlEscape(loc)}</loc><lastmod>${(post.updatedAt||post.publishedAt||'').slice(0,10)}</lastmod></url>`);}page++;}while((page-1)*50<total&&page<=1000);
      return c.text(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'});
    });
    router.get('/blog',async(c)=>{
      const page=Number(c.req.query('page')||1);const pageSize=9;const categorySlug=c.req.query('categoria');
      if(!Number.isInteger(page)||page<1||page>10000)return notFound(c,cms,identity,settings);
      const [categoryPage,listed,customerEmail,nav,marketing]=await Promise.all([
        cms.listBlogCategories(1,100,true),
        cms.listBlogPosts({page,pageSize,publishedOnly:true,categorySlug}),
        getCustomerEmail(c,identity),getStorefrontNavMenus(cms,settings),
        getPageMarketingContent(storefront,'blog','Artículos del blog'),
      ]);
      if(categorySlug&&!categoryPage.items.some((item)=>item.slug===categorySlug))return notFound(c,cms,identity,settings);
      const html=renderBlogIndexPage(listed.items,categoryPage.items,page,listed.total,pageSize,categorySlug);
      const url=new URL(c.req.url);url.pathname='/blog';
      const canonical=`${url.origin}/blog${page>1?`?page=${page}`:''}${categorySlug?`${page>1?'&':'?'}categoria=${encodeURIComponent(categorySlug)}`:''}`;
      return c.html(renderBaseLayout({title:categorySlug?`${categoryPage.items.find((item)=>item.slug===categorySlug)?.name} | Blog`: 'Blog | Vega Store',description:'Consejos, novedades e inspiración de Vega Store.',canonicalUrl:canonical,bodyHtml:marketing.bannersHtml+html,customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile,announcementMessage:marketing.announcementMessage,announcementLink:marketing.announcementLink}));
    });
    router.get('/blog/:slug',async(c)=>{
      const [post,customerEmail,nav]=await Promise.all([cms.getBlogPostBySlug(c.req.param('slug'),true),getCustomerEmail(c,identity),getStorefrontNavMenus(cms,settings)]);
      if(!post)return c.html(renderBaseLayout({title:'Artículo no encontrado | Vega Store',description:'El artículo solicitado no está disponible.',noindex:true,bodyHtml:renderNotFoundPage(c.req.path),customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile}),404);
      const [related,marketing]=await Promise.all([cms.listRelatedBlogPosts(post.id,post.categoryIds,4),getPageMarketingContent(storefront,`blog:${post.slug}`,'Artículo destacado')]);
      const url=new URL(c.req.url);const canonical=post.canonicalUrl||`${url.origin}/blog/${encodeURIComponent(post.slug)}`;
      const image=post.featuredImageMediaId?`${url.origin}/media/${encodeURIComponent(post.featuredImageMediaId)}`:undefined;
      const html=renderBlogArticlePage(post,related);
      return c.html(renderBaseLayout({title:`${post.seoTitle||post.title} | Blog`,description:post.seoDescription||post.excerpt,canonicalUrl:canonical,ogImageUrl:image,ogType:'article',jsonLd:post.noindex?undefined:blogPostingJsonLd(post,canonical,image),noindex:post.noindex,bodyHtml:marketing.bannersHtml+html,customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile,announcementMessage:marketing.announcementMessage,announcementLink:marketing.announcementLink}));
    });
    return router;
  }
}

async function notFound(c:Context,cms:CmsGateway,identity:IdentityGateway,settings:SettingsGateway){const [customerEmail,nav]=await Promise.all([getCustomerEmail(c,identity),getStorefrontNavMenus(cms,settings)]);return c.html(renderBaseLayout({title:'Página no encontrada | Vega Store',description:'No encontramos esta sección del blog.',noindex:true,bodyHtml:renderNotFoundPage(c.req.path),customerEmail,headerMenuItems:nav.headerMenuItems,footerMenuItems:nav.footerMenuItems,footerStoreProfile:nav.footerStoreProfile}),404);}
function xmlEscape(value:string):string{return value.replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]||char));}
