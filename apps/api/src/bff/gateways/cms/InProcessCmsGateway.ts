import { CmsGateway, CmsPageDto, CmsMenuDto, CmsBlockDto, BlogPostDto, BlogAuthorDto, BlogCategoryDto } from './CmsGateway.js';
import { ICmsPublicApi } from '../../../modules/cms/module.public-api.js';

export class InProcessCmsGateway implements CmsGateway {
  private readonly publicApi: ICmsPublicApi;

  public constructor(publicApi: ICmsPublicApi) {
    this.publicApi = publicApi;
  }

  public async createPage(input: {
    title: string;
    slug: string;
    status?: 'draft' | 'published' | 'archived';
    blocks?: CmsBlockDto[];
    seoTitle?: string;
    seoDescription?: string;
    adminId?: string;
  }): Promise<CmsPageDto> {
    const page = await this.publicApi.createPage({
      ...input,
      blocks: (input.blocks || []) as any,
    });
    return page.toPrimitives() as CmsPageDto;
  }

  public async updatePageContent(input: {
    id: string;
    title: string;
    slug?: string;
    status?: 'draft' | 'published' | 'archived';
    blocks?: CmsBlockDto[];
    seoTitle?: string;
    seoDescription?: string;
    adminId?: string;
  }): Promise<CmsPageDto> {
    const page = await this.publicApi.updatePageContent({
      ...input,
      blocks: input.blocks ? (input.blocks as any) : undefined,
    });
    return page.toPrimitives() as CmsPageDto;
  }

  public async getPageBySlug(slug: string): Promise<CmsPageDto> {
    const page = await this.publicApi.getPageBySlug(slug);
    return page.toPrimitives() as CmsPageDto;
  }

  public async getPageById(id: string): Promise<CmsPageDto | null> {
    const page = await this.publicApi.getPageById(id);
    return page?.toPrimitives() ?? null;
  }

  public async getMenuByCode(code: string): Promise<CmsMenuDto> {
    const menu = await this.publicApi.getMenuByCode(code);
    return menu.toPrimitives() as CmsMenuDto;
  }

  public async saveMenu(input: Parameters<CmsGateway['saveMenu']>[0]): Promise<CmsMenuDto> {
    const menu = await this.publicApi.saveMenu(input as any);
    return menu.toPrimitives() as CmsMenuDto;
  }

  public async listPages(limit?: number, offset?: number, status?: string): Promise<CmsPageDto[]> {
    const pages = await this.publicApi.listPages(limit, offset, status);
    return pages.map((p) => p.toPrimitives() as CmsPageDto);
  }
  public countPages(status?: string): Promise<number> { return this.publicApi.countPages(status); }

  public async deletePage(id: string): Promise<void> {
    await this.publicApi.deletePage(id);
  }

  public async saveBlogPost(input:Parameters<CmsGateway['saveBlogPost']>[0]):Promise<BlogPostDto>{return (await this.publicApi.saveBlogPost(input as any)).toPrimitives() as BlogPostDto;}
  public async listBlogPosts(input:Parameters<CmsGateway['listBlogPosts']>[0]){const page=await this.publicApi.listBlogPosts(input);return {total:page.total,items:page.items.map((post)=>post.toPrimitives() as BlogPostDto)};}
  public async getBlogPostBySlug(slug:string,publishedOnly=true){const post=await this.publicApi.getBlogPostBySlug(slug,publishedOnly);return post?.toPrimitives() as BlogPostDto|null;}
  public async getBlogPostById(id:string){const post=await this.publicApi.getBlogPostById(id);return post?.toPrimitives() as BlogPostDto|null;}
  public async deleteBlogPost(id:string){return this.publicApi.deleteBlogPost(id);}
  public async listRelatedBlogPosts(postId:string,categoryIds:string[],limit=4){return (await this.publicApi.listRelatedBlogPosts(postId,categoryIds,limit)).map((post)=>post.toPrimitives() as BlogPostDto);}
  public async saveBlogAuthor(input:Parameters<CmsGateway['saveBlogAuthor']>[0]){return await this.publicApi.saveBlogAuthor(input) as BlogAuthorDto;}
  public async getBlogAuthor(id:string){return await this.publicApi.getBlogAuthor(id) as BlogAuthorDto|null;}
  public async deleteBlogAuthor(id:string){return this.publicApi.deleteBlogAuthor(id);}
  public async listBlogAuthors(page:number,pageSize:number,activeOnly=false){return await this.publicApi.listBlogAuthors(page,pageSize,activeOnly) as {items:BlogAuthorDto[];total:number};}
  public async saveBlogCategory(input:Parameters<CmsGateway['saveBlogCategory']>[0]){return await this.publicApi.saveBlogCategory(input) as BlogCategoryDto;}
  public async getBlogCategory(id:string){return await this.publicApi.getBlogCategory(id) as BlogCategoryDto|null;}
  public async deleteBlogCategory(id:string){return this.publicApi.deleteBlogCategory(id);}
  public async listBlogCategories(page:number,pageSize:number,activeOnly=false){return await this.publicApi.listBlogCategories(page,pageSize,activeOnly) as {items:BlogCategoryDto[];total:number};}
  public async publishScheduledBlogPosts(now?:string,limit=50){return this.publicApi.publishScheduledBlogPosts(now,limit);}
}
