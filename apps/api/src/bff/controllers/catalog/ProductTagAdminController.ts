import { Hono } from 'hono';
import { z } from 'zod';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

const tagSchema = z.object({name:z.string().trim().min(2).max(60),description:z.string().trim().max(240).default(''),status:z.enum(['active','inactive']).default('active')}).strict();

export class ProductTagAdminController {
  public static createRoutes(catalog:CatalogGateway,identity:IdentityGateway,audit:AuditGateway):Hono {
    const router=new Hono();
    router.get('/admin/product-tags',createAuthMiddleware(identity,'admin','catalog:read'),async(c)=>{
      const page=Number(c.req.query('page')||1);if(!Number.isSafeInteger(page)||page<1||page>1000000)return c.json({error:'Página inválida'},400);
      try {const all=await catalog.listProductTags(true);const start=(page-1)*10;return c.json({success:true,page,pageSize:10,hasMore:start+10<all.length,data:all.slice(start,start+10)});}
      catch{return c.json({error:'No fue posible cargar las etiquetas'},500);}
    });
    router.post('/admin/product-tags',createAuthMiddleware(identity,'admin','catalog:create'),async(c)=>{
      const parsed=tagSchema.safeParse(await c.req.json().catch(()=>null));
      if(!parsed.success)return c.json({error:'Revisa el nombre, la descripción y el estado.'},400);
      try {const tag=await catalog.saveProductTag(parsed.data);await audit.record({actorId:(c as any).get('actorId'),actorType:'admin',action:'catalog.product_tag.created',entityType:'catalog_tag',entityId:tag.id,changes:{status:tag.status,productCount:tag.productCount}});return c.json({data:tag},201);}
      catch(error){return c.json({error:error instanceof Error?error.message:'No fue posible guardar la etiqueta'},409);}
    });
    router.put('/admin/product-tags/:id',createAuthMiddleware(identity,'admin','catalog:edit'),async(c)=>{
      const parsed=tagSchema.safeParse(await c.req.json().catch(()=>null));
      if(!parsed.success)return c.json({error:'Revisa el nombre, la descripción y el estado.'},400);
      try {const tag=await catalog.saveProductTag({...parsed.data,id:c.req.param('id')});await audit.record({actorId:(c as any).get('actorId'),actorType:'admin',action:'catalog.product_tag.updated',entityType:'catalog_tag',entityId:tag.id,changes:{status:tag.status,productCount:tag.productCount}});return c.json({data:tag});}
      catch(error){return c.json({error:error instanceof Error?error.message:'No fue posible actualizar la etiqueta'},409);}
    });
    router.delete('/admin/product-tags/:id',createAuthMiddleware(identity,'admin','catalog:delete'),async(c)=>{
      try {await catalog.deleteProductTag(c.req.param('id'));await audit.record({actorId:(c as any).get('actorId'),actorType:'admin',action:'catalog.product_tag.deleted',entityType:'catalog_tag',entityId:c.req.param('id')});return c.json({success:true});}
      catch(error){return c.json({error:error instanceof Error?error.message:'No fue posible eliminar la etiqueta'},404);}
    });
    return router;
  }
}
