import { CmsModuleContainer } from './module.config.js';
import { CreatePageInput } from './application/use-cases/CreatePageUseCase.js';
import { UpdatePageContentInput } from './application/use-cases/UpdatePageContentUseCase.js';
import { Page } from './domain/entities/Page.js';
import { Menu } from './domain/entities/Menu.js';
import { SaveBlogPostInput } from './application/use-cases/SaveBlogPostUseCase.js';
import { BlogPost, BlogPostStatus } from './domain/entities/BlogPost.js';
import { BlogAuthor, BlogCategory, BlogTaxonomyInput } from './domain/entities/BlogAuthor.js';

export interface ICmsPublicApi {
  createPage(input: CreatePageInput): Promise<Page>;
  updatePageContent(input: UpdatePageContentInput): Promise<Page>;
  getPageBySlug(slug: string): Promise<Page>;
  getMenuByCode(code: string): Promise<Menu>;
  listPages(limit?: number, offset?: number, status?: string): Promise<Page[]>;
  deletePage(id: string): Promise<void>;
  saveBlogPost(input: SaveBlogPostInput): Promise<BlogPost>;
  listBlogPosts(input: { page:number; pageSize:number; status?:BlogPostStatus; categorySlug?:string; publishedOnly?:boolean }): Promise<{items:BlogPost[];total:number}>;
  getBlogPostBySlug(slug:string,publishedOnly?:boolean):Promise<BlogPost | null>;
  getBlogPostById(id:string):Promise<BlogPost | null>;
  listRelatedBlogPosts(postId:string,categoryIds:string[],limit?:number):Promise<BlogPost[]>;
  saveBlogAuthor(input:BlogTaxonomyInput):Promise<BlogAuthor>;
  listBlogAuthors(page:number,pageSize:number,activeOnly?:boolean):Promise<{items:BlogAuthor[];total:number}>;
  saveBlogCategory(input:BlogTaxonomyInput):Promise<BlogCategory>;
  listBlogCategories(page:number,pageSize:number,activeOnly?:boolean):Promise<{items:BlogCategory[];total:number}>;
  publishScheduledBlogPosts(now?:string,limit?:number):Promise<string[]>;
}

export class CmsPublicApi implements ICmsPublicApi {
  private readonly container: CmsModuleContainer;

  public constructor(container: CmsModuleContainer) {
    this.container = container;
  }

  public async createPage(input: CreatePageInput): Promise<Page> {
    const res = await this.container.createPageUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updatePageContent(input: UpdatePageContentInput): Promise<Page> {
    const res = await this.container.updatePageContentUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async getPageBySlug(slug: string): Promise<Page> {
    const res = await this.container.getPageBySlugUseCase.execute(slug);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async getMenuByCode(code: string): Promise<Menu> {
    const res = await this.container.getMenuByCodeUseCase.execute(code);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listPages(limit?: number, offset?: number, status?: string): Promise<Page[]> {
    const res = await this.container.listPagesUseCase.execute({ limit, offset, status });
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async deletePage(id: string): Promise<void> {
    const res = await this.container.deletePageUseCase.execute(id);
    if (res.isFail()) throw res.error;
  }

  public async saveBlogPost(input:SaveBlogPostInput):Promise<BlogPost>{return this.container.saveBlogPostUseCase.execute(input);}
  public async listBlogPosts(input:{page:number;pageSize:number;status?:BlogPostStatus;categorySlug?:string;publishedOnly?:boolean}){return this.container.listBlogPostsUseCase.execute(input);}
  public async getBlogPostBySlug(slug:string,publishedOnly=true){return this.container.blogRepository.findPostBySlug(slug,publishedOnly);}
  public async getBlogPostById(id:string){return this.container.blogRepository.findPost(id);}
  public async listRelatedBlogPosts(postId:string,categoryIds:string[],limit=4){return this.container.listBlogPostsUseCase.related(postId,categoryIds,limit);}
  public async saveBlogAuthor(input:BlogTaxonomyInput){return this.container.manageBlogTaxonomyUseCase.saveAuthor(input);}
  public async listBlogAuthors(page:number,pageSize:number,activeOnly=false){return this.container.manageBlogTaxonomyUseCase.listAuthors(page,pageSize,activeOnly);}
  public async saveBlogCategory(input:BlogTaxonomyInput){return this.container.manageBlogTaxonomyUseCase.saveCategory(input);}
  public async listBlogCategories(page:number,pageSize:number,activeOnly=false){return this.container.manageBlogTaxonomyUseCase.listCategories(page,pageSize,activeOnly);}
  public async publishScheduledBlogPosts(now?:string,limit=50){return this.container.publishScheduledBlogPostsUseCase.execute(now,limit);}
}
