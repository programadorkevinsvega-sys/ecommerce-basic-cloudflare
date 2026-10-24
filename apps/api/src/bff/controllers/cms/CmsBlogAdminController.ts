import { Hono } from 'hono';
import { z } from 'zod';
import { CmsGateway } from '../../gateways/cms/CmsGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { SeoGateway } from '../../gateways/seo/SeoGateway.js';
import { bodyLimit } from 'hono/body-limit';
import { MediaGateway } from '../../gateways/media/MediaGateway.js';

const postSchema=z.object({id:z.string().uuid().optional(),title:z.string().trim().min(1).max(180),slug:z.string().trim().min(1).max(180),excerpt:z.string().max(500).default(''),contentHtml:z.string().min(1).max(100000),authorId:z.string().uuid(),featuredImageMediaId:z.string().max(100).optional(),featuredImageAlt:z.string().max(250).optional(),status:z.enum(['draft','scheduled','published','archived']),scheduledAt:z.string().datetime().optional(),seoTitle:z.string().max(80).optional(),seoDescription:z.string().max(200).optional(),canonicalUrl:z.string().url().optional().or(z.literal('')),noindex:z.boolean().optional(),categoryIds:z.array(z.string().uuid()).max(30).default([])});
const taxonomySchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(120),description:z.string().max(1000).optional(),imageMediaId:z.string().max(100).optional(),active:z.boolean().optional()});

export class CmsBlogAdminController {
  public static createRoutes(cms:CmsGateway,identity:IdentityGateway,seo:SeoGateway,media:MediaGateway):Hono{
    const router=new Hono();
    router.get('/api/v1/admin/cms/blog/posts',createAuthMiddleware(identity,'admin','cms:read'),async(c)=>{
      const page=parseInt(c.req.query('page')||'1',10);const pageSize=parseInt(c.req.query('pageSize')||'25',10);const status=c.req.query('status') as 'draft'|'scheduled'|'published'|'archived'|undefined;
      if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>50||status&&!['draft','scheduled','published','archived'].includes(status))return c.json({error:'Parámetros de página inválidos'},400);
      return c.json({data:await cms.listBlogPosts({page,pageSize,status})});
    });
    router.get('/api/v1/admin/cms/blog/posts/:id',createAuthMiddleware(identity,'admin','cms:read'),async(c)=>{const row=await cms.getBlogPostById(c.req.param('id')).catch(()=>null);return row?c.json({data:row}):c.json({error:'Artículo no encontrado'},404);});
    router.post('/api/v1/admin/cms/blog/posts',createAuthMiddleware(identity,'admin','cms:create'),bodyLimit({maxSize:120*1024}),async(c)=>{
      const body=postSchema.safeParse(await c.req.json().catch(()=>null));if(!body.success)return c.json({error:'Revisa los campos del artículo'},400);
      try{await validateBlogImages(body.data,media);return c.json({data:await cms.saveBlogPost(body.data)},201);}catch{return c.json({error:'No fue posible guardar el artículo; verifica slug, imágenes, autor y categorías.'},400);}
    });
    router.put('/api/v1/admin/cms/blog/posts/:id',createAuthMiddleware(identity,'admin','cms:update'),bodyLimit({maxSize:120*1024}),async(c)=>{
      const body=postSchema.omit({id:true}).safeParse(await c.req.json().catch(()=>null));if(!body.success)return c.json({error:'Revisa los campos del artículo'},400);
      try{const id=c.req.param('id');await validateBlogImages(body.data,media);const before=await cms.getBlogPostById(id);const saved=await cms.saveBlogPost({...body.data,id});if(before&&before.slug!==saved.slug){try{await seo.createRedirect({fromPath:`/blog/${before.slug}`,toPath:`/blog/${saved.slug}`,statusCode:301});}catch{console.error(JSON.stringify({event:'cms.blog_slug_redirect_failed',post_id:id}));}}return c.json({data:saved});}catch{return c.json({error:'No fue posible actualizar el artículo'},400);}
    });
    router.delete('/api/v1/admin/cms/blog/posts/:id',createAuthMiddleware(identity,'admin','cms:update'),async(c)=>{try{return await cms.deleteBlogPost(c.req.param('id'))?c.json({ok:true}):c.json({error:'Artículo no encontrado'},404);}catch{return c.json({error:'No fue posible eliminar el artículo'},409);}});
    router.get('/api/v1/admin/cms/blog/authors',createAuthMiddleware(identity,'admin','cms:read'),async(c)=>{const p=queryPage(c);if(!p)return c.json({error:'Paginación inválida'},400);return c.json({data:await cms.listBlogAuthors(p.page,p.size)});});
    router.get('/api/v1/admin/cms/blog/authors/:id',createAuthMiddleware(identity,'admin','cms:read'),async(c)=>{const row=await cms.getBlogAuthor(c.req.param('id'));return row?c.json({data:row}):c.json({error:'Autor no encontrado'},404);});
    router.post('/api/v1/admin/cms/blog/authors',createAuthMiddleware(identity,'admin','cms:create'),bodyLimit({maxSize:16*1024}),async(c)=>saveTaxonomy(cms,'author',await c.req.json().catch(()=>null),media));
    router.put('/api/v1/admin/cms/blog/authors/:id',createAuthMiddleware(identity,'admin','cms:update'),bodyLimit({maxSize:16*1024}),async(c)=>saveTaxonomy(cms,'author',{...(await c.req.json().catch(()=>null)),id:c.req.param('id')},media));
    router.delete('/api/v1/admin/cms/blog/authors/:id',createAuthMiddleware(identity,'admin','cms:update'),async(c)=>{try{const result=await cms.deleteBlogAuthor(c.req.param('id'));if(result==='not_found')return c.json({error:'Autor no encontrado'},404);if(result==='in_use')return c.json({error:'No se puede eliminar: el autor está asignado a uno o más artículos. Reasigna esos artículos primero.'},409);return c.json({ok:true});}catch{return c.json({error:'No fue posible eliminar el autor'},409);}});
    router.get('/api/v1/admin/cms/blog/categories',createAuthMiddleware(identity,'admin','cms:read'),async(c)=>{const p=queryPage(c);if(!p)return c.json({error:'Paginación inválida'},400);return c.json({data:await cms.listBlogCategories(p.page,p.size)});});
    router.get('/api/v1/admin/cms/blog/categories/:id',createAuthMiddleware(identity,'admin','cms:read'),async(c)=>{const row=await cms.getBlogCategory(c.req.param('id'));return row?c.json({data:row}):c.json({error:'Categoría no encontrada'},404);});
    router.post('/api/v1/admin/cms/blog/categories',createAuthMiddleware(identity,'admin','cms:create'),bodyLimit({maxSize:16*1024}),async(c)=>saveTaxonomy(cms,'category',await c.req.json().catch(()=>null),media));
    router.put('/api/v1/admin/cms/blog/categories/:id',createAuthMiddleware(identity,'admin','cms:update'),bodyLimit({maxSize:16*1024}),async(c)=>saveTaxonomy(cms,'category',{...(await c.req.json().catch(()=>null)),id:c.req.param('id')},media));
    router.delete('/api/v1/admin/cms/blog/categories/:id',createAuthMiddleware(identity,'admin','cms:update'),async(c)=>{try{return await cms.deleteBlogCategory(c.req.param('id'))?c.json({ok:true}):c.json({error:'Categoría no encontrada'},404);}catch{return c.json({error:'No fue posible eliminar la categoría'},409);}});
    return router;
  }
}

