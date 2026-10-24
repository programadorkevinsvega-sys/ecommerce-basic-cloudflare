import { BlogPost, BlogPostStatus } from '../../../../domain/entities/BlogPost.js';
import { BlogPage, IBlogRepository } from '../../../../domain/ports/IBlogRepository.js';
import { BlogAuthor, BlogCategory, BlogTaxonomyInput } from '../../../../domain/entities/BlogAuthor.js';
import { D1BlogTaxonomyRepository } from './D1BlogTaxonomyRepository.js';

interface PostRow { id:string; title:string; slug:string; excerpt:string; content_html:string; author_id:string; featured_image_media_id:string|null; featured_image_alt:string; status:BlogPostStatus; scheduled_at:string|null; published_at:string|null; seo_title:string; seo_description:string; canonical_url:string|null; noindex:number; created_at:string; updated_at:string; }

export class D1BlogPostRepository implements IBlogRepository {
  private readonly taxonomies: D1BlogTaxonomyRepository;
  public constructor(private readonly db: D1Database) { this.taxonomies = new D1BlogTaxonomyRepository(db); }

  public async savePost(post: BlogPost): Promise<void> {
    const p = post.toPrimitives();
    const statements = [this.db.prepare(`INSERT INTO cms_blog_posts (id,title,slug,excerpt,content_html,author_id,featured_image_media_id,featured_image_alt,status,scheduled_at,published_at,seo_title,seo_description,canonical_url,noindex,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content_html=excluded.content_html,author_id=excluded.author_id,featured_image_media_id=excluded.featured_image_media_id,featured_image_alt=excluded.featured_image_alt,status=excluded.status,scheduled_at=excluded.scheduled_at,published_at=excluded.published_at,seo_title=excluded.seo_title,seo_description=excluded.seo_description,canonical_url=excluded.canonical_url,noindex=excluded.noindex,updated_at=excluded.updated_at`).bind(p.id,p.title,p.slug,p.excerpt,p.contentHtml,p.authorId,p.featuredImageMediaId ?? null,p.featuredImageAlt,p.status,p.scheduledAt ?? null,p.publishedAt ?? null,p.seoTitle,p.seoDescription,p.canonicalUrl ?? null,p.noindex ? 1 : 0,p.createdAt,p.updatedAt), this.db.prepare('DELETE FROM cms_blog_post_categories WHERE post_id=?').bind(p.id)];
    for (const categoryId of p.categoryIds) statements.push(this.db.prepare('INSERT INTO cms_blog_post_categories (post_id,category_id) VALUES (?,?)').bind(p.id,categoryId));
    await this.db.batch(statements);
  }

  public async findPost(id: string): Promise<BlogPost | null> { const row = await this.db.prepare('SELECT * FROM cms_blog_posts WHERE id=?').bind(id).first<PostRow>(); return row ? this.hydrate(row) : null; }
  public async deletePost(id:string):Promise<boolean>{
    const post=await this.db.prepare('SELECT id FROM cms_blog_posts WHERE id=?').bind(id).first<{id:string}>();
    if(!post)return false;
    await this.db.batch([this.db.prepare('DELETE FROM cms_blog_post_categories WHERE post_id=?').bind(id),this.db.prepare('DELETE FROM cms_blog_posts WHERE id=?').bind(id)]);
    return true;
  }
  public async findPostBySlug(slug: string, publishedOnly = false): Promise<BlogPost | null> {
    const row = await this.db.prepare(`SELECT * FROM cms_blog_posts WHERE slug=?${publishedOnly ? " AND status='published'" : ''}`).bind(slug).first<PostRow>();
    if (!row || publishedOnly && row.status !== 'published') return null;
    return this.hydrate(row);
  }

  public async listPosts(input: { page:number; pageSize:number; status?:BlogPostStatus; categorySlug?:string; publishedOnly?:boolean }): Promise<BlogPage> {
    const { where, params } = this.filters(input);
    const count = await this.db.prepare(`SELECT COUNT(*) AS total FROM cms_blog_posts p ${where}`).bind(...params).first<{total:number}>();
    const offset = (input.page - 1) * input.pageSize;
    const rows = await this.db.prepare(`SELECT DISTINCT p.* FROM cms_blog_posts p ${where} ORDER BY COALESCE(p.published_at,p.created_at) DESC,p.id DESC LIMIT ? OFFSET ?`).bind(...params,input.pageSize,offset).all<PostRow>();
    return { items: await Promise.all((rows.results || []).map((row) => this.hydrate(row))), total: count?.total ?? 0 };
  }

