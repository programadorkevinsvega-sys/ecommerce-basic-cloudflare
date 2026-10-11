import { CmsModuleContainer } from './module.config.js';
import { CreatePageInput } from './application/use-cases/CreatePageUseCase.js';
import { UpdatePageContentInput } from './application/use-cases/UpdatePageContentUseCase.js';
import { Page } from './domain/entities/Page.js';
import { Menu } from './domain/entities/Menu.js';

export interface ICmsPublicApi {
  createPage(input: CreatePageInput): Promise<Page>;
  updatePageContent(input: UpdatePageContentInput): Promise<Page>;
  getPageBySlug(slug: string): Promise<Page>;
  getMenuByCode(code: string): Promise<Menu>;
  listPages(limit?: number, offset?: number, status?: string): Promise<Page[]>;
  deletePage(id: string): Promise<void>;
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
}
