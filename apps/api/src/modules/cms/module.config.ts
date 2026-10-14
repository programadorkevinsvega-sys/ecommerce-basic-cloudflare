import { Env } from '../../platform/Env.js';
import { D1PageRepository } from './infrastructure/persistence/d1/repositories/D1PageRepository.js';
import { D1MenuRepository } from './infrastructure/persistence/d1/repositories/D1MenuRepository.js';
import { CreatePageUseCase } from './application/use-cases/CreatePageUseCase.js';
import { UpdatePageContentUseCase } from './application/use-cases/UpdatePageContentUseCase.js';
import { GetPageBySlugUseCase } from './application/use-cases/GetPageBySlugUseCase.js';
import { GetMenuByCodeUseCase } from './application/use-cases/GetMenuByCodeUseCase.js';
import { ListPagesUseCase } from './application/use-cases/ListPagesUseCase.js';
import { DeletePageUseCase } from './application/use-cases/DeletePageUseCase.js';
import { D1BlogPostRepository } from './infrastructure/persistence/d1/repositories/D1BlogPostRepository.js';
import { SaveBlogPostUseCase } from './application/use-cases/SaveBlogPostUseCase.js';
import { ManageBlogTaxonomyUseCase } from './application/use-cases/ManageBlogTaxonomyUseCase.js';
import { ListBlogPostsUseCase } from './application/use-cases/ListBlogPostsUseCase.js';
import { PublishScheduledBlogPostsUseCase } from './application/use-cases/PublishScheduledBlogPostsUseCase.js';

export interface CmsModuleContainer {
  createPageUseCase: CreatePageUseCase;
  updatePageContentUseCase: UpdatePageContentUseCase;
  getPageBySlugUseCase: GetPageBySlugUseCase;
  getMenuByCodeUseCase: GetMenuByCodeUseCase;
  listPagesUseCase: ListPagesUseCase;
  deletePageUseCase: DeletePageUseCase;
  blogRepository: D1BlogPostRepository;
  saveBlogPostUseCase: SaveBlogPostUseCase;
  manageBlogTaxonomyUseCase: ManageBlogTaxonomyUseCase;
  listBlogPostsUseCase: ListBlogPostsUseCase;
  publishScheduledBlogPostsUseCase: PublishScheduledBlogPostsUseCase;
}

export function createCmsModule(env: Env): CmsModuleContainer {
  const pageRepo = new D1PageRepository(env.DB);
  const menuRepo = new D1MenuRepository(env.DB);
  const blogRepository = new D1BlogPostRepository(env.DB);

  return {
    createPageUseCase: new CreatePageUseCase(pageRepo),
    updatePageContentUseCase: new UpdatePageContentUseCase(pageRepo),
    getPageBySlugUseCase: new GetPageBySlugUseCase(pageRepo),
    getMenuByCodeUseCase: new GetMenuByCodeUseCase(menuRepo),
    listPagesUseCase: new ListPagesUseCase(pageRepo),
    deletePageUseCase: new DeletePageUseCase(pageRepo),
    blogRepository,
    saveBlogPostUseCase: new SaveBlogPostUseCase(blogRepository),
    manageBlogTaxonomyUseCase: new ManageBlogTaxonomyUseCase(blogRepository),
    listBlogPostsUseCase: new ListBlogPostsUseCase(blogRepository),
    publishScheduledBlogPostsUseCase: new PublishScheduledBlogPostsUseCase(blogRepository),
  };
}
