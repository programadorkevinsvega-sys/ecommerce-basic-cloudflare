import { Hono } from 'hono';
import { z } from 'zod';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';

const inputSchema = z.object({ name:z.string().trim().min(1).max(120),slug:z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(2000),imageMediaId:z.string().uuid().nullable().optional(),productIds:z.array(z.string().uuid()).max(100),status:z.enum(['active','inactive']),seoTitle:z.string().max(70).optional(),seoDescription:z.string().max(160).optional() }).strict();

export class CollectionAdminController {
  public static createRoutes(catalog:CatalogGateway,identity:IdentityGateway,audit:AuditGateway):Hono {
    const router = new Hono();
    router.get('/admin/collection-products',createAuthMiddleware(identity,'admin','catalog:read'),async(c)=>{
      const ids=(c.req.query('ids')||'').split(',').filter(Boolean);
      const query=c.req.query('q')?.trim()||'';
      if(ids.length>100||ids.some((id)=>!z.string().uuid().safeParse(id).success)||query.length>120)return c.json({error:'Búsqueda inválida'},400);
      try {
        const searchQuery=query.split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ');
        const rows=ids.length
          ? await Promise.all(ids.map((id)=>catalog.getProductById(id).catch(()=>null)))
          : await catalog.listProducts({limit:30,offset:0,status:'published',searchQuery:searchQuery||undefined});
        const data=rows.filter((row):row is CatalogProductDto=>row !== null && row.status==='published').map(({id,name,sku})=>({id,name,sku}));
        return c.json({data});
      } catch { return c.json({error:'No fue posible buscar productos'},400); }
    });
    router.get('/admin/collections',createAuthMiddleware(identity,'admin','catalog:read'),async(c)=>{
      const page=Number(c.req.query('page')||1);
      if(!Number.isSafeInteger(page)||page<1||page>1000000)return c.json({error:'Página inválida'},400);
      const rows=await catalog.listCollections({limit:11,offset:(page-1)*10,includeInactive:true});
      return c.json({success:true,page,pageSize:10,hasMore:rows.length>10,data:rows.slice(0,10)});
    });
    router.post('/admin/collections',createAuthMiddleware(identity,'admin','catalog:create'),async(c)=>{
      const parsed=inputSchema.safeParse(await c.req.json().catch(()=>null));
      if(!parsed.success)return c.json({error:'Validación fallida'},400);
      try { const item=await catalog.saveCollection(parsed.data); await audit.record({actorId:(c as any).get('actorId'),actorType:'admin',action:'catalog.collection.created',entityType:'catalog_collection',entityId:item.id,changes:{status:item.status,productCount:item.productIds.length}}); return c.json({data:item},201); }
      catch(error){return c.json({error:error instanceof Error?error.message:'No fue posible guardar la colección'},409);}
    });
    router.put('/admin/collections/:id',createAuthMiddleware(identity,'admin','catalog:edit'),async(c)=>{
      const parsed=inputSchema.partial().safeParse(await c.req.json().catch(()=>null));
      if(!parsed.success||!Object.keys(parsed.data||{}).length)return c.json({error:'Validación fallida'},400);
      try { const existing=await catalog.getCollectionById(c.req.param('id')); const item=await catalog.saveCollection({...existing,...parsed.data},existing.id); await audit.record({actorId:(c as any).get('actorId'),actorType:'admin',action:'catalog.collection.updated',entityType:'catalog_collection',entityId:item.id,changes:{fields:Object.keys(parsed.data)}}); return c.json({data:item}); }
      catch(error){return c.json({error:error instanceof Error?error.message:'No fue posible actualizar'},409);}
    });
    router.delete('/admin/collections/:id',createAuthMiddleware(identity,'admin','catalog:delete'),async(c)=>{
      try { await catalog.deleteCollection(c.req.param('id')); await audit.record({actorId:(c as any).get('actorId'),actorType:'admin',action:'catalog.collection.deleted',entityType:'catalog_collection',entityId:c.req.param('id')}); return c.json({success:true}); }
      catch(error){return c.json({error:error instanceof Error?error.message:'No fue posible eliminar'},404);}
    });
    return router;
  }
}
