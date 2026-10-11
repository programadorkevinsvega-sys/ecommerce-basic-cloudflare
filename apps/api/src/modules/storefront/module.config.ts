import { Env } from '../../platform/Env.js';
import { D1StorefrontContentRepository } from './infrastructure/persistence/d1/repositories/D1StorefrontContentRepository.js';
import { GetStorefrontHomeContentUseCase } from './application/use-cases/GetStorefrontHomeContentUseCase.js';
import { CreateBannerUseCase } from './application/use-cases/CreateBannerUseCase.js';
import { ListBannersUseCase } from './application/use-cases/ListBannersUseCase.js';
import { DeleteBannerUseCase } from './application/use-cases/DeleteBannerUseCase.js';
import { CreateAnnouncementUseCase } from './application/use-cases/CreateAnnouncementUseCase.js';
import { ListAnnouncementsUseCase } from './application/use-cases/ListAnnouncementsUseCase.js';
import { DeleteAnnouncementUseCase } from './application/use-cases/DeleteAnnouncementUseCase.js';

export interface StorefrontModuleContainer {
  getStorefrontHomeContentUseCase: GetStorefrontHomeContentUseCase;
  createBannerUseCase: CreateBannerUseCase;
  listBannersUseCase: ListBannersUseCase;
  deleteBannerUseCase: DeleteBannerUseCase;
  createAnnouncementUseCase: CreateAnnouncementUseCase;
  listAnnouncementsUseCase: ListAnnouncementsUseCase;
  deleteAnnouncementUseCase: DeleteAnnouncementUseCase;
}

export function createStorefrontModule(env: Env): StorefrontModuleContainer {
  const repo = new D1StorefrontContentRepository(env.DB);

  return {
    getStorefrontHomeContentUseCase: new GetStorefrontHomeContentUseCase(repo),
    createBannerUseCase: new CreateBannerUseCase(repo),
    listBannersUseCase: new ListBannersUseCase(repo),
    deleteBannerUseCase: new DeleteBannerUseCase(repo),
    createAnnouncementUseCase: new CreateAnnouncementUseCase(repo),
    listAnnouncementsUseCase: new ListAnnouncementsUseCase(repo),
    deleteAnnouncementUseCase: new DeleteAnnouncementUseCase(repo),
  };
}
