import { Env } from '../../platform/Env.js';
import { D1PageRepository } from './infrastructure/persistence/d1/repositories/D1PageRepository.js';
import { D1MenuRepository } from './infrastructure/persistence/d1/repositories/D1MenuRepository.js';
import { CreatePageUseCase } from './application/use-cases/CreatePageUseCase.js';
import { UpdatePageContentUseCase } from './application/use-cases/UpdatePageContentUseCase.js';
import { GetPageBySlugUseCase } from './application/use-cases/GetPageBySlugUseCase.js';
import { GetMenuByCodeUseCase } from './application/use-cases/GetMenuByCodeUseCase.js';
import { ListPagesUseCase } from './application/use-cases/ListPagesUseCase.js';
import { DeletePageUseCase } from './application/use-cases/DeletePageUseCase.js';

export interface CmsModuleContainer {
  createPageUseCase: CreatePageUseCase;
  updatePageContentUseCase: UpdatePageContentUseCase;
  getPageBySlugUseCase: GetPageBySlugUseCase;
  getMenuByCodeUseCase: GetMenuByCodeUseCase;
  listPagesUseCase: ListPagesUseCase;
  deletePageUseCase: DeletePageUseCase;
}

export function createCmsModule(env: Env): CmsModuleContainer {
  const pageRepo = new D1PageRepository(env.DB);
  const menuRepo = new D1MenuRepository(env.DB);

  return {
    createPageUseCase: new CreatePageUseCase(pageRepo),
    updatePageContentUseCase: new UpdatePageContentUseCase(pageRepo),
    getPageBySlugUseCase: new GetPageBySlugUseCase(pageRepo),
    getMenuByCodeUseCase: new GetMenuByCodeUseCase(menuRepo),
    listPagesUseCase: new ListPagesUseCase(pageRepo),
    deletePageUseCase: new DeletePageUseCase(pageRepo),
  };
}
