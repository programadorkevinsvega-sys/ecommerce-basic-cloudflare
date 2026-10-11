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
}