function queryPage(c:{req:{query:(key:string)=>string|undefined}}):{page:number;size:number}|null{const page=Number(c.req.query('page')||1);const size=Number(c.req.query('pageSize')||25);return Number.isInteger(page)&&page>0&&page<=10000&&Number.isInteger(size)&&size>0&&size<=50?{page,size}:null;}
async function saveTaxonomy(cms:CmsGateway,kind:'author'|'category',input:unknown,media:MediaGateway){const body=taxonomySchema.safeParse(input);if(!body.success)return Response.json({error:'Datos inválidos'}, {status:400});try{if(kind==='author'&&body.data.imageMediaId)await validateImageId(body.data.imageMediaId,media);const data=kind==='author'?await cms.saveBlogAuthor(body.data):await cms.saveBlogCategory(body.data);return Response.json({data},{status:body.data.id?200:201});}catch{return Response.json({error:'No fue posible guardar el registro'}, {status:400});}}

async function validateBlogImages(input:{featuredImageMediaId?:string;contentHtml:string},media:MediaGateway):Promise<void>{const ids=new Set([input.featuredImageMediaId,...[...input.contentHtml.matchAll(/src\s*=\s*["']?\/media\/([0-9a-f-]{36})/gi)].map((match)=>match[1])].filter((id):id is string=>Boolean(id)));if(ids.size>30)throw new Error('Demasiadas imágenes en el artículo.');await Promise.all([...ids].map((id)=>validateImageId(id,media)));}
async function validateImageId(id:string,media:MediaGateway):Promise<void>{const asset=await media.getMedia(id);await asset.stream.cancel();if(!asset.mimeType.startsWith('image/'))throw new Error('La referencia no corresponde a una imagen pública.');}