  public async listRelated(postId:string, categoryIds:string[], limit:number): Promise<BlogPost[]> {
    if (!categoryIds.length) return [];
    const marks = categoryIds.map(() => '?').join(',');
    const result = await this.db.prepare(`SELECT DISTINCT p.* FROM cms_blog_posts p JOIN cms_blog_post_categories pc ON pc.post_id=p.id WHERE p.status='published' AND p.noindex=0 AND p.id<>? AND pc.category_id IN (${marks}) ORDER BY p.published_at DESC LIMIT ?`).bind(postId,...categoryIds,limit).all<PostRow>();
    return Promise.all((result.results || []).map((row) => this.hydrate(row)));
  }

  public saveAuthor(input:BlogTaxonomyInput):Promise<BlogAuthor>{return this.taxonomies.saveAuthor(input);}
  public findAuthor(id:string):Promise<BlogAuthor|null>{return this.taxonomies.findAuthor(id);}
  public deleteAuthor(id:string):Promise<'deleted'|'in_use'|'not_found'>{return this.taxonomies.deleteAuthor(id);}
  public listAuthors(page:number,pageSize:number,activeOnly=false):Promise<{items:BlogAuthor[];total:number}>{return this.taxonomies.listAuthors(page,pageSize,activeOnly);}
  public saveCategory(input:BlogTaxonomyInput):Promise<BlogCategory>{return this.taxonomies.saveCategory(input);}
  public findCategory(id:string):Promise<BlogCategory|null>{return this.taxonomies.findCategory(id);}
  public deleteCategory(id:string):Promise<boolean>{return this.taxonomies.deleteCategory(id);}
  public listCategories(page:number,pageSize:number,activeOnly=false):Promise<{items:BlogCategory[];total:number}>{return this.taxonomies.listCategories(page,pageSize,activeOnly);}
  public publishScheduled(now:string,limit:number):Promise<string[]>{return this.taxonomies.publishScheduled(now,limit);}

  private filters(input:{status?:BlogPostStatus;categorySlug?:string;publishedOnly?:boolean}):{where:string;params:unknown[]} {
    const clauses:string[]=[]; const params:unknown[]=[];
    if(input.publishedOnly) clauses.push("p.status='published' AND p.noindex=0");
    else if(input.status){clauses.push('p.status=?');params.push(input.status);}
    if(input.categorySlug){clauses.push('EXISTS (SELECT 1 FROM cms_blog_post_categories pc JOIN cms_blog_categories bc ON bc.id=pc.category_id WHERE pc.post_id=p.id AND bc.slug=? AND bc.active=1)');params.push(input.categorySlug);}
    return {where:clauses.length?`WHERE ${clauses.join(' AND ')}`:'',params};
  }

  private async hydrate(row:PostRow):Promise<BlogPost>{
    const [author, categoryRows] = await Promise.all([
      this.db.prepare('SELECT name,bio,image_media_id FROM cms_blog_authors WHERE id=?').bind(row.author_id).first<{name:string;bio:string;image_media_id:string|null}>(),
      this.db.prepare('SELECT c.id,c.name FROM cms_blog_categories c JOIN cms_blog_post_categories pc ON pc.category_id=c.id WHERE pc.post_id=? AND c.active=1 ORDER BY c.name').bind(row.id).all<{id:string;name:string}>(),
    ]);
    const categories=categoryRows.results||[];
    return new BlogPost({id:row.id,title:row.title,slug:row.slug,excerpt:row.excerpt,contentHtml:row.content_html,authorId:row.author_id,authorName:author?.name||'',authorBio:author?.bio||'',authorImageMediaId:author?.image_media_id||undefined,featuredImageMediaId:row.featured_image_media_id||undefined,featuredImageAlt:row.featured_image_alt,status:row.status,scheduledAt:row.scheduled_at||undefined,publishedAt:row.published_at||undefined,seoTitle:row.seo_title,seoDescription:row.seo_description,canonicalUrl:row.canonical_url||undefined,noindex:row.noindex===1,categoryIds:categories.map((item)=>item.id),categoryNames:categories.map((item)=>item.name),createdAt:row.created_at,updatedAt:row.updated_at});
  }
}
