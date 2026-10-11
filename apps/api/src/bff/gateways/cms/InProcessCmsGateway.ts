import { CmsGateway, CmsPageDto, CmsMenuDto, CmsBlockDto } from './CmsGateway.js';
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

  public async getMenuByCode(code: string): Promise<CmsMenuDto> {
    const menu = await this.publicApi.getMenuByCode(code);
    return menu.toPrimitives() as CmsMenuDto;
  }

  public async listPages(limit?: number, offset?: number, status?: string): Promise<CmsPageDto[]> {
    const pages = await this.publicApi.listPages(limit, offset, status);
    return pages.map((p) => p.toPrimitives() as CmsPageDto);
  }

  public async deletePage(id: string): Promise<void> {
    await this.publicApi.deletePage(id);
  }
}
