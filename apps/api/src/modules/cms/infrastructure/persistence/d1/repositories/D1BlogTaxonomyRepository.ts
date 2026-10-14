import { BlogAuthor, BlogCategory, BlogTaxonomyInput } from '../../../../domain/entities/BlogAuthor.js';
import { validateAndFormatSlug } from '../../../../domain/validateCmsSlug.js';

interface AuthorRow {id:string;name:string;bio:string;image_media_id:string|null;active:number;created_at:string;updated_at:string;}
interface CategoryRow {id:string;name:string;slug:string;description:string;active:number;created_at:string;updated_at:string;}

export class D1BlogTaxonomyRepository {
  public constructor(private readonly db:D1Database){}
  public async findAuthor(id:string):Promise<BlogAuthor|null>{const row=await this.db.prepare('SELECT * FROM cms_blog_authors WHERE id=?').bind(id).first<AuthorRow>();return row?this.author(row):null;}
  public async deleteAuthor(id:string):Promise<'deleted'|'in_use'|'not_found'>{
    const row=await this.db.prepare('SELECT id FROM cms_blog_authors WHERE id=?').bind(id).first<{id:string}>();if(!row)return 'not_found';
    const usage=await this.db.prepare('SELECT COUNT(*) AS total FROM cms_blog_posts WHERE author_id=?').bind(id).first<{total:number}>();if((usage?.total||0)>0)return 'in_use';
    await this.db.prepare('DELETE FROM cms_blog_authors WHERE id=?').bind(id).run();return 'deleted';
  }
  public async findCategory(id:string):Promise<BlogCategory|null>{const row=await this.db.prepare('SELECT * FROM cms_blog_categories WHERE id=?').bind(id).first<CategoryRow>();return row?this.category(row):null;}
  public async deleteCategory(id:string):Promise<boolean>{
    const row=await this.db.prepare('SELECT id FROM cms_blog_categories WHERE id=?').bind(id).first<{id:string}>();if(!row)return false;
    await this.db.batch([this.db.prepare('DELETE FROM cms_blog_post_categories WHERE category_id=?').bind(id),this.db.prepare('DELETE FROM cms_blog_categories WHERE id=?').bind(id)]);return true;
  }
  public async saveAuthor(input:BlogTaxonomyInput):Promise<BlogAuthor>{
    const now=new Date().toISOString(); const id=input.id||crypto.randomUUID();
    await this.db.prepare(`INSERT INTO cms_blog_authors(id,name,bio,image_media_id,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,bio=excluded.bio,image_media_id=excluded.image_media_id,active=excluded.active,updated_at=excluded.updated_at`).bind(id,input.name.trim(),(input.description||'').trim().slice(0,1000),input.imageMediaId||null,input.active===false?0:1,now,now).run();
    const row=await this.db.prepare('SELECT * FROM cms_blog_authors WHERE id=?').bind(id).first<AuthorRow>(); if(!row) throw new Error('No fue posible guardar el autor.'); return this.author(row);
  }
  public async listAuthors(page:number,pageSize:number,activeOnly=false):Promise<{items:BlogAuthor[];total:number}>{
    const where=activeOnly?' WHERE active=1':''; const total=await this.db.prepare(`SELECT COUNT(*) AS total FROM cms_blog_authors${where}`).first<{total:number}>();
    const rows=await this.db.prepare(`SELECT * FROM cms_blog_authors${where} ORDER BY name LIMIT ? OFFSET ?`).bind(pageSize,(page-1)*pageSize).all<AuthorRow>();
    return {items:(rows.results||[]).map((row)=>this.author(row)),total:total?.total||0};
  }
  public async saveCategory(input:BlogTaxonomyInput):Promise<BlogCategory>{
    const now=new Date().toISOString(); const id=input.id||crypto.randomUUID(); const slug=validateAndFormatSlug(input.name);
    await this.db.prepare(`INSERT INTO cms_blog_categories(id,name,slug,description,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,description=excluded.description,active=excluded.active,updated_at=excluded.updated_at`).bind(id,input.name.trim(),slug,(input.description||'').trim().slice(0,1000),input.active===false?0:1,now,now).run();
    const row=await this.db.prepare('SELECT * FROM cms_blog_categories WHERE id=?').bind(id).first<CategoryRow>(); if(!row) throw new Error('No fue posible guardar la categoría.'); return this.category(row);
  }
  public async listCategories(page:number,pageSize:number,activeOnly=false):Promise<{items:BlogCategory[];total:number}>{
    const where=activeOnly?' WHERE active=1':''; const total=await this.db.prepare(`SELECT COUNT(*) AS total FROM cms_blog_categories${where}`).first<{total:number}>();
    const rows=await this.db.prepare(`SELECT * FROM cms_blog_categories${where} ORDER BY name LIMIT ? OFFSET ?`).bind(pageSize,(page-1)*pageSize).all<CategoryRow>();
    return {items:(rows.results||[]).map((row)=>this.category(row)),total:total?.total||0};
  }
  public async publishScheduled(now:string,limit:number):Promise<string[]>{
    const rows=await this.db.prepare("SELECT id FROM cms_blog_posts WHERE status='scheduled' AND scheduled_at<=? ORDER BY scheduled_at LIMIT ?").bind(now,limit).all<{id:string}>();
    const ids=(rows.results||[]).map((row)=>row.id); if(!ids.length)return [];
    const statements=ids.map((id)=>this.db.prepare("UPDATE cms_blog_posts SET status='published',published_at=scheduled_at,updated_at=? WHERE id=? AND status='scheduled' AND scheduled_at<=?").bind(now,id,now));
    const results=await this.db.batch(statements);return ids.filter((_,index)=>(results[index]?.meta.changes||0)>0);
  }
  private author(row:AuthorRow):BlogAuthor{return {id:row.id,name:row.name,bio:row.bio,imageMediaId:row.image_media_id||undefined,active:row.active===1,createdAt:row.created_at,updatedAt:row.updated_at};}
  private category(row:CategoryRow):BlogCategory{return {id:row.id,name:row.name,slug:row.slug,description:row.description,active:row.active===1,createdAt:row.created_at,updatedAt:row.updated_at};}
}
