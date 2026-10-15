import { Hono } from 'hono';
import { z } from 'zod';
import { CatalogGateway } from '../../gateways/catalog/CatalogGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { ReviewsGateway, ReviewStatus } from '../../gateways/reviews/ReviewsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

const statusSchema=z.object({status:z.enum(['approved','rejected'])}).strict();
const editSchema=z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().min(10).max(2000)}).strict();
const createSchema=z.object({productId:z.string().uuid(),rating:z.number().int().min(1).max(5),comment:z.string().trim().min(10).max(2000),status:z.enum(['pending','approved','rejected']).default('approved')}).strict();
const statuses=new Set<ReviewStatus>(['pending','approved','rejected']);

export class ReviewsAdminController {
  public static createRoutes(reviews:ReviewsGateway,catalog:CatalogGateway,identity:IdentityGateway,orders:OrdersGateway):Hono {
    const router=new Hono();
    router.get('/admin/reviews',createAuthMiddleware(identity,'admin','catalog:read'),async(c)=>{
      const page=Number(c.req.query('page')||1),pageSize=Number(c.req.query('pageSize')||10);
      const status=c.req.query('status')||undefined,query=(c.req.query('q')||'').trim();
      if(!Number.isSafeInteger(page)||page<1||page>1_000_000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>50||status&&!statuses.has(status as ReviewStatus)||query.length>120)
        return c.json({error:'Filtros o paginación inválidos'},400);
      const result=await reviews.listForAdmin({page,pageSize,status:status as ReviewStatus|undefined,query:query||undefined});
      const items=await Promise.all(result.items.map(async(review)=>{
        const paymentMethod=review.source==='verified'?await orders.getDeliveredProductPaymentMethod(review.customerId,review.productId).catch(()=>null):null;
        try{const product=await catalog.getProductById(review.productId);return {...withoutCustomer(review),productName:product.name,sku:product.sku,paymentMethod};}
        catch{return {...withoutCustomer(review),productName:'Producto no disponible',sku:'—',paymentMethod};}
      }));
      return c.json({data:{items,total:result.total,page,pageSize}});
    });
    router.post('/admin/reviews',createAuthMiddleware(identity,'admin','catalog:create'),async(c)=>{
      const length=Number(c.req.header('content-length')||0);if(length>8192)return c.json({error:'La solicitud supera el tamaño permitido'},413);
      let body:unknown;try{body=await c.req.json();}catch{return c.json({error:'Datos inválidos'},400);}
      const parsed=createSchema.safeParse(body);if(!parsed.success)return c.json({error:'Verifica el producto, la puntuación y el comentario'},400);
      try{const product=await catalog.getProductById(parsed.data.productId);if(product.status!=='published')return c.json({error:'Solo puedes asignar reseñas a productos publicados'},400);const review=await reviews.createManual({...parsed.data,productId:product.id});return c.json({success:true,id:review.id},201);}
      catch(error){return c.json({error:error instanceof Error?error.message:'No se pudo crear la reseña'},400);}
    });
    router.patch('/admin/reviews/:id/status',createAuthMiddleware(identity,'admin','catalog:edit'),async(c)=>{
      const length=Number(c.req.header('content-length')||0);if(length>1024)return c.json({error:'Solicitud demasiado grande'},413);
      let body:unknown;try{body=await c.req.json();}catch{return c.json({error:'Datos inválidos'},400);}
      const parsed=statusSchema.safeParse(body);if(!parsed.success)return c.json({error:'Estado de reseña inválido'},400);
      const result=await reviews.moderate(c.req.param('id'),parsed.data.status);
      return result?c.json({success:true}):c.json({error:'Reseña no encontrada'},404);
    });
    router.patch('/admin/reviews/:id',createAuthMiddleware(identity,'admin','catalog:edit'),async(c)=>{
      const length=Number(c.req.header('content-length')||0);if(length>8192)return c.json({error:'La solicitud supera el tamaño permitido'},413);
      let body:unknown;try{body=await c.req.json();}catch{return c.json({error:'Datos inválidos'},400);}
      const parsed=editSchema.safeParse(body);if(!parsed.success)return c.json({error:'La puntuación debe estar entre 1 y 5 y el comentario debe tener entre 10 y 2.000 caracteres'},400);
      try{const result=await reviews.edit(c.req.param('id'),parsed.data.rating,parsed.data.comment);return result?c.json({success:true}):c.json({error:'Reseña no encontrada'},404);}
      catch(error){return c.json({error:error instanceof Error?error.message:'No se pudo editar la reseña'},400);}
    });
    router.delete('/admin/reviews/:id',createAuthMiddleware(identity,'admin','catalog:delete'),async(c)=>{
      const deleted=await reviews.delete(c.req.param('id'));
      return deleted?c.json({success:true}):c.json({error:'Reseña no encontrada'},404);
    });
    return router;
  }
}

function withoutCustomer(review:{id:string;productId:string;rating:number;comment:string;status:ReviewStatus;source:'verified'|'demo'|'manual';createdAt:string;updatedAt:string}){const {id,productId,rating,comment,status,source,createdAt,updatedAt}=review;return {id,productId,rating,comment,status,source,createdAt,updatedAt};}
