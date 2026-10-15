import { ProductReview, ProductReviewStatus } from '../../../../domain/entities/ProductReview.js';
import { IProductReviewRepository, ProductReviewAdminPage, ProductReviewPage, ProductReviewSummary, ProductReviewSummaryRow } from '../../../../domain/ports/IProductReviewRepository.js';

interface ReviewRow { id:string; product_id:string; customer_id:string; rating:number; comment:string; status:ProductReviewStatus; source:'verified'|'demo'; origin:'customer'|'admin'; created_at:string; updated_at:string; }
export class D1ProductReviewRepository implements IProductReviewRepository {
  public constructor(private readonly db:D1Database){}
  public async summaries(productIds:string[]):Promise<ProductReviewSummaryRow[]>{
    const ids=[...new Set(productIds)].slice(0,50);if(!ids.length)return [];
    const placeholders=ids.map(()=>'?').join(',');
    const result=await this.db.prepare(`SELECT product_id,SUM(CASE WHEN source='verified' THEN 1 ELSE 0 END) AS verified_count,AVG(CASE WHEN source='verified' THEN rating END) AS verified_average,SUM(CASE WHEN source!='verified' THEN 1 ELSE 0 END) AS demo_count,AVG(CASE WHEN source!='verified' THEN rating END) AS demo_average FROM reviews_product_reviews WHERE status='approved' AND product_id IN (${placeholders}) GROUP BY product_id`).bind(...ids).all<{product_id:string;verified_count:number;verified_average:number|null;demo_count:number;demo_average:number|null}>();
    return (result.results||[]).map((row)=>({productId:row.product_id,average:Math.round((row.verified_count?row.verified_average||0:row.demo_average||0)*10)/10,count:row.verified_count||row.demo_count,isDemo:row.verified_count===0}));
  }
  public async list(productId:string,page:number,pageSize:number,status?:ProductReviewStatus):Promise<ProductReviewPage>{
    const filter=status?' AND status=?':'';const params:unknown[]=status?[productId,status]:[productId];
    const [count,verifiedCount,avg,dist,demoCount,demoAvg,demoDist,rows]=await Promise.all([
      this.db.prepare(`SELECT COUNT(*) AS total FROM reviews_product_reviews WHERE product_id=?${filter}`).bind(...params).first<{total:number}>(),
      this.db.prepare(`SELECT COUNT(*) AS total FROM reviews_product_reviews WHERE product_id=?${filter} AND source='verified'`).bind(...params).first<{total:number}>(),
      this.db.prepare(`SELECT AVG(rating) AS average FROM reviews_product_reviews WHERE product_id=?${filter} AND source='verified'`).bind(...params).first<{average:number|null}>(),
      this.db.prepare(`SELECT rating,COUNT(*) AS total FROM reviews_product_reviews WHERE product_id=?${filter} AND source='verified' GROUP BY rating`).bind(...params).all<{rating:number;total:number}>(),
      this.db.prepare(`SELECT COUNT(*) AS total FROM reviews_product_reviews WHERE product_id=?${filter} AND source!='verified'`).bind(...params).first<{total:number}>(),
      this.db.prepare(`SELECT AVG(rating) AS average FROM reviews_product_reviews WHERE product_id=?${filter} AND source!='verified'`).bind(...params).first<{average:number|null}>(),
      this.db.prepare(`SELECT rating,COUNT(*) AS total FROM reviews_product_reviews WHERE product_id=?${filter} AND source!='verified' GROUP BY rating`).bind(...params).all<{rating:number;total:number}>(),
      this.db.prepare(`SELECT * FROM reviews_product_reviews WHERE product_id=?${filter} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).bind(...params,pageSize,(page-1)*pageSize).all<ReviewRow>(),
    ]);
    const isDemo=(verifiedCount?.total||0)===0&&(demoCount?.total||0)>0;const distribution:Record<number,number>={1:0,2:0,3:0,4:0,5:0};
    for(const row of (isDemo?demoDist.results:dist.results)||[])distribution[row.rating]=row.total;
    const summary:ProductReviewSummary={average:Math.round(((isDemo?demoAvg?.average:avg?.average)||0)*10)/10,count:isDemo?demoCount?.total||0:verifiedCount?.total||0,distribution,isDemo};
    return {items:(rows.results||[]).map((row)=>this.map(row)),total:count?.total||0,summary};
  }
  public async listForAdmin(page:number,pageSize:number,status?:ProductReviewStatus,query?:string):Promise<ProductReviewAdminPage>{
    const clauses:string[]=[];const params:unknown[]=[];
    if(status){clauses.push('status=?');params.push(status);}
    if(query){clauses.push('(id LIKE ? OR product_id LIKE ? OR comment LIKE ?)');const pattern=`%${query}%`;params.push(pattern,pattern,pattern);}
    const where=clauses.length?` WHERE ${clauses.join(' AND ')}`:'';
    const [count,rows]=await Promise.all([
      this.db.prepare(`SELECT COUNT(*) AS total FROM reviews_product_reviews${where}`).bind(...params).first<{total:number}>(),
      this.db.prepare(`SELECT * FROM reviews_product_reviews${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).bind(...params,pageSize,(page-1)*pageSize).all<ReviewRow>(),
    ]);
    return {items:(rows.results||[]).map((row)=>this.map(row)),total:count?.total||0};
  }
  public async findById(id:string):Promise<ProductReview|null>{const row=await this.db.prepare('SELECT * FROM reviews_product_reviews WHERE id=?').bind(id).first<ReviewRow>();return row?this.map(row):null;}
  public async create(input:{productId:string;customerId:string;rating:number;comment:string}):Promise<ProductReview>{
    const id=crypto.randomUUID(),now=new Date().toISOString();
    await this.db.prepare("INSERT INTO reviews_product_reviews(id,product_id,customer_id,rating,comment,status,source,created_at,updated_at) VALUES(?,?,?,?,?,'approved','verified',?,?)").bind(id,input.productId,input.customerId,input.rating,input.comment,now,now).run();
    const row=await this.db.prepare('SELECT * FROM reviews_product_reviews WHERE id=?').bind(id).first<ReviewRow>();if(!row)throw new Error('No se pudo recuperar la opinión guardada.');return this.map(row);
  }
  public async createManual(input:{productId:string;rating:number;comment:string;status:ProductReviewStatus}):Promise<ProductReview>{
    const id=crypto.randomUUID(),now=new Date().toISOString(),customerId=`manual:${id}`;
    await this.db.prepare('INSERT INTO reviews_product_reviews(id,product_id,customer_id,rating,comment,status,source,origin,created_at,updated_at) VALUES(?,?,?,?,?,?,\'demo\',\'admin\',?,?)').bind(id,input.productId,customerId,input.rating,input.comment,input.status,now,now).run();
    const row=await this.db.prepare('SELECT * FROM reviews_product_reviews WHERE id=?').bind(id).first<ReviewRow>();if(!row)throw new Error('No se pudo recuperar la reseña creada.');return this.map(row);
  }
  public async hasCustomerReviewed(productId:string,customerId:string):Promise<boolean>{return Boolean(await this.db.prepare('SELECT id FROM reviews_product_reviews WHERE product_id=? AND customer_id=?').bind(productId,customerId).first<{id:string}>());}
  public async moderate(id:string,status:ProductReviewStatus):Promise<ProductReview|null>{await this.db.prepare('UPDATE reviews_product_reviews SET status=?,updated_at=? WHERE id=?').bind(status,new Date().toISOString(),id).run();const row=await this.db.prepare('SELECT * FROM reviews_product_reviews WHERE id=?').bind(id).first<ReviewRow>();return row?this.map(row):null;}
  public async edit(id:string,rating:number,comment:string):Promise<ProductReview|null>{await this.db.prepare('UPDATE reviews_product_reviews SET rating=?,comment=?,updated_at=? WHERE id=?').bind(rating,comment,new Date().toISOString(),id).run();const row=await this.db.prepare('SELECT * FROM reviews_product_reviews WHERE id=?').bind(id).first<ReviewRow>();return row?this.map(row):null;}
  public async delete(id:string):Promise<boolean>{const result=await this.db.prepare('DELETE FROM reviews_product_reviews WHERE id=?').bind(id).run();return (result.meta.changes||0)>0;}
  private map(row:ReviewRow):ProductReview{return {id:row.id,productId:row.product_id,customerId:row.customer_id,rating:row.rating,comment:row.comment,status:row.status,source:row.origin==='admin'?'manual':row.source,createdAt:row.created_at,updatedAt:row.updated_at};}
}
