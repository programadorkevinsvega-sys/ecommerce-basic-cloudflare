export interface CmsBlockDto {
  id: string;
  type: string;
  content: Record<string, unknown>;
  sortOrder: number;
}

export interface CmsPageDto {
  id: string;
  title: string;
  slug: string;
  status: string;
  currentVersion: number;
  blocks: CmsBlockDto[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsMenuItemDto {
  id: string;
  menuId: string;
  parentId?: string;
  title: string;
  url: string;
  sortOrder: number;
  target: string;
  children?: CmsMenuItemDto[];
}

export interface CmsMenuDto {
  id: string;
  code: string;
  title: string;
  items: CmsMenuItemDto[];
}

export interface BlogPostDto { id:string; title:string; slug:string; excerpt:string; contentHtml:string; authorId:string; authorName:string; authorBio:string; authorImageMediaId?:string; featuredImageMediaId?:string; featuredImageAlt:string; status:'draft'|'scheduled'|'published'|'archived'; scheduledAt?:string; publishedAt?:string; seoTitle:string; seoDescription:string; canonicalUrl?:string; noindex:boolean; categoryIds:string[]; categoryNames:string[]; createdAt:string; updatedAt:string; }
export interface BlogAuthorDto { id:string; name:string; bio:string; imageMediaId?:string; active:boolean; createdAt:string; updatedAt:string; }
export interface BlogCategoryDto { id:string; name:string; slug:string; description:string; active:boolean; createdAt:string; updatedAt:string; }
export interface BlogPageDto<T> { items:T[]; total:number; }

export interface CmsGateway {
  createPage(input: {
    title: string;
    slug: string;
    status?: 'draft' | 'published' | 'archived';
    blocks?: CmsBlockDto[];
    seoTitle?: string;
    seoDescription?: string;
    adminId?: string;
  }): Promise<CmsPageDto>;
  updatePageContent(input: {
    id: string;
    title: string;
    slug?: string;
    status?: 'draft' | 'published' | 'archived';
    blocks?: CmsBlockDto[];
    seoTitle?: string;
    seoDescription?: string;
    adminId?: string;
  }): Promise<CmsPageDto>;
  getPageBySlug(slug: string): Promise<CmsPageDto>;
  getMenuByCode(code: string): Promise<CmsMenuDto>;
  listPages(limit?: number, offset?: number, status?: string): Promise<CmsPageDto[]>;
  deletePage(id: string): Promise<void>;
  saveBlogPost(input: Partial<BlogPostDto> & Pick<BlogPostDto,'title'|'slug'|'excerpt'|'contentHtml'|'authorId'|'status'|'categoryIds'>): Promise<BlogPostDto>;
  listBlogPosts(input:{page:number;pageSize:number;status?:BlogPostDto['status'];categorySlug?:string;publishedOnly?:boolean}):Promise<BlogPageDto<BlogPostDto>>;
  getBlogPostBySlug(slug:string,publishedOnly?:boolean):Promise<BlogPostDto|null>;
  getBlogPostById(id:string):Promise<BlogPostDto|null>;
  listRelatedBlogPosts(postId:string,categoryIds:string[],limit?:number):Promise<BlogPostDto[]>;
  saveBlogAuthor(input:{id?:string;name:string;description?:string;imageMediaId?:string;active?:boolean}):Promise<BlogAuthorDto>;
  listBlogAuthors(page:number,pageSize:number,activeOnly?:boolean):Promise<BlogPageDto<BlogAuthorDto>>;
  saveBlogCategory(input:{id?:string;name:string;description?:string;active?:boolean}):Promise<BlogCategoryDto>;
  listBlogCategories(page:number,pageSize:number,activeOnly?:boolean):Promise<BlogPageDto<BlogCategoryDto>>;
  publishScheduledBlogPosts(now?:string,limit?:number):Promise<string[]>;
}
