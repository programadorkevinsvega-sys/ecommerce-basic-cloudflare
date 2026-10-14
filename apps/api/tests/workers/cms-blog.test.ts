import { beforeAll, describe, expect, it } from 'vitest';
import { env, exports } from 'cloudflare:workers';
import { D1BlogPostRepository } from '../../src/modules/cms/infrastructure/persistence/d1/repositories/D1BlogPostRepository.js';
import { SaveBlogPostUseCase } from '../../src/modules/cms/application/use-cases/SaveBlogPostUseCase.js';

describe('CMS blog persistence and public SSR',()=>{
  beforeAll(async()=>{for(const migration of env.TEST_MIGRATIONS)for(const statement of migration.sql.replace(/--[^\n]*/g,'').split(';'))if(statement.trim())await env.DB.prepare(statement).run();});

  it('saves article, author and categories; sanitizes content and serves public SEO pages',async()=>{
    const repository=new D1BlogPostRepository(env.DB);
    const author=await repository.saveAuthor({name:'Autora de prueba',description:'Perfil editorial',active:true});
    const category=await repository.saveCategory({name:'Guías de prueba',description:'Contenido útil',active:true});
    const post=await new SaveBlogPostUseCase(repository).execute({title:'Artículo de prueba',slug:`articulo-${crypto.randomUUID().slice(0,8)}`,excerpt:'Resumen editorial',contentHtml:'<h2>Contenido</h2><script>alert(1)</script><p onclick="alert(2)">Texto seguro</p>',authorId:author.id,status:'published',categoryIds:[category.id],seoTitle:'Título SEO del artículo',seoDescription:'Meta descripción del artículo'});
    expect(post.toPrimitives().contentHtml).not.toContain('<script');
    expect(post.toPrimitives().contentHtml).not.toContain('onclick');
    expect((await repository.listPosts({page:1,pageSize:10,publishedOnly:true,categorySlug:category.slug})).items.map((row)=>row.id)).toContain(post.id);
    const page=await exports.default.fetch('https://shop.test/blog');expect(page.status).toBe(200);expect(await page.text()).toContain('Artículo de prueba');
    const detail=await exports.default.fetch(`https://shop.test/blog/${post.slug}`);const html=await detail.text();
    expect(detail.status).toBe(200);expect(html).toContain('application/ld+json');expect(html).toContain('rel="canonical"');expect(html).toContain('Contenido');
    const sitemap=await exports.default.fetch('https://shop.test/sitemap-blog.xml');expect(sitemap.status).toBe(200);expect(await sitemap.text()).toContain(`/blog/${post.slug}`);
  },15000);

  it('publishes due scheduled articles idempotently and keeps future drafts out of public listings',async()=>{
    const repository=new D1BlogPostRepository(env.DB);const author=await repository.saveAuthor({name:'Autor cron'});
    const scheduledAt='2030-01-01T12:00:00.000Z';const scheduled=await new SaveBlogPostUseCase(repository).execute({title:'Artículo programado',slug:`programado-${crypto.randomUUID().slice(0,8)}`,excerpt:'',contentHtml:'<p>Programado</p>',authorId:author.id,status:'scheduled',scheduledAt,categoryIds:[]});
    expect((await repository.listPosts({page:1,pageSize:10,publishedOnly:true})).items.some((item)=>item.id===scheduled.id)).toBe(false);
    const worker=exports.default as unknown as {scheduled(controller:ScheduledController,environment:typeof env,context:ExecutionContext):Promise<void>};
    const runCron=async()=>{const tasks:Promise<unknown>[]=[];await worker.scheduled({cron:'*/5 * * * *',scheduledTime:Date.parse('2030-01-02T13:00:00.000Z'),noRetry(){}},env,{waitUntil:(task:Promise<unknown>)=>tasks.push(task)} as unknown as ExecutionContext);await Promise.all(tasks);};
    await runCron();await runCron();
    expect((await repository.findPost(scheduled.id))?.status).toBe('published');
    const audit=await env.DB.prepare("SELECT id FROM audit_logs WHERE entity_id=? AND action='cms.blog_post.published_by_schedule'").bind(scheduled.id).all();
    expect(audit.results).toHaveLength(1);
  });

  it('deletes blog content without leaving taxonomy links or orphaned authors',async()=>{
    const repository=new D1BlogPostRepository(env.DB);
    const author=await repository.saveAuthor({name:'Autor eliminable '+crypto.randomUUID().slice(0,6)});
    const category=await repository.saveCategory({name:'Categoría eliminable '+crypto.randomUUID().slice(0,6)});
    const post=await new SaveBlogPostUseCase(repository).execute({title:'Artículo eliminable',slug:`eliminable-${crypto.randomUUID().slice(0,8)}`,excerpt:'',contentHtml:'<p>Temporal</p>',authorId:author.id,status:'draft',categoryIds:[category.id]});
    expect(await repository.deleteAuthor(author.id)).toBe('in_use');
    expect(await repository.deleteCategory(category.id)).toBe(true);
    expect((await repository.findPost(post.id))?.toPrimitives().categoryIds).toEqual([]);
    expect(await repository.deletePost(post.id)).toBe(true);
    expect(await repository.deletePost(post.id)).toBe(false);
    expect(await repository.deleteAuthor(author.id)).toBe('deleted');
  });
});
